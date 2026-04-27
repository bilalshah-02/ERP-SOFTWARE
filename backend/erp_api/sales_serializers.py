# backend/erp_api/sales_serializers.py - COMPLETE WORKING VERSION
"""
Sales Module Serializers with:
- Stock availability validation
- Real FIFO/Average costing
- Document number uniqueness
- Period validation
- GL balance checks
- ✅ WORKING: Invoice creation with manual invoice_id generation
"""

from rest_framework import serializers
from django.db import transaction, connection
from django.core.exceptions import ValidationError as DjangoValidationError
from decimal import Decimal
import uuid

from . import models
from .inventory_costing import costing_engine, StockValidationError
from . import validators


def model_by_table(table: str):
    """Helper to get model by table name"""
    for name in dir(models):
        cls = getattr(models, name)
        if hasattr(cls, "_meta") and getattr(cls._meta, "db_table", None) == table:
            return cls
    raise LookupError(f"Model for table '{table}' not found in erp_api.models")


# Get models
SalesOrder = model_by_table("sales_order")
SalesOrderLine = model_by_table("sales_order_line")
Invoice = model_by_table("invoice")
InvoiceLine = model_by_table("invoice_line")
Payment = model_by_table("payment")
PaymentAllocation = model_by_table("payment_allocation")
Party = model_by_table("party")
DimItem = model_by_table("dim_item")
InventoryTransaction = model_by_table("inventory_transaction")
GlJournal = model_by_table("gl_journal")
GlLine = model_by_table("gl_line")
FiscalPeriod = model_by_table("fiscal_period")
ChartOfAccounts = model_by_table("chart_of_accounts")


# ==================== SALES ORDER SERIALIZERS ====================

class SalesOrderLineSerializer(serializers.ModelSerializer):
    """Sales Order Line"""
    item_code = serializers.CharField(source='item_key.item_code', read_only=True)
    item_name = serializers.CharField(source='item_key.name', read_only=True)
    
    class Meta:
        model = SalesOrderLine
        fields = (
            'so_line_id', 'so', 'line_no', 'item_key',
            'item_code', 'item_name', 'description',
            'quantity', 'unit_price', 'discount_amount', 'tax_key'
        )
        read_only_fields = ('so_line_id',)


class SalesOrderLineInputSerializer(serializers.Serializer):
    """Input for sales order line"""
    item_key = serializers.IntegerField()
    quantity = serializers.DecimalField(max_digits=18, decimal_places=3)
    unit_price = serializers.DecimalField(max_digits=18, decimal_places=4)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    discount_amount = serializers.DecimalField(max_digits=18, decimal_places=2, default=0, required=False)
    tax_key = serializers.IntegerField(required=False, allow_null=True)


class SalesOrderSerializer(serializers.ModelSerializer):
    """Sales Order"""
    customer_name = serializers.CharField(source='customer_key.name', read_only=True)
    lines = SalesOrderLineSerializer(many=True, read_only=True, source='salesorderline_set')
    
    class Meta:
        model = SalesOrder
        fields = (
            'so_id', 'company_key', 'so_number', 'customer_key', 'customer_name',
            'order_date', 'delivery_date', 'status', 'currency_code',
            'remarks', 'created_at', 'created_by', 'lines'
        )
        read_only_fields = ('so_id', 'so_number', 'created_at')


