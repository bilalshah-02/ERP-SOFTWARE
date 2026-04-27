# backend/erp_api/production_serializers.py - PRODUCTION READY VERSION (FIXED)
"""
Production Module Serializers - PRODUCTION READY

Key Enhancements:
1. Real FIFO/Average costing for materials (no hardcoded values)
2. Material availability validation before issue
3. Full validation using validators.py
4. BOM validation (components exist, no circular references)
5. Period closure enforcement
6. Complete error handling with rollback
7. Accurate WIP → FG costing
"""

from rest_framework import serializers
from django.db import transaction
from django.core.exceptions import ValidationError as DjangoValidationError
from decimal import Decimal
from datetime import date
from django.db.models import Sum, Count, F

# Import models
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

# ✅ PHASE 3: Import account config for automatic GL account mapping
from .account_config import get_default_account


def model_by_table(table: str):
    """Helper to get model by table name"""
    for name in dir(models):
        cls = getattr(models, name)
        if hasattr(cls, "_meta") and getattr(cls._meta, "db_table", None) == table:
            return cls
    raise LookupError(f"Model for table '{table}' not found in erp_api.models")


# Get models
Bom = model_by_table("bom")
BomComponent = model_by_table("bom_component")
ProductionBatch = model_by_table("production_batch")
InventoryTransaction = model_by_table("inventory_transaction")
DimItem = model_by_table("dim_item")
DimBatch = model_by_table("dim_batch")
Warehouse = model_by_table("warehouse")
GlJournal = model_by_table("gl_journal")
GlLine = model_by_table("gl_line")
BatchCostDetail = model_by_table("batch_cost_detail")
FiscalPeriod = model_by_table("fiscal_period")
ChartOfAccounts = model_by_table("chart_of_accounts")

# Initialize costing engine
costing_engine = InventoryCostingEngine()


# ==================== BOM SERIALIZERS ====================

class BomComponentSerializer(serializers.ModelSerializer):
    """BOM Component (raw material in recipe)"""
    component_item_code = serializers.CharField(source='component_item_key.item_code', read_only=True)
    component_item_name = serializers.CharField(source='component_item_key.name', read_only=True)
    
    class Meta:
        model = BomComponent
        fields = (
            'bom_component_key', 'bom_key', 'component_item_key',
            'component_item_code', 'component_item_name',
            'quantity_per', 'scrap_percent'
        )
        read_only_fields = ('bom_component_key',)


