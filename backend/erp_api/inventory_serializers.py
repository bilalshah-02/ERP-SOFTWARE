# backend/erp_api/inventory_serializers.py - FIXED VERSION
"""
Inventory Module Serializers - PRODUCTION READY (FIXED)

FIXES:
1. ✅ REMOVED 'notes' field from InventoryTransaction.objects.create() - Line 225
2. ✅ REMOVED 'notes' field from stock transfer OUT transaction - Line 430
3. ✅ REMOVED 'notes' field from stock transfer IN transaction - Line 445
4. ✅ Uses source_doc_id instead for tracking

Key Enhancements:
1. Full validation using validators.py
2. Costing engine integration for accurate costs
3. Period closure enforcement
4. GL balance validation
5. Complete error handling
"""

from rest_framework import serializers
from django.db import transaction
from django.core.exceptions import ValidationError as DjangoValidationError
from decimal import Decimal
from datetime import datetime
from . import models

# Import validation utilities
from .validators import (
    validate_item_exists,
    validate_item_is_active,
    validate_warehouse_exists,
    validate_company_exists,
    validate_period_is_open,
    validate_date_not_future,
    validate_positive_quantity,
    validate_gl_balance,
    validate_account_is_posting,
    validate_account_is_active,
    get_open_period,
)

# Import costing engine
from .inventory_costing import InventoryCostingEngine


def model_by_table(table: str):
    """Helper to get model by table name"""
    for name in dir(models):
        cls = getattr(models, name)
        if hasattr(cls, "_meta") and getattr(cls._meta, "db_table", None) == table:
            return cls
    raise LookupError(f"Model for table '{table}' not found in erp_api.models")


# Get models
InventoryTransaction = model_by_table("inventory_transaction")
InventoryBalance = model_by_table("inventory_balance")
DimItem = model_by_table("dim_item")
Warehouse = model_by_table("warehouse")
GlJournal = model_by_table("gl_journal")
GlLine = model_by_table("gl_line")
FiscalPeriod = model_by_table("fiscal_period")
ChartOfAccounts = model_by_table("chart_of_accounts")

# Initialize costing engine
costing_engine = InventoryCostingEngine()


# ==================== INVENTORY TRANSACTION SERIALIZER ====================

class InventoryTransactionSerializer(serializers.Serializer):
    """Serializer for displaying inventory transactions"""
    inv_txn_id = serializers.IntegerField(read_only=True)
    company_key = serializers.IntegerField()
    item_key = serializers.IntegerField()
    item_code = serializers.CharField(read_only=True)
    item_name = serializers.CharField(read_only=True)
    warehouse_key = serializers.IntegerField()
    warehouse_name = serializers.CharField(read_only=True)
    movement_type = serializers.CharField()
    quantity = serializers.DecimalField(max_digits=18, decimal_places=3)
    unit_cost = serializers.DecimalField(max_digits=18, decimal_places=6, required=False)
    total_cost = serializers.DecimalField(max_digits=18, decimal_places=2, required=False)
    transaction_date = serializers.DateField()
    source_doc_type = serializers.CharField(required=False)


# ==================== STOCK ADJUSTMENT SERIALIZER ====================