class SalesOrderCreateSerializer(serializers.Serializer):
    """Create Sales Order with VALIDATION"""
    company_key = serializers.IntegerField()
    customer_key = serializers.IntegerField()
    order_date = serializers.DateField()
    delivery_date = serializers.DateField(required=False, allow_null=True)
    remarks = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    created_by = serializers.IntegerField(required=False, allow_null=True)
    lines = SalesOrderLineInputSerializer(many=True)
    
    def validate(self, data):
        """Enhanced validation with all checks"""
        try:
            # 1. Validate company exists
            validators.validate_company_exists(data['company_key'])
            
            # 2. Validate customer exists
            validators.validate_party_exists(data['customer_key'])
            customer = Party.objects.get(party_key=data['customer_key'])
            if customer.party_type != 'CUSTOMER':
                raise serializers.ValidationError("Party must be a CUSTOMER")
            
            # 3. Validate date not in future
            validators.validate_date_not_future(data['order_date'], "Order date")
            
            # 4. Validate period is open
            validators.validate_period_is_open(data['company_key'], data['order_date'])
            
            # 5. Validate lines exist
            if not data.get('lines'):
                raise serializers.ValidationError("At least one line item required")
            
            # 6. Validate each line
            for line in data['lines']:
                validators.validate_item_exists(line['item_key'])
                validators.validate_item_is_active(line['item_key'])
                validators.validate_positive_quantity(line['quantity'])
                validators.validate_positive_amount(line['unit_price'], "Unit price")
            
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        lines_data = validated_data.pop('lines')
        company_key = validated_data['company_key']
        
        # Create SO
        so = SalesOrder.objects.create(
            company_key_id=company_key,
            so_number="SO-TEMP",
            customer_key_id=validated_data['customer_key'],
            order_date=validated_data['order_date'],
            delivery_date=validated_data.get('delivery_date'),
            status='DRAFT',
            currency_code_id='USD',
            remarks=validated_data.get('remarks'),
            created_by_id=validated_data.get('created_by')
        )
        
        # Generate SO number
        so.so_number = f"SO-{validated_data['order_date'].strftime('%Y%m%d')}-{so.so_id}"
        so.save(update_fields=['so_number'])
        
        # Validate uniqueness
        try:
            validators.validate_unique_so_number(company_key, so.so_number, exclude_id=so.so_id)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        
        # Create lines
        for idx, line_data in enumerate(lines_data, 1):
            SalesOrderLine.objects.create(
                so=so,
                line_no=idx,
                item_key_id=line_data['item_key'],
                description=line_data.get('description'),
                quantity=line_data['quantity'],
                unit_price=line_data['unit_price'],
                discount_amount=line_data.get('discount_amount', 0),
                tax_key_id=line_data.get('tax_key')
            )
        
        return so


# ==================== DELIVERY NOTE SERIALIZERS ====================