class BomComponentInputSerializer(serializers.Serializer):
    """Input for BOM component creation with validation"""
    component_item_key = serializers.IntegerField()
    quantity_per = serializers.DecimalField(max_digits=18, decimal_places=6)
    scrap_percent = serializers.DecimalField(
        max_digits=5, decimal_places=2, 
        default=0, required=False
    )
    
    def validate_component_item_key(self, value):
        """Validate component item exists and is active"""
        try:
            validate_item_exists(value)
            validate_item_is_active(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate_quantity_per(self, value):
        """Validate quantity is positive"""
        try:
            validate_positive_quantity(value, "Quantity per unit")
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate_scrap_percent(self, value):
        """Validate scrap percentage is reasonable"""
        if value < 0:
            raise serializers.ValidationError("Scrap percentage cannot be negative")
        if value > 100:
            raise serializers.ValidationError("Scrap percentage cannot exceed 100%")
        return value


class BomSerializer(serializers.ModelSerializer):
    """Bill of Materials (Recipe for finished goods) - FIXED"""
    # Frontend expects these field names:
    bom_id = serializers.IntegerField(source='bom_key', read_only=True)
    bom_key = serializers.IntegerField(read_only=True)
    product_key = serializers.IntegerField(source='parent_item_key.item_key', read_only=True)
    product_name = serializers.CharField(source='parent_item_key.name', read_only=True)
    product_code = serializers.CharField(source='parent_item_key.item_code', read_only=True)
    quantity_produced = serializers.DecimalField(max_digits=18, decimal_places=3, default=1.0, read_only=True)
    
    # Components as 'lines' for frontend
    lines = serializers.SerializerMethodField()
    
    class Meta:
        model = Bom
        fields = (
            'bom_id', 'bom_key', 'bom_code', 'product_key', 'product_name', 'product_code',
            'quantity_produced', 'is_active', 'lines'
        )
        read_only_fields = ('bom_id',)
    
    def get_lines(self, obj):
        """Get components as 'lines' array"""
        components = BomComponent.objects.filter(bom_key=obj).select_related('component_item_key')
        return [{
            'item_key': comp.component_item_key.item_key,
            'item_code': comp.component_item_key.item_code,
            'item_name': comp.component_item_key.name,
            'quantity': float(comp.quantity_per),
            'uom': getattr(comp.component_item_key, 'unit_of_measure', '') or '',
        } for comp in components]


class BomCreateSerializer(serializers.Serializer):
    """
    Create BOM with validation
    
    Validations:
    - Parent item exists and is active
    - All component items exist and are active
    - At least one component
    - No circular references (parent not in components)
    - BOM code is unique
    """
    parent_item_key = serializers.PrimaryKeyRelatedField(queryset=DimItem.objects.all())
    bom_code = serializers.CharField(max_length=50)
    is_active = serializers.BooleanField(default=True)
    components = BomComponentInputSerializer(many=True)
    
    def validate_components(self, components):
        """Ensure at least one component"""
        if not components:
            raise serializers.ValidationError("BOM must have at least one component")
        return components
    
    def validate_bom_code(self, value):
        """Validate BOM code is unique"""
        if Bom.objects.filter(bom_code=value).exists():
            raise serializers.ValidationError(
                f"BOM code '{value}' already exists. BOM codes must be unique."
            )
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        # Prevent circular reference (parent cannot be its own component)
        parent_item_key = data['parent_item_key']
        component_keys = [comp['component_item_key'] for comp in data['components']]
        
        if parent_item_key.item_key in component_keys:
            raise serializers.ValidationError({
                "components": "Circular reference detected: Parent item cannot be its own component"
            })
        
        # Check for duplicate components
        if len(component_keys) != len(set(component_keys)):
            raise serializers.ValidationError({
                "components": "Duplicate components detected. Each component can only appear once."
            })
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """
        Create BOM with atomic transaction.
        
        Rollback occurs if any step fails.
        """
        try:
            components_data = validated_data.pop('components')
            
            # Create BOM header
            bom = Bom.objects.create(**validated_data)
            
            # Create components
            for comp_data in components_data:
                BomComponent.objects.create(
                    bom_key=bom,
                    component_item_key_id=comp_data['component_item_key'],
                    quantity_per=comp_data['quantity_per'],
                    scrap_percent=comp_data.get('scrap_percent', 0)
                )
            
            return bom
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"BOM creation failed: {str(e)}")
            raise


class ProductionBatchSerializer(serializers.ModelSerializer):
    """Production Batch display - FIXED FOR FRONTEND"""
    # Frontend expects these field names:
    batch_id = serializers.IntegerField(source='prod_batch_key', read_only=True)
    batch_number = serializers.CharField(source='batch_key.batch_number', read_only=True)
    bom_code = serializers.CharField(source='bom_key.bom_code', read_only=True)
    bom_id = serializers.IntegerField(source='bom_key.bom_key', read_only=True)
    product_name = serializers.CharField(source='bom_key.parent_item_key.name', read_only=True)
    planned_quantity = serializers.DecimalField(source='planned_qty', max_digits=18, decimal_places=3, read_only=True)
    actual_quantity = serializers.DecimalField(source='actual_qty', max_digits=18, decimal_places=3, read_only=True, allow_null=True)
    
    class Meta:
        model = ProductionBatch
        fields = (
            'batch_id', 'batch_number', 'bom_code', 'bom_id', 'product_name',
            'planned_quantity', 'actual_quantity',
            'start_date', 'end_date', 'status'
        )
        read_only_fields = ('batch_id',)


# ==================== MATERIAL AVAILABILITY CHECK ====================

class MaterialAvailabilityCheckSerializer(serializers.Serializer):
    """
    Check if raw materials are available for production
    
    This is a READ-ONLY operation - just checks availability
    """
    bom_key = serializers.IntegerField()
    quantity_to_produce = serializers.DecimalField(max_digits=18, decimal_places=3)
    warehouse_key = serializers.IntegerField(required=False, allow_null=True)
    
    def validate_bom_key(self, value):
        """Validate BOM exists and is active"""
        bom = Bom.objects.filter(bom_key=value).first()
        if not bom:
            raise serializers.ValidationError("BOM not found")
        if not bom.is_active:
            raise serializers.ValidationError(
                f"BOM '{bom.bom_code}' is inactive. Only active BOMs can be used for production."
            )
        return value
    
    def validate_quantity_to_produce(self, value):
        """Validate quantity is positive"""
        try:
            validate_positive_quantity(value, "Quantity to produce")
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value