class StockAdjustmentSerializer(serializers.Serializer):
    """
    Create stock adjustment with validation and optional real costing
    
    Features:
    - Full validation using validators.py
    - Optional real costing (uses average cost if not provided)
    - GL posting optional
    - Period enforcement
    """
    company_key = serializers.IntegerField()
    item_key = serializers.IntegerField()
    warehouse_key = serializers.IntegerField()
    adjustment_date = serializers.DateField()
    quantity = serializers.DecimalField(max_digits=18, decimal_places=3)
    adjustment_type = serializers.ChoiceField(choices=['INCREASE', 'DECREASE'])
    unit_cost = serializers.DecimalField(
        max_digits=18, decimal_places=6, 
        required=False, allow_null=True,
        help_text="Optional: If not provided, uses average cost from inventory"
    )
    reason = serializers.CharField(required=False, allow_blank=True)
    created_by = serializers.IntegerField(required=False, allow_null=True)
    
    # Optional GL posting
    post_to_gl = serializers.BooleanField(default=False)
    inventory_account_key = serializers.IntegerField(required=False, allow_null=True)
    adjustment_account_key = serializers.IntegerField(required=False, allow_null=True)
    
    def validate_company_key(self, value):
        """Validate company exists"""
        try:
            validate_company_exists(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate_item_key(self, value):
        """Validate item exists and is active"""
        try:
            validate_item_exists(value)
            validate_item_is_active(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate_warehouse_key(self, value):
        """Validate warehouse exists"""
        try:
            validate_warehouse_exists(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate_adjustment_date(self, value):
        """Validate adjustment date not in future"""
        try:
            validate_date_not_future(value, "Adjustment date")
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate_quantity(self, value):
        """Validate quantity is positive"""
        try:
            validate_positive_quantity(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        # Validate period is open
        try:
            validate_period_is_open(data['company_key'], data['adjustment_date'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({"adjustment_date": str(e)})
        
        # If GL posting requested, validate accounts
        if data.get('post_to_gl'):
            if not data.get('inventory_account_key') or not data.get('adjustment_account_key'):
                raise serializers.ValidationError({
                    "post_to_gl": "GL accounts required when post_to_gl is True"
                })
            
            try:
                validate_account_is_posting(data['inventory_account_key'])
                validate_account_is_active(data['inventory_account_key'])
                validate_account_is_posting(data['adjustment_account_key'])
                validate_account_is_active(data['adjustment_account_key'])
            except DjangoValidationError as e:
                raise serializers.ValidationError(str(e))
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """
        Create stock adjustment with optional real costing.
        
        If unit_cost not provided, uses average cost from inventory.
        """
        try:
            company_key = validated_data['company_key']
            item_key = validated_data['item_key']
            warehouse_key = validated_data['warehouse_key']
            adjustment_date = validated_data['adjustment_date']
            quantity = validated_data['quantity']
            adjustment_type = validated_data['adjustment_type']
            reason = validated_data.get('reason', '')
            created_by = validated_data.get('created_by')
            post_to_gl = validated_data.get('post_to_gl', False)
            
            # Get unit cost: use provided or fetch from inventory
            unit_cost = validated_data.get('unit_cost')
            
            if not unit_cost or unit_cost == 0:
                # ✅ REAL COST: Get average cost from inventory
                try:
                    unit_cost = costing_engine.get_average_cost(
                        company_key,
                        item_key,
                        warehouse_key
                    )
                except Exception as e:
                    # If no history, use 0
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Could not get average cost for item {item_key}: {str(e)}")
                    unit_cost = Decimal('0.00')
            
            # Determine movement type and quantity sign
            if adjustment_type == 'INCREASE':
                movement_type = 'ADJUSTMENT'
                final_quantity = quantity  # Positive
            else:  # DECREASE
                movement_type = 'ADJUSTMENT'
                final_quantity = -quantity  # Negative
            
            total_cost = quantity * unit_cost
            
            # Generate unique source_doc_id
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            source_doc_id = f"ADJ-{adjustment_type}-{timestamp}"
            
            # ✅ FIX: Create inventory transaction WITHOUT 'notes' field
            inv_txn = InventoryTransaction.objects.create(
                company_key_id=company_key,
                item_key_id=item_key,
                warehouse_key_id=warehouse_key,
                tx_date=adjustment_date,
                movement_type=movement_type,
                quantity=final_quantity,
                unit_cost=unit_cost,  # ✅ Real or average cost
                total_cost=total_cost,
                source_doc_type='STOCK_ADJUSTMENT',
                source_doc_id=source_doc_id  # ✅ Use this instead of notes
            )
            
            # Create GL entry if requested
            gl_journal = None
            if post_to_gl and total_cost > 0:
                period = get_open_period(company_key, adjustment_date)
                
                # Validate GL balance
                gl_lines = [
                    {'debit': total_cost, 'credit': Decimal('0')},
                    {'debit': Decimal('0'), 'credit': total_cost}
                ]
                validate_gl_balance(gl_lines)
                
                gl = GlJournal.objects.create(
                    company_key_id=company_key,
                    journal_number="ADJ-TEMP",
                    journal_date=adjustment_date,
                    period_key=period,
                    description=f"Stock Adjustment: {adjustment_type} - {reason}",
                    status='POSTED',
                    created_by_id=created_by
                )
                
                gl.journal_number = f"ADJ-{adjustment_date.strftime('%Y%m%d')}-{gl.gl_id}"
                gl.save(update_fields=['journal_number'])
                
                # GL Lines based on adjustment type
                if adjustment_type == 'INCREASE':
                    # Dr: Inventory, Cr: Adjustment (expense recovery)
                    GlLine.objects.create(
                        gl=gl,
                        line_no=1,
                        account_key_id=validated_data['inventory_account_key'],
                        description=f"Inventory Increase",
                        debit=total_cost,
                        credit=0
                    )
                    GlLine.objects.create(
                        gl=gl,
                        line_no=2,
                        account_key_id=validated_data['adjustment_account_key'],
                        description=f"Adjustment Credit",
                        debit=0,
                        credit=total_cost
                    )
                else:  # DECREASE
                    # Dr: Adjustment (expense), Cr: Inventory
                    GlLine.objects.create(
                        gl=gl,
                        line_no=1,
                        account_key_id=validated_data['adjustment_account_key'],
                        description=f"Inventory Shrinkage",
                        debit=total_cost,
                        credit=0
                    )
                    GlLine.objects.create(
                        gl=gl,
                        line_no=2,
                        account_key_id=validated_data['inventory_account_key'],
                        description=f"Inventory Decrease",
                        debit=0,
                        credit=total_cost
                    )
                
                gl_journal = gl
            
            return {
                'inventory_transaction': inv_txn,
                'gl_journal': gl_journal,
                'adjustment_type': adjustment_type,
                'quantity': float(quantity),
                'unit_cost': float(unit_cost),
                'total_cost': float(total_cost)
            }
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Stock adjustment failed: {str(e)}")
            raise


# ==================== STOCK TRANSFER SERIALIZER ====================

class StockTransferSerializer(serializers.Serializer):
    """
    Transfer stock between warehouses with validation
    
    Features:
    - Full validation using validators.py
    - Real costing (carries cost from source warehouse)
    - Period enforcement
    - Cannot transfer to same warehouse
    """
    company_key = serializers.IntegerField()
    item_key = serializers.IntegerField()
    from_warehouse_key = serializers.IntegerField()
    to_warehouse_key = serializers.IntegerField()
    transfer_date = serializers.DateField()
    quantity = serializers.DecimalField(max_digits=18, decimal_places=3)
    unit_cost = serializers.DecimalField(
        max_digits=18, decimal_places=6, 
        required=False, allow_null=True,
        help_text="Optional: If not provided, uses average cost from source warehouse"
    )
    notes = serializers.CharField(required=False, allow_blank=True)
    created_by = serializers.IntegerField(required=False, allow_null=True)
    
    def validate_company_key(self, value):
        """Validate company exists"""
        try:
            validate_company_exists(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate_item_key(self, value):
        """Validate item exists and is active"""
        try:
            validate_item_exists(value)
            validate_item_is_active(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate_from_warehouse_key(self, value):
        """Validate source warehouse exists"""
        try:
            validate_warehouse_exists(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate_to_warehouse_key(self, value):
        """Validate destination warehouse exists"""
        try:
            validate_warehouse_exists(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate_transfer_date(self, value):
        """Validate transfer date not in future"""
        try:
            validate_date_not_future(value, "Transfer date")
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate_quantity(self, value):
        """Validate quantity is positive"""
        try:
            validate_positive_quantity(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        # Cannot transfer to same warehouse
        if data['from_warehouse_key'] == data['to_warehouse_key']:
            raise serializers.ValidationError({
                "to_warehouse_key": "Cannot transfer to the same warehouse"
            })
        
        # Validate period is open
        try:
            validate_period_is_open(data['company_key'], data['transfer_date'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({"transfer_date": str(e)})
        
        # Validate stock availability in source warehouse
        try:
            costing_engine.validate_stock_availability(
                data['company_key'],
                data['item_key'],
                data['from_warehouse_key'],
                data['quantity']
            )
        except Exception as e:
            raise serializers.ValidationError({
                "quantity": f"Insufficient stock in source warehouse: {str(e)}"
            })
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """
        Create stock transfer with real costing.
        
        Carries cost from source warehouse to destination.
        """
        try:
            company_key = validated_data['company_key']
            item_key = validated_data['item_key']
            from_warehouse_key = validated_data['from_warehouse_key']
            to_warehouse_key = validated_data['to_warehouse_key']
            transfer_date = validated_data['transfer_date']
            quantity = validated_data['quantity']
            notes = validated_data.get('notes', '')
            
            # Get unit cost: use provided or fetch from source warehouse
            unit_cost = validated_data.get('unit_cost')
            
            if not unit_cost or unit_cost == 0:
                # ✅ REAL COST: Get average cost from source warehouse
                try:
                    unit_cost = costing_engine.get_average_cost(
                        company_key,
                        item_key,
                        from_warehouse_key
                    )
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Could not get cost for transfer: {str(e)}")
                    unit_cost = Decimal('0.00')
            
            total_cost = quantity * unit_cost
            
            # Generate unique source_doc_id for tracking
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            transfer_doc_id = f"TRN-{timestamp}"
            
            # ✅ FIX: Create OUT transaction WITHOUT 'notes' field
            out_txn = InventoryTransaction.objects.create(
                company_key_id=company_key,
                item_key_id=item_key,
                warehouse_key_id=from_warehouse_key,
                tx_date=transfer_date,
                movement_type='TRANSFER',
                quantity=-quantity,  # Negative for OUT
                unit_cost=unit_cost,  # ✅ Real cost
                total_cost=total_cost,
                source_doc_type='STOCK_TRANSFER',
                source_doc_id=transfer_doc_id  # ✅ Use this for tracking
            )
            
            # ✅ FIX: Create IN transaction WITHOUT 'notes' field
            in_txn = InventoryTransaction.objects.create(
                company_key_id=company_key,
                item_key_id=item_key,
                warehouse_key_id=to_warehouse_key,
                tx_date=transfer_date,
                movement_type='TRANSFER',
                quantity=quantity,  # Positive for IN
                unit_cost=unit_cost,  # ✅ Same cost
                total_cost=total_cost,
                source_doc_type='STOCK_TRANSFER',
                source_doc_id=f"{transfer_doc_id}-IN"  # ✅ Link to OUT transaction
            )
            
            return {
                'out_transaction': out_txn,
                'in_transaction': in_txn,
                'quantity': float(quantity),
                'unit_cost': float(unit_cost),
                'total_cost': float(total_cost),
                'from_warehouse': from_warehouse_key,
                'to_warehouse': to_warehouse_key
            }
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Stock transfer failed: {str(e)}")
            raise


# ==================== STOCK BALANCE SERIALIZER ====================

class StockBalanceSerializer(serializers.Serializer):
    """Display stock balance with real costing"""
    item_key = serializers.IntegerField()
    item_code = serializers.CharField()
    item_name = serializers.CharField()
    warehouse_key = serializers.IntegerField()
    warehouse_name = serializers.CharField()
    quantity_on_hand = serializers.DecimalField(max_digits=18, decimal_places=3)
    avg_cost = serializers.DecimalField(max_digits=18, decimal_places=6, required=False)
    total_value = serializers.DecimalField(max_digits=18, decimal_places=2, required=False)


# ==================== STOCK LEDGER SERIALIZER ====================

class StockLedgerSerializer(serializers.Serializer):
    """Stock ledger (transaction history) with running balance"""
    inv_txn_id = serializers.IntegerField()
    transaction_date = serializers.DateField()
    movement_type = serializers.CharField()
    quantity = serializers.DecimalField(max_digits=18, decimal_places=3)
    running_balance = serializers.DecimalField(max_digits=18, decimal_places=3)
    unit_cost = serializers.DecimalField(max_digits=18, decimal_places=6, required=False)
    source_doc_type = serializers.CharField(required=False)

# ==================== PHASE 4: STOCK ADJUSTMENT WITH GL POSTING ====================

class StockAdjustmentSerializer(serializers.Serializer):
    """
    ✅ PHASE 4: Stock Adjustment with Automatic GL Posting
    
    Used for:
    - Physical inventory count corrections
    - Damaged/obsolete inventory write-offs
    - Found inventory (surprise additions)
    
    Automatically posts to GL:
    - Increase: Dr. Inventory / Cr. Inventory Variance (gain)
    - Decrease: Dr. Inventory Variance (loss) / Cr. Inventory
    
    Features:
    - Uses account_config.py for automatic account mapping
    - Real FIFO/Average costing for adjustments
    - Period validation
    - Complete audit trail
    """
    company_key = serializers.IntegerField()
    item_key = serializers.IntegerField()
    warehouse_key = serializers.IntegerField()
    adjustment_date = serializers.DateField()
    adjustment_type = serializers.ChoiceField(
        choices=[('INCREASE', 'Increase'), ('DECREASE', 'Decrease')],
        help_text="INCREASE = found stock, DECREASE = missing/damaged stock"
    )
    quantity = serializers.DecimalField(
        max_digits=18, decimal_places=3,
        help_text="Absolute quantity (always positive)"
    )
    reason = serializers.CharField(
        max_length=200,
        help_text="Reason for adjustment (e.g., 'Physical count correction', 'Damaged goods')"
    )
    reference_no = serializers.CharField(
        max_length=50, required=False, allow_blank=True,
        help_text="Reference number (e.g., physical count document number)"
    )
    created_by = serializers.IntegerField(required=False, allow_null=True)
    
    def validate_company_key(self, value):
        """Validate company exists"""
        try:
            validate_company_exists(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate_item_key(self, value):
        """Validate item exists and is active"""
        try:
            validate_item_exists(value)
            validate_item_is_active(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate_warehouse_key(self, value):
        """Validate warehouse exists"""
        try:
            validate_warehouse_exists(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate_adjustment_date(self, value):
        """Validate adjustment date not in future"""
        try:
            validate_date_not_future(value, "Adjustment date")
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate_quantity(self, value):
        """Validate quantity is positive"""
        try:
            validate_positive_quantity(value, "Adjustment quantity")
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        # Validate period is open
        try:
            validate_period_is_open(data['company_key'], data['adjustment_date'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({"adjustment_date": str(e)})
        
        # For DECREASE, validate we have enough stock
        if data['adjustment_type'] == 'DECREASE':
            costing_engine = InventoryCostingEngine()
            available = costing_engine.get_available_stock(
                data['company_key'],
                data['item_key'],
                data['warehouse_key']
            )
            
            if available < data['quantity']:
                raise serializers.ValidationError({
                    "quantity": f"Cannot decrease by {data['quantity']}. Only {available} available."
                })
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """
        Create stock adjustment with automatic GL posting.
        
        GL Posting Logic:
        - INCREASE (found stock): Dr. Inventory / Cr. Variance (gain)
        - DECREASE (missing): Dr. Variance (loss) / Cr. Inventory
        """
        try:
            # ✅ PHASE 4: Import account config
            from .account_config import get_default_account
            
            InventoryTransaction = model_by_table("inventory_transaction")
            GlJournal = model_by_table("gl_journal")
            GlLine = model_by_table("gl_line")
            
            company_key = validated_data['company_key']
            item_key = validated_data['item_key']
            warehouse_key = validated_data['warehouse_key']
            adjustment_date = validated_data['adjustment_date']
            adjustment_type = validated_data['adjustment_type']
            quantity = validated_data['quantity']
            reason = validated_data['reason']
            reference_no = validated_data.get('reference_no', '')
            created_by = validated_data.get('created_by')
            
            # Get costing engine
            costing_engine = InventoryCostingEngine()
            
            # Calculate cost based on adjustment type
            if adjustment_type == 'INCREASE':
                # For increases, use average cost or a default
                try:
                    unit_cost = costing_engine.get_average_cost(
                        company_key, item_key, warehouse_key
                    )
                except:
                    # If no existing stock, use 0 or could prompt for cost
                    unit_cost = Decimal('0')
                
                txn_quantity = quantity  # Positive
                total_cost = quantity * unit_cost
                
            else:  # DECREASE
                # For decreases, use FIFO cost
                total_cost, unit_cost, layers = costing_engine.get_fifo_cost(
                    company_key, item_key, warehouse_key, quantity
                )
                txn_quantity = -quantity  # Negative for decrease
            
            # Create inventory transaction
            txn = InventoryTransaction.objects.create(
                company_key_id=company_key,
                item_key_id=item_key,
                warehouse_key_id=warehouse_key,
                tx_date=adjustment_date,
                movement_type='ADJUSTMENT',
                quantity=txn_quantity,
                unit_cost=unit_cost,
                total_cost=total_cost if adjustment_type == 'INCREASE' else total_cost,
                source_doc_type='STOCK_ADJUSTMENT',
                source_doc_id=reference_no or f"ADJ-{adjustment_date.strftime('%Y%m%d')}"
            )
            
            # ✅ PHASE 4: Create GL Journal Entry with auto account mapping
            if total_cost > 0:
                period = get_open_period(company_key, adjustment_date)
                
                # Get accounts automatically from config
                inventory_account = get_default_account(company_key, 'inventory_asset')
                variance_account = get_default_account(company_key, 'inventory_variance')
                
                gl = GlJournal.objects.create(
                    company_key_id=company_key,
                    journal_number=f"ADJ-{adjustment_date.strftime('%Y%m%d')}-{txn.inv_txn_id}",
                    journal_date=adjustment_date,
                    period_key=period,
                    description=f"Stock Adjustment: {reason}",
                    status='POSTED',
                    created_by_id=None
                )
                
                if adjustment_type == 'INCREASE':
                    # Dr. Inventory / Cr. Variance (gain)
                    GlLine.objects.create(
                        gl=gl,
                        line_no=1,
                        account_key_id=inventory_account,
                        debit=total_cost,
                        credit=Decimal('0'),
                        description=f"Stock increase - {reason[:50]}"
                    )
                    
                    GlLine.objects.create(
                        gl=gl,
                        line_no=2,
                        account_key_id=variance_account,
                        debit=Decimal('0'),
                        credit=total_cost,
                        description=f"Inventory gain - {reason[:50]}"
                    )
                else:  # DECREASE
                    # Dr. Variance (loss) / Cr. Inventory
                    GlLine.objects.create(
                        gl=gl,
                        line_no=1,
                        account_key_id=variance_account,
                        debit=total_cost,
                        credit=Decimal('0'),
                        description=f"Inventory loss - {reason[:50]}"
                    )
                    
                    GlLine.objects.create(
                        gl=gl,
                        line_no=2,
                        account_key_id=inventory_account,
                        debit=Decimal('0'),
                        credit=total_cost,
                        description=f"Stock decrease - {reason[:50]}"
                    )
            else:
                gl = None
            
            return {
                'transaction': {
                    'inv_txn_id': txn.inv_txn_id,
                    'adjustment_type': adjustment_type,
                    'quantity': float(quantity),
                    'unit_cost': float(unit_cost),
                    'total_cost': float(total_cost)
                },
                'gl_journal': {
                    'gl_id': gl.gl_id,
                    'journal_number': gl.journal_number
                } if gl else None,
                'message': f'Stock adjustment posted successfully'
            }
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Stock adjustment failed: {str(e)}")
            raise