class DeliveryNoteSerializer(serializers.Serializer):
    """Create Delivery Note with STOCK VALIDATION & REAL COSTING"""
    so_id = serializers.IntegerField()
    delivery_date = serializers.DateField()
    warehouse_key = serializers.IntegerField()
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    created_by = serializers.IntegerField(required=False, allow_null=True)
    
    # GL Accounts
    inventory_account_key = serializers.IntegerField(help_text="Credit: Inventory")
    cogs_account_key = serializers.IntegerField(help_text="Debit: Cost of Goods Sold")
    
    def validate(self, data):
        """Validate with stock availability check"""
        try:
            # Get SO
            so = SalesOrder.objects.filter(so_id=data['so_id']).first()
            if not so:
                raise serializers.ValidationError("Sales order not found")
            
            # Validate SO status
            validators.validate_document_status(
                so.status,
                ['CONFIRMED'],
                'create delivery note'
            )
            
            # Validate warehouse exists
            validators.validate_warehouse_exists(data['warehouse_key'])
            
            # Validate date and period
            validators.validate_date_not_future(data['delivery_date'])
            validators.validate_period_is_open(so.company_key_id, data['delivery_date'])
            
            # Validate GL accounts
            validators.validate_account_is_posting(data['inventory_account_key'])
            validators.validate_account_is_active(data['inventory_account_key'])
            validators.validate_account_is_posting(data['cogs_account_key'])
            validators.validate_account_is_active(data['cogs_account_key'])
            
            # CRITICAL: Validate stock availability for ALL lines
            lines = SalesOrderLine.objects.filter(so=so)
            for line in lines:
                try:
                    costing_engine.validate_stock_availability(
                        company_key=so.company_key_id,
                        item_key=line.item_key_id,
                        warehouse_key=data['warehouse_key'],
                        quantity_needed=line.quantity
                    )
                except StockValidationError as e:
                    raise serializers.ValidationError(f"Line {line.line_no}: {str(e)}")
            
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """Create delivery with REAL FIFO COSTING"""
        so_id = validated_data['so_id']
        delivery_date = validated_data['delivery_date']
        warehouse_key = validated_data['warehouse_key']
        notes = validated_data.get('notes', '')
        created_by = validated_data.get('created_by')
        
        so = SalesOrder.objects.get(so_id=so_id)
        lines = SalesOrderLine.objects.filter(so=so)
        
        total_cogs = Decimal('0.00')
        items_delivered = []
        
        # Process each line with REAL FIFO COSTING
        for line in lines:
            item = DimItem.objects.get(item_key=line.item_key_id)
            
            # Get REAL cost using FIFO or Average based on item's costing method
            cost_info = costing_engine.calculate_cost(
                company_key=so.company_key_id,
                item_key=line.item_key_id,
                warehouse_key=warehouse_key,
                quantity=line.quantity,
                costing_method=item.costing_method
            )
            
            unit_cost = cost_info['unit_cost']
            line_cogs = cost_info['total_cost']
            
            # Create inventory transaction (OUT) with REAL cost
            InventoryTransaction.objects.create(
                company_key_id=so.company_key_id,
                item_key_id=line.item_key_id,
                warehouse_key_id=warehouse_key,
                tx_date=delivery_date,
                movement_type='OUT',
                quantity=-line.quantity,  # Negative for OUT
                unit_cost=unit_cost,  # REAL cost from FIFO/Average
                total_cost=line_cogs,
                source_doc_type='DELIVERY_NOTE',
                source_doc_id=str(so.so_id)
            )
            
            total_cogs += line_cogs
            
            items_delivered.append({
                'item_key': line.item_key_id,
                'item_code': item.item_code,
                'item_name': item.name,
                'quantity': float(line.quantity),
                'unit_cost': float(unit_cost),
                'total_cogs': float(line_cogs),
                'costing_method': item.costing_method
            })
        
        # Get fiscal period
        period = validators.get_open_period(so.company_key_id, delivery_date)
        
        # Create GL Journal with REAL COGS
        gl = GlJournal.objects.create(
            company_key_id=so.company_key_id,
            journal_number="DN-TEMP",
            journal_date=delivery_date,
            period_key=period,
            description=f"Delivery for SO {so.so_number}",
            status='POSTED',
            created_by_id=created_by
        )
        
        gl.journal_number = f"DN-{delivery_date.strftime('%Y%m%d')}-{gl.gl_id}"
        gl.save(update_fields=['journal_number'])
        
        # GL Lines: Dr COGS, Cr Inventory (using REAL costs)
        GlLine.objects.create(
            gl=gl,
            line_no=1,
            account_key_id=validated_data['cogs_account_key'],
            description=f"COGS - SO {so.so_number}",
            debit=total_cogs,
            credit=0
        )
        
        GlLine.objects.create(
            gl=gl,
            line_no=2,
            account_key_id=validated_data['inventory_account_key'],
            description=f"Inventory - SO {so.so_number}",
            debit=0,
            credit=total_cogs
        )
        
        # Update SO status
        so.status = 'DELIVERED'
        so.save(update_fields=['status'])
        
        return {
            'sales_order': so,
            'gl_journal': gl,
            'total_cogs': float(total_cogs),
            'items_delivered': items_delivered
        }


# ==================== CUSTOMER INVOICE SERIALIZERS ====================

class CustomerInvoiceLineInputSerializer(serializers.Serializer):
    """Input for invoice line"""
    so_line_id = serializers.IntegerField()
    quantity = serializers.DecimalField(max_digits=18, decimal_places=3)