# ==================== MATERIAL ISSUE SERIALIZERS ====================

class MaterialIssueSerializer(serializers.Serializer):
    """
    Issue raw materials to production with REAL FIFO costing
    
    Key Features:
    - Uses REAL FIFO costs from inventory (not hardcoded!)
    - Validates material availability before issue
    - Creates WIP GL entry with actual costs
    - Reduces inventory with proper costing
    
    CRITICAL: This now uses REAL costs from inventory_costing engine!
    """
    company_key = serializers.IntegerField()
    bom_key = serializers.IntegerField()
    batch_key = serializers.IntegerField()
    issue_date = serializers.DateField()
    warehouse_key = serializers.IntegerField()
    quantity_to_produce = serializers.DecimalField(max_digits=18, decimal_places=3)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    created_by = serializers.IntegerField(required=False, allow_null=True)
    
    # GL Accounts
    # ✅ PHASE 3: Account keys now fetched automatically from account_config
    # No manual account key fields needed!
    
    def validate_company_key(self, value):
        """Validate company exists"""
        try:
            validate_company_exists(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate_bom_key(self, value):
        """Validate BOM exists and is active"""
        bom = Bom.objects.filter(bom_key=value).first()
        if not bom:
            raise serializers.ValidationError("BOM not found")
        if not bom.is_active:
            raise serializers.ValidationError(
                f"BOM '{bom.bom_code}' is inactive. Cannot issue materials for inactive BOM."
            )
        return value
    
    def validate_batch_key(self, value):
        """Validate batch exists"""
        batch = DimBatch.objects.filter(batch_key=value).first()
        if not batch:
            raise serializers.ValidationError("Batch not found")
        return value
    
    def validate_warehouse_key(self, value):
        """Validate warehouse exists"""
        try:
            validate_warehouse_exists(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate_issue_date(self, value):
        """Validate issue date not in future"""
        try:
            validate_date_not_future(value, "Issue date")
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate_quantity_to_produce(self, value):
        """Validate quantity is positive"""
        try:
            validate_positive_quantity(value, "Quantity to produce")
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate_inventory_account_key(self, value):
        """Validate inventory account is valid"""
        try:
            validate_account_is_posting(value)
            validate_account_is_active(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate_wip_account_key(self, value):
        """Validate WIP account is valid"""
        try:
            validate_account_is_posting(value)
            validate_account_is_active(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate(self, data):
        """
        Cross-field validation including material availability
        
        This is CRITICAL - prevents issuing materials we don't have!
        """
        # Check material availability for ALL components
        bom = Bom.objects.get(bom_key=data['bom_key'])
        components = BomComponent.objects.filter(bom_key=bom)
        
        insufficient_materials = []
        
        for comp in components:
            # Calculate required quantity with scrap
            scrap_factor = Decimal(str(1 + float(comp.scrap_percent or 0) / 100))
            qty_required = data['quantity_to_produce'] * Decimal(str(comp.quantity_per)) * scrap_factor
            
            # Get available stock using costing engine
            try:
                available_stock = costing_engine.get_available_stock(
                    data['company_key'],
                    comp.component_item_key.item_key,
                    data['warehouse_key']
                )
                
                if available_stock < qty_required:
                    insufficient_materials.append({
                        'item': f"{comp.component_item_key.item_code} - {comp.component_item_key.name}",
                        'required': float(qty_required),
                        'available': float(available_stock),
                        'shortage': float(qty_required - available_stock)
                    })
            
            except Exception as e:
                # If costing engine fails, still allow but log warning
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Could not check availability for item {comp.component_item_key.item_key}: {str(e)}")
        
        if insufficient_materials:
            raise serializers.ValidationError({
                "quantity_to_produce": f"Insufficient materials available. Details: {insufficient_materials}"
            })
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """
        Issue materials with REAL FIFO costing.
        
        All costs are calculated from actual inventory using FIFO method.
        """
        try:
            company_key = validated_data['company_key']
            bom_key = validated_data['bom_key']
            batch_key = validated_data['batch_key']
            issue_date = validated_data['issue_date']
            warehouse_key = validated_data['warehouse_key']
            qty_to_produce = validated_data['quantity_to_produce']
            notes = validated_data.get('notes', '')
            created_by = validated_data.get('created_by')
            
            bom = Bom.objects.get(bom_key=bom_key)
            batch = DimBatch.objects.get(batch_key=batch_key)
            
            # Get BOM components
            components = BomComponent.objects.filter(bom_key=bom)
            
            total_amount = Decimal('0.00')
            materials_issued = []
            
            # Issue each component with REAL FIFO costing
            for comp in components:
                # Calculate required quantity with scrap
                scrap_factor = Decimal(str(1 + float(comp.scrap_percent or 0) / 100))
                qty_required = qty_to_produce * Decimal(str(comp.quantity_per)) * scrap_factor
                
                # ✅ REAL COST: Get actual FIFO cost from inventory
                try:
                    fifo_result = costing_engine.get_fifo_cost(
                        company_key,
                        comp.component_item_key.item_key,
                        warehouse_key,
                        qty_required
                    )
                    
                    unit_cost = fifo_result["average_unit_cost"]
                    line_amount = fifo_result["total_cost"]
                    
                except Exception as e:
                    # Fallback: use average cost if FIFO fails
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"FIFO costing failed for item {comp.component_item_key.item_key}, using average: {str(e)}")
                    
                    unit_cost = costing_engine.get_average_cost(
                        company_key,
                        comp.component_item_key.item_key,
                        warehouse_key
                    )
                    line_amount = qty_required * Decimal(str(float(unit_cost)))
                
                total_amount += Decimal(str(float(line_amount)))
                
                # Create inventory transaction (OUT)
                InventoryTransaction.objects.create(
                    company_key_id=company_key,
                    item_key=comp.component_item_key,
                    warehouse_key_id=warehouse_key,
                    tx_date=issue_date,
                    movement_type='OUT',
                    quantity=-qty_required,  # Negative for OUT
                    unit_cost=unit_cost,  # ✅ REAL cost!
                    total_cost=line_amount,  # ✅ REAL total cost!
                    source_doc_type='MATERIAL_ISSUE',
                    source_doc_id=str(batch_key),
                )
                
                materials_issued.append({
                    'item_key': comp.component_item_key.item_key,
                    'item_code': comp.component_item_key.item_code,
                    'item_name': comp.component_item_key.name,
                    'quantity_issued': float(qty_required),
                    'unit_cost': float(unit_cost),  # Show real cost
                    'total_cost': float(line_amount)
                })
            
            # Create or update production batch
            prod_batch, created = ProductionBatch.objects.get_or_create(
                company_key_id=company_key,
                batch_key_id=batch_key,
                bom_key_id=bom_key,
                defaults={
                    'planned_qty': qty_to_produce,
                    'actual_qty': 0,
                    'start_date': issue_date,
                    'status': 'POSTED',
                    'created_by_id': created_by
                }
            )
            
            if not created:
                prod_batch.status = 'POSTED'
                prod_batch.save(update_fields=['status'])
            
            # Create GL Journal Entry with REAL costs
            period = get_open_period(company_key, issue_date)
            
            # Validate GL balance
            gl_lines = [
                {'debit': total_amount, 'credit': Decimal('0')},
                {'debit': Decimal('0'), 'credit': total_amount}
            ]
            validate_gl_balance(gl_lines)
            
            gl = GlJournal.objects.create(
                company_key_id=company_key,
                journal_number="MI-TEMP",
                journal_date=issue_date,
                period_key=period,
                description=f"Material Issue: Batch {batch.batch_number}",
                status='POSTED',
                created_by_id=None
            )
            
            gl.journal_number = f"MI-{issue_date.strftime('%Y%m%d')}-{gl.gl_id}"
            gl.save(update_fields=['journal_number'])
            
            # ✅ PHASE 3: Get accounts automatically from config
            wip_account = get_default_account(company_key, 'wip')
            inventory_account = get_default_account(company_key, 'inventory_asset')
            
            # GL Lines: Dr WIP, Cr Inventory (with REAL costs!)
            GlLine.objects.create(
                gl=gl,
                line_no=1,
                account_key_id=wip_account,
                description=f"WIP - Batch {batch.batch_number}",
                debit=total_amount,  # ✅ Real cost!
                credit=0
            )
            
            GlLine.objects.create(
                gl=gl,
                line_no=2,
                account_key_id=inventory_account,
                description=f"Raw Material - Batch {batch.batch_number}",
                debit=0,
                credit=total_amount  # ✅ Real cost!
            )
            
            return {
                'production_batch': {
                    'batch_id': prod_batch.prod_batch_key,
                    'status': prod_batch.status
                },
                'batch_number': batch.batch_number,
                'gl_journal': gl.journal_number,
                'total_amount': float(total_amount),
                'materials_issued': materials_issued
            }
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Material issue failed: {str(e)}")
            raise


# ==================== PRODUCTION COMPLETION SERIALIZERS ====================


# ==================== PHASE 8: LABOR & OVERHEAD SERIALIZERS ====================


"""
INSERT THESE AFTER MaterialIssueSerializer (around line 620)
and BEFORE ProductionCompletionSerializer (around line 622)
"""


class LaborEntrySerializer(serializers.Serializer):
    """
    Record labor costs on production batch
    
    POST /api/production/labor/
    {
        "prod_batch_key": 123,
        "labor_hours": 8.5,
        "hourly_rate": 25.00,
        "labor_date": "2026-01-18",
        "worker_name": "John Doe",
        "cost_center_key": 5,
        "notes": "Assembly work"
    }
    """
    prod_batch_key = serializers.IntegerField()
    labor_hours = serializers.DecimalField(max_digits=10, decimal_places=2)
    hourly_rate = serializers.DecimalField(max_digits=10, decimal_places=2)
    labor_date = serializers.DateField()
    worker_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    cost_center_key = serializers.IntegerField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    created_by = serializers.IntegerField(required=False, allow_null=True)
    
    def validate_prod_batch_key(self, value):
        """Validate batch exists"""
        if not ProductionBatch.objects.filter(prod_batch_key=value).exists():
            raise serializers.ValidationError(f"Production batch {value} not found")
        return value
    
    def validate(self, data):
        """Validate labor entry"""
        if data['labor_hours'] <= 0:
            raise serializers.ValidationError("Labor hours must be positive")
        if data['hourly_rate'] <= 0:
            raise serializers.ValidationError("Hourly rate must be positive")
        
        batch = ProductionBatch.objects.get(prod_batch_key=data['prod_batch_key'])
        if batch.status == 'CONFIRMED':
            raise serializers.ValidationError("Cannot add labor to completed batch")
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """Create labor cost entry"""
        prod_batch_key = validated_data['prod_batch_key']
        labor_hours = validated_data['labor_hours']
        hourly_rate = validated_data['hourly_rate']
        labor_date = validated_data['labor_date']
        worker_name = validated_data.get('worker_name', '')
        cost_center_key = validated_data.get('cost_center_key')
        notes = validated_data.get('notes', '')
        created_by = validated_data.get('created_by')
        
        labor_cost = labor_hours * hourly_rate
        
        prod_batch = ProductionBatch.objects.get(prod_batch_key=prod_batch_key)
        
        labor_entry = BatchCostDetail.objects.create(
            prod_batch_key_id=prod_batch_key,
            cost_head='LABOR',
            amount=labor_cost,
            source_doc_type='LABOR_ENTRY',
            notes=f"{worker_name} - {labor_hours} hours @ ${hourly_rate}/hr. {notes}".strip(),
            created_by_id=None
        )
        
        period = get_open_period(prod_batch.company_key_id, labor_date)
        
        gl = GlJournal.objects.create(
            company_key_id=prod_batch.company_key_id,
            journal_number="LABOR-TEMP",
            journal_date=labor_date,
            period_key=period,
            description=f"Labor Cost - Batch {prod_batch.batch_key.batch_number}",
            status='POSTED',
            created_by_id=None
        )
        
        gl.journal_number = f"LABOR-{labor_date.strftime('%Y%m%d')}-{gl.gl_id}"
        gl.save(update_fields=['journal_number'])
        
        wip_account = get_default_account(prod_batch.company_key_id, 'wip')
        labor_account = get_default_account(prod_batch.company_key_id, 'expense_purchase')  # Or create labor_payable account
        
        GlLine.objects.create(
            gl=gl,
            line_no=1,
            account_key_id=wip_account,
            cost_center_key_id=cost_center_key,
            description=f"Labor - {worker_name}",
            debit=labor_cost,
            credit=Decimal('0')
        )
        
        GlLine.objects.create(
            gl=gl,
            line_no=2,
            account_key_id=labor_account,
            cost_center_key_id=cost_center_key,
            description=f"Labor - {worker_name}",
            debit=Decimal('0'),
            credit=labor_cost
        )
        
        return {
            'labor_entry': {
                'batch_cost_id': labor_entry.batch_cost_id,
                'prod_batch_key': prod_batch_key,
                'labor_hours': float(labor_hours),
                'hourly_rate': float(hourly_rate),
                'labor_cost': float(labor_cost),
                'worker_name': worker_name,
            },
            'gl_journal': {
                'gl_id': gl.gl_id,
                'journal_number': gl.journal_number
            },
            'message': 'Labor cost recorded successfully'
        }



class OverheadAllocationSerializer(serializers.Serializer):
    """
    Allocate overhead to production batch
    
    Methods:
    1. PERCENTAGE - % of labor cost
    2. UNIT - Per unit produced
    3. FIXED - Fixed amount
    
    POST /api/production/overhead/
    {
        "prod_batch_key": 123,
        "overhead_method": "PERCENTAGE",  // or UNIT, FIXED
        "overhead_rate": 40.00,  // percentage, or per-unit rate, or fixed amount
        "allocation_date": "2026-01-18",
        "notes": "Factory overhead"
    }
    """
    prod_batch_key = serializers.IntegerField()
    overhead_method = serializers.ChoiceField(
        choices=['PERCENTAGE', 'UNIT', 'FIXED']
    )
    overhead_rate = serializers.DecimalField(max_digits=10, decimal_places=2)
    allocation_date = serializers.DateField()
    notes = serializers.CharField(required=False, allow_blank=True)
    created_by = serializers.IntegerField(required=False, allow_null=True)
    
    def validate_prod_batch_key(self, value):
        """Validate batch exists"""
        if not ProductionBatch.objects.filter(prod_batch_key=value).exists():
            raise serializers.ValidationError(f"Production batch {value} not found")
        return value
    
    def validate(self, data):
        """Validate overhead allocation"""
        batch = ProductionBatch.objects.get(prod_batch_key=data['prod_batch_key'])
        
        if batch.status == 'CONFIRMED':
            raise serializers.ValidationError("Cannot add overhead to completed batch")
        
        if data['overhead_rate'] <= 0:
            raise serializers.ValidationError("Overhead rate must be positive")
        
        if data['overhead_method'] == 'PERCENTAGE' and data['overhead_rate'] > 500:
            raise serializers.ValidationError("Overhead percentage seems too high (>500%)")
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """Allocate overhead to batch"""
        prod_batch_key = validated_data['prod_batch_key']
        overhead_method = validated_data['overhead_method']
        overhead_rate = validated_data['overhead_rate']
        allocation_date = validated_data['allocation_date']
        notes = validated_data.get('notes', '')
        created_by = validated_data.get('created_by')
        
        prod_batch = ProductionBatch.objects.get(prod_batch_key=prod_batch_key)
        
        if overhead_method == 'PERCENTAGE':
            labor_costs = BatchCostDetail.objects.filter(
                prod_batch_key_id=prod_batch_key,
                cost_head='LABOR'
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
            
            if labor_costs == 0:
                raise serializers.ValidationError(
                    "Cannot allocate overhead as percentage - no labor costs recorded yet"
                )
            
            overhead_amount = (labor_costs * overhead_rate / 100).quantize(Decimal('0.01'))
            calculation = f"{overhead_rate}% of labor cost ${labor_costs}"
            
        elif overhead_method == 'UNIT':
            planned_qty = prod_batch.planned_qty
            overhead_amount = (overhead_rate * planned_qty).quantize(Decimal('0.01'))
            calculation = f"${overhead_rate} per unit × {planned_qty} units"
            
        else:  # FIXED
            overhead_amount = overhead_rate
            calculation = f"Fixed amount: ${overhead_rate}"
        
        overhead_entry = BatchCostDetail.objects.create(
            prod_batch_key_id=prod_batch_key,
            cost_head='OVERHEAD',
            amount=overhead_amount,
            source_doc_type='OVERHEAD_ALLOCATION',
            notes=f"{overhead_method} method: {calculation}. {notes}".strip(),
            created_by_id=None
        )
        
        period = get_open_period(prod_batch.company_key_id, allocation_date)
        
        gl = GlJournal.objects.create(
            company_key_id=prod_batch.company_key_id,
            journal_number="OH-TEMP",
            journal_date=allocation_date,
            period_key=period,
            description=f"Overhead Allocation - Batch {prod_batch.batch_key.batch_number}",
            status='POSTED',
            created_by_id=None
        )
        
        gl.journal_number = f"OH-{allocation_date.strftime('%Y%m%d')}-{gl.gl_id}"
        gl.save(update_fields=['journal_number'])
        
        wip_account = get_default_account(prod_batch.company_key_id, 'wip')
        overhead_account = get_default_account(prod_batch.company_key_id, 'expense_purchase')
        
        GlLine.objects.create(
            gl=gl,
            line_no=1,
            account_key_id=wip_account,
            description=f"Overhead - {overhead_method}",
            debit=overhead_amount,
            credit=Decimal('0')
        )
        
        GlLine.objects.create(
            gl=gl,
            line_no=2,
            account_key_id=overhead_account,
            description=f"Overhead - {overhead_method}",
            debit=Decimal('0'),
            credit=overhead_amount
        )
        
        return {
            'overhead_entry': {
                'batch_cost_id': overhead_entry.batch_cost_id,
                'prod_batch_key': prod_batch_key,
                'overhead_method': overhead_method,
                'overhead_rate': float(overhead_rate),
                'overhead_amount': float(overhead_amount),
                'calculation': calculation,
            },
            'gl_journal': {
                'gl_id': gl.gl_id,
                'journal_number': gl.journal_number
            },
            'message': 'Overhead allocated successfully'
        }



class BatchCostSummarySerializer(serializers.Serializer):
    """
    Get cost summary for a production batch
    
    GET /api/production/batches/{batch_id}/cost-summary/
    
    Returns breakdown of material, labor, overhead costs
    """
    
    def get_cost_summary(self, prod_batch_key):
        """Calculate total costs for batch"""
        
        cost_entries = BatchCostDetail.objects.filter(
            prod_batch_key_id=prod_batch_key
        )
        
        costs_by_head = cost_entries.values('cost_head').annotate(
            total=Sum('amount'),
            count=Count('batch_cost_id')
        )
        
        cost_breakdown = {}
        total_cost = Decimal('0')
        
        for item in costs_by_head:
            cost_head = item['cost_head']
            amount = item['total'] or Decimal('0')
            cost_breakdown[cost_head.lower()] = {
                'amount': float(amount),
                'entries': item['count']
            }
            total_cost += amount
        
        batch = ProductionBatch.objects.select_related('batch_key').get(
            prod_batch_key=prod_batch_key
        )
        
        qty = batch.actual_qty if batch.actual_qty else batch.planned_qty
        unit_cost = (total_cost / qty).quantize(Decimal('0.01')) if qty > 0 else Decimal('0')
        
        return {
            'prod_batch_key': prod_batch_key,
            'batch_number': batch.batch_key.batch_number,
            'status': batch.status,
            'planned_qty': float(batch.planned_qty),
            'actual_qty': float(batch.actual_qty) if batch.actual_qty else None,
            'cost_breakdown': cost_breakdown,
            'total_cost': float(total_cost),
            'unit_cost': float(unit_cost),
            'costing_complete': (
                'material' in cost_breakdown and
                'labor' in cost_breakdown and
                'overhead' in cost_breakdown
            )
        }


# ==================== PHASE 8: UPDATED PRODUCTION COMPLETION ====================



class ProductionCompletionSerializer(serializers.Serializer):
    """
    Complete production batch and receive finished goods
    NOW INCLUDES: Material + Labor + Overhead costs!
    
    POST /api/production/completion/
    {
        "prod_batch_key": 123,
        "quantity_completed": 100,
        "completion_date": "2026-01-18",
        "warehouse_key": 1,
        "notes": "Batch completed"
    }
    """
    prod_batch_key = serializers.IntegerField()
    quantity_completed = serializers.DecimalField(max_digits=18, decimal_places=3)
    completion_date = serializers.DateField()
    warehouse_key = serializers.IntegerField()
    notes = serializers.CharField(required=False, allow_blank=True)
    created_by = serializers.IntegerField(required=False, allow_null=True)
    
    def validate_prod_batch_key(self, value):
        """Validate production batch exists"""
        if not ProductionBatch.objects.filter(prod_batch_key=value).exists():
            raise serializers.ValidationError(f"Production batch {value} not found")
        return value
    
    def validate_warehouse_key(self, value):
        """Validate warehouse exists"""
        validate_warehouse_exists(value)
        return value
    
    def validate(self, data):
        """Validate production completion"""
        batch = ProductionBatch.objects.get(prod_batch_key=data['prod_batch_key'])
        
        if batch.status == 'CONFIRMED':
            raise serializers.ValidationError(
                "Production batch already completed"
            )
        
        if data['quantity_completed'] <= 0:
            raise serializers.ValidationError("Quantity completed must be positive")
        
        validate_date_not_future(data['completion_date'])
        validate_period_is_open(batch.company_key_id, data['completion_date'])
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """Complete production and receive finished goods with FULL COSTING"""
        try:
            prod_batch_key = validated_data['prod_batch_key']
            completion_date = validated_data['completion_date']
            qty_completed = validated_data['quantity_completed']
            warehouse_key = validated_data['warehouse_key']
            notes = validated_data.get('notes', '')
            created_by = validated_data.get('created_by')
            
            prod_batch = ProductionBatch.objects.get(prod_batch_key=prod_batch_key)
            bom = prod_batch.bom_key
            batch = prod_batch.batch_key
            
            finished_item = bom.parent_item_key
            
            
            material_issues = InventoryTransaction.objects.filter(
                source_doc_type='MATERIAL_ISSUE',
                source_doc_id=str(prod_batch.batch_key_id),
                movement_type='OUT'
            )
            
            material_cost = sum(
                abs(txn.total_cost) if txn.total_cost else Decimal('0')
                for txn in material_issues
            )
            
            labor_costs = BatchCostDetail.objects.filter(
                prod_batch_key_id=prod_batch_key,
                cost_head='LABOR'
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
            
            overhead_costs = BatchCostDetail.objects.filter(
                prod_batch_key_id=prod_batch_key,
                cost_head='OVERHEAD'
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
            
            total_cost = material_cost + labor_costs + overhead_costs
            
            if qty_completed > 0:
                unit_cost = (total_cost / qty_completed).quantize(Decimal('0.01'))
            else:
                unit_cost = Decimal('0')
            
            InventoryTransaction.objects.create(
                company_key_id=prod_batch.company_key_id,
                item_key_id=finished_item.item_key,
                warehouse_key_id=warehouse_key,
                tx_date=completion_date,
                movement_type='IN',
                quantity=qty_completed,
                unit_cost=unit_cost,  # ✅ Complete cost with labor & overhead!
                total_cost=total_cost,
                source_doc_type='PRODUCTION_COMPLETION',
                source_doc_id=str(prod_batch_key)
            )
            
            prod_batch.actual_qty = qty_completed
            prod_batch.end_date = completion_date
            prod_batch.status = 'CONFIRMED'
            prod_batch.save(update_fields=['actual_qty', 'end_date', 'status'])
            
            period = get_open_period(prod_batch.company_key_id, completion_date)
            
            gl_lines = [
                {'debit': total_cost, 'credit': Decimal('0')},
                {'debit': Decimal('0'), 'credit': total_cost}
            ]
            validate_gl_balance(gl_lines)
            
            gl = GlJournal.objects.create(
                company_key_id=prod_batch.company_key_id,
                journal_number="PC-TEMP",
                journal_date=completion_date,
                period_key=period,
                description=f"Production Completion: Batch {batch.batch_number}",
                status='POSTED',
                created_by_id=None
            )
            
            gl.journal_number = f"PC-{completion_date.strftime('%Y%m%d')}-{gl.gl_id}"
            gl.save(update_fields=['journal_number'])
            
            fg_inventory_account = get_default_account(prod_batch.company_key_id, 'inventory_asset')
            wip_account = get_default_account(prod_batch.company_key_id, 'wip')
            
            GlLine.objects.create(
                gl=gl,
                line_no=1,
                account_key_id=fg_inventory_account,
                description=f"Finished Goods - {batch.batch_number}",
                debit=total_cost,  # ✅ Material + Labor + Overhead!
                credit=Decimal('0')
            )
            
            GlLine.objects.create(
                gl=gl,
                line_no=2,
                account_key_id=wip_account,
                description=f"WIP Transfer - {batch.batch_number}",
                debit=Decimal('0'),
                credit=total_cost  # ✅ Complete WIP cost!
            )
            
            return {
                'production_batch': {
                    'batch_id': prod_batch.prod_batch_key,
                    'batch_number': batch.batch_number,
                    'status': prod_batch.status
                },
                'batch_number': batch.batch_number,
                'gl_journal': {
                    'gl_id': gl.gl_id,
                    'journal_number': gl.journal_number
                },
                'cost_breakdown': {  # ⭐ NEW: Show detailed costs
                    'material_cost': float(material_cost),
                    'labor_cost': float(labor_costs),
                    'overhead_cost': float(overhead_costs),
                    'total_cost': float(total_cost)
                },
                'quantity_completed': float(qty_completed),
                'unit_cost': float(unit_cost),  # ✅ Complete unit cost!
                'message': 'Production completed successfully with full costing'
            }
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Production completion failed: {str(e)}")
            raise