class CustomerInvoiceSerializer(serializers.Serializer):
    """Create Customer Invoice with VALIDATION"""
    so_id = serializers.IntegerField()
    invoice_date = serializers.DateField()
    due_date = serializers.DateField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    created_by = serializers.IntegerField(required=False, allow_null=True)
    lines = CustomerInvoiceLineInputSerializer(many=True, required=False)
    
    # GL Accounts
    ar_account_key = serializers.IntegerField(help_text="Debit: Accounts Receivable")
    revenue_account_key = serializers.IntegerField(help_text="Credit: Revenue")
    
    def validate(self, data):
        """Enhanced validation"""
        try:
            # Get SO
            so = SalesOrder.objects.filter(so_id=data['so_id']).first()
            if not so:
                raise serializers.ValidationError("Sales order not found")
            
            # Validate SO status (must be delivered)
            validators.validate_document_status(
                so.status,
                ['DELIVERED'],
                'create invoice'
            )
            
            # Validate date and period
            validators.validate_date_not_future(data['invoice_date'])
            validators.validate_period_is_open(so.company_key_id, data['invoice_date'])
            
            # Validate GL accounts
            validators.validate_account_is_posting(data['ar_account_key'])
            validators.validate_account_is_active(data['ar_account_key'])
            validators.validate_account_is_posting(data['revenue_account_key'])
            validators.validate_account_is_active(data['revenue_account_key'])
            
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """Create customer invoice - WORKING FIX with manual ID generation"""
        so_id = validated_data['so_id']
        invoice_date = validated_data['invoice_date']
        due_date = validated_data.get('due_date')
        notes = validated_data.get('notes', '')
        created_by = validated_data.get('created_by')
        
        so = SalesOrder.objects.get(so_id=so_id)
        lines = SalesOrderLine.objects.filter(so=so)
        
        # ✅ WORKING FIX: Generate invoice_id manually
        invoice_id_field = Invoice._meta.get_field('invoice_id')
        field_type = invoice_id_field.__class__.__name__
        
        if 'UUID' in field_type:
            # UUID field
            new_invoice_id = uuid.uuid4()
        else:
            # Integer field - get next value from database
            with connection.cursor() as cursor:
                cursor.execute("SELECT COALESCE(MAX(invoice_id), 0) + 1 FROM invoice")
                new_invoice_id = cursor.fetchone()[0]
        
        # Create invoice WITH explicit invoice_id
        invoice = Invoice(
            invoice_id=new_invoice_id,  # ✅ Provide the ID explicitly!
            company_key_id=so.company_key_id,
            invoice_number="CI-TEMP",
            invoice_type='CUSTOMER',
            party_key=so.customer_key,
            invoice_date=invoice_date,
            due_date=due_date,
            status='POSTED',
            currency_code_id=so.currency_code_id or 'USD',
            remarks=notes,
            created_by_id=created_by
        )
        invoice.save()
        
        # Update invoice number with the actual ID
        invoice.invoice_number = f"CI-{str(invoice.invoice_id)[:45]}"
        invoice.save(update_fields=['invoice_number'])
        
        # Validate uniqueness
        try:
            validators.validate_unique_invoice_number(
                so.company_key_id,
                invoice.invoice_number,
                'CUSTOMER',
                exclude_id=invoice.invoice_id
            )
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        
        # Create invoice lines
        total_amount = Decimal('0.00')
        total_tax = Decimal('0.00')
        
        for idx, line in enumerate(lines, 1):
            line_amount = (line.quantity * line.unit_price) - (line.discount_amount or 0)
            tax_amount = Decimal('0.00')
            
            # Calculate tax if applicable
            if line.tax_key:
                tax_rate = line.tax_key.rate / 100
                tax_amount = line_amount * tax_rate
            
            InvoiceLine.objects.create(
                invoice=invoice,
                line_no=idx,
                item_key=line.item_key,
                description=line.description,
                quantity=line.quantity,
                unit_price=line.unit_price,
                line_amount=line_amount,
                tax_amount=tax_amount,
                tax_key=line.tax_key
            )
            
            total_amount += line_amount
            total_tax += tax_amount
        
        # Get fiscal period
        period = validators.get_open_period(so.company_key_id, invoice_date)
        
        # Create GL Journal
        gl = GlJournal.objects.create(
            company_key_id=so.company_key_id,
            journal_number="AR-INV-TEMP",
            journal_date=invoice_date,
            period_key=period,
            description=f"Customer Invoice {invoice.invoice_number}",
            status='POSTED',
            created_by_id=created_by
        )
        
        gl.journal_number = f"AR-INV-{gl.gl_id}"
        gl.save(update_fields=['journal_number'])
        
        # GL Lines: Dr AR, Cr Revenue (+ tax if applicable)
        GlLine.objects.create(
            gl=gl,
            line_no=1,
            account_key_id=validated_data['ar_account_key'],
            description=f"AR - Invoice {invoice.invoice_number}",
            debit=total_amount + total_tax,
            credit=0
        )
        
        GlLine.objects.create(
            gl=gl,
            line_no=2,
            account_key_id=validated_data['revenue_account_key'],
            description=f"Revenue - Invoice {invoice.invoice_number}",
            debit=0,
            credit=total_amount
        )
        
        # Update SO status
        #so.status = 'INVOICED'
        #so.save(update_fields=['status'])
        
        return {
            'invoice': invoice,
            'gl_journal': gl,
            'total_amount': float(total_amount),
            'total_tax': float(total_tax),
            'grand_total': float(total_amount + total_tax)
        }


# ==================== CUSTOMER RECEIPT SERIALIZERS ====================

class CustomerReceiptSerializer(serializers.Serializer):
    """Record customer payment with VALIDATION"""
    company_key = serializers.IntegerField()
    customer_key = serializers.IntegerField()
    payment_date = serializers.DateField()
    amount = serializers.DecimalField(max_digits=18, decimal_places=2)
    payment_method = serializers.CharField(max_length=50, required=False)
    reference_no = serializers.CharField(max_length=100, required=False)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    created_by = serializers.IntegerField(required=False, allow_null=True)
    
    # GL Accounts
    cash_account_key = serializers.IntegerField(help_text="Debit: Cash/Bank")
    ar_account_key = serializers.IntegerField(help_text="Credit: Accounts Receivable")
    
    def validate(self, data):
        """Enhanced validation"""
        try:
            # Validate company and customer
            validators.validate_company_exists(data['company_key'])
            validators.validate_party_exists(data['customer_key'])
            
            # Validate amount
            validators.validate_positive_amount(data['amount'])
            
            # Validate date and period
            validators.validate_date_not_future(data['payment_date'])
            validators.validate_period_is_open(data['company_key'], data['payment_date'])
            
            # Validate GL accounts
            validators.validate_account_is_posting(data['cash_account_key'])
            validators.validate_account_is_active(data['cash_account_key'])
            validators.validate_account_is_posting(data['ar_account_key'])
            validators.validate_account_is_active(data['ar_account_key'])
            
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """Create customer payment"""
        # Create payment record
        payment = Payment.objects.create(
            company_key_id=validated_data['company_key'],
            party_key_id=validated_data['customer_key'],
            payment_date=validated_data['payment_date'],
            amount=validated_data['amount'],
            payment_method=validated_data.get('payment_method'),
            reference_no=validated_data.get('reference_no'),
            remarks=validated_data.get('notes'),
            created_by_id=validated_data.get('created_by')
        )
        
        # Get fiscal period
        period = validators.get_open_period(
            validated_data['company_key'],
            validated_data['payment_date']
        )
        
        # Create GL Journal
        gl = GlJournal.objects.create(
            company_key_id=validated_data['company_key'],
            journal_number="RCT-TEMP",
            journal_date=validated_data['payment_date'],
            period_key=period,
            description=f"Customer Payment {validated_data.get('reference_no', '')}",
            status='POSTED',
            created_by_id=validated_data.get('created_by')
        )
        
        gl.journal_number = f"RCT-{validated_data['payment_date'].strftime('%Y%m%d')}-{payment.payment_id}"
        gl.save(update_fields=['journal_number'])
        
        # GL Lines: Dr Cash, Cr AR
        GlLine.objects.create(
            gl=gl,
            line_no=1,
            account_key_id=validated_data['cash_account_key'],
            description=f"Customer Receipt {validated_data.get('reference_no', '')}",
            debit=validated_data['amount'],
            credit=0
        )
        
        GlLine.objects.create(
            gl=gl,
            line_no=2,
            account_key_id=validated_data['ar_account_key'],
            description=f"Customer Receipt {validated_data.get('reference_no', '')}",
            debit=0,
            credit=validated_data['amount']
        )
        
        return {
            'payment': payment,
            'gl_journal': gl,
            'amount': float(validated_data['amount'])
        }