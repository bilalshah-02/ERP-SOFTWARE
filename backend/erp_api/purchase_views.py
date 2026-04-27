# backend/erp_api/purchase_views.py - COMPLETE FIXED VERSION
"""
Purchase Module Views - FIXED WITH PROPER RESPONSE FORMATS
Matches Sales module pattern for consistency
"""

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Sum, Count, Q

from .purchase_serializers import (
    model_by_table,
    PurchaseOrderCreateSerializer,
    PurchaseOrderListSerializer,
    GoodsReceiptCreateSerializer,
    VendorInvoiceCreateSerializer,
    VendorPaymentSerializer,
)

PurchaseOrder = model_by_table("purchase_order")
PurchaseOrderLine = model_by_table("purchase_order_line")
Invoice = model_by_table("invoice")
InvoiceLine = model_by_table("invoice_line")
Payment = model_by_table("payment")


# ==================== PURCHASE ORDER ====================

class PurchaseOrderViewSet(viewsets.ViewSet):
    """Purchase Order CRUD - FIXED"""
    
    def list(self, request):
        """List all POs with proper response format"""
        qs = PurchaseOrder.objects.select_related('supplier_key').all().order_by('-order_date', '-po_id')
        
        # Filters
        status_filter = request.query_params.get('status')
        supplier_key = request.query_params.get('supplier_key')
        
        if status_filter:
            qs = qs.filter(status=status_filter)
        if supplier_key:
            qs = qs.filter(supplier_key=supplier_key)
        
        qs = qs[:100]  # Limit to 100
        
        # Format response
        orders = []
        for po in qs:
            lines = PurchaseOrderLine.objects.filter(po=po)
            total = sum(
                (line.quantity * line.unit_price - (line.discount_amount or 0))
                for line in lines
            )
            
            orders.append({
                'po_id': po.po_id,
                'po_number': po.po_number,
                'supplier_name': po.supplier_key.name if po.supplier_key else None,
                'supplier_key': po.supplier_key.party_key if po.supplier_key else None,
                'order_date': po.order_date,
                'expected_date': po.expected_date,
                'status': po.status,
                'total_amount': float(total),
                'created_at': po.created_at
            })
        
        # ✅ FIX: Return proper format
        return Response({
            'orders': orders,
            'count': len(orders)
        })
    
    def create(self, request):
        """Create new PO"""
        serializer = PurchaseOrderCreateSerializer(data=request.data)
        if serializer.is_valid():
            po = serializer.save()
            
            # Get line count
            line_count = PurchaseOrderLine.objects.filter(po=po).count()
            
            return Response({
                'message': 'Purchase Order created successfully',
                'po_id': po.po_id,
                'po_number': po.po_number,
                'line_count': line_count
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def retrieve(self, request, pk=None):
        """Get PO detail with lines"""
        try:
            po = PurchaseOrder.objects.select_related('supplier_key').get(po_id=pk)
        except PurchaseOrder.DoesNotExist:
            return Response(
                {"error": "Purchase Order not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get PO lines
        lines = PurchaseOrderLine.objects.filter(po=po).select_related('item_key').order_by('line_no')
        
        lines_data = [{
            'po_line_id': line.po_line_id,
            'line_no': line.line_no,
            'item_key': line.item_key.item_key,
            'item_code': line.item_key.item_code,
            'item_name': line.item_key.name,
            'quantity': float(line.quantity),
            'unit_price': float(line.unit_price),
            'discount_amount': float(line.discount_amount or 0),
            'description': line.description,
            'line_total': float(line.quantity * line.unit_price - (line.discount_amount or 0))
        } for line in lines]
        
        return Response({
            'po_id': po.po_id,
            'po_number': po.po_number,
            'supplier_key': po.supplier_key.party_key,
            'supplier_name': po.supplier_key.name,
            'order_date': po.order_date,
            'expected_date': po.expected_date,
            'status': po.status,
            'remarks': po.remarks,
            'lines': lines_data,
            'created_at': po.created_at
        })
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve PO (change status to CONFIRMED)"""
        try:
            po = PurchaseOrder.objects.get(po_id=pk)
        except PurchaseOrder.DoesNotExist:
            return Response(
                {"error": "Purchase Order not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if po.status != 'DRAFT':
            return Response(
                {"error": f"Cannot approve PO with status {po.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        po.status = 'CONFIRMED'
        po.save(update_fields=['status'])
        
        return Response({
            'message': 'Purchase Order approved successfully',
            'po_number': po.po_number,
            'status': po.status
        })


# ==================== GOODS RECEIPT ====================

class GoodsReceiptView(APIView):
    """Create and list Goods Receipt Notes (GRN)"""
    
    def get(self, request):
        """List all GRNs"""
        # GRNs are stored as inventory transactions with source_doc_type='GRN'
        from .serializers import model_by_table
        InventoryTransaction = model_by_table("inventory_transaction")
        
        po_id = request.query_params.get('po_id')
        warehouse_key = request.query_params.get('warehouse_key')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Get unique GRNs (group by source_doc_id where source_doc_type='GRN')
        queryset = InventoryTransaction.objects.filter(
            source_doc_type='GRN',
            movement_type='IN'
        ).select_related('item_key', 'warehouse_key')
        
        if warehouse_key:
            queryset = queryset.filter(warehouse_key=warehouse_key)
        if start_date:
            queryset = queryset.filter(tx_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(tx_date__lte=end_date)
        
        queryset = queryset.order_by('-tx_date', '-inv_txn_id')[:100]
        
        # Group by GRN number
        grns = {}
        for txn in queryset:
            grn_number = f"GRN-{txn.tx_date.strftime('%Y%m%d')}-{txn.source_doc_id or txn.inv_txn_id}"
            
            if grn_number not in grns:
                grns[grn_number] = {
                    'grn_number': grn_number,
                    'grn_date': txn.tx_date,
                    'warehouse_name': txn.warehouse_key.name if txn.warehouse_key else None,
                    'warehouse_key': txn.warehouse_key.warehouse_key if txn.warehouse_key else None,
                    'total_items': 0,
                    'total_quantity': 0,
                    'total_cost': 0
                }
            
            grns[grn_number]['total_items'] += 1
            grns[grn_number]['total_quantity'] += float(txn.quantity)
            grns[grn_number]['total_cost'] += float(txn.total_cost or 0)
        
        return Response({
            'receipts': list(grns.values()),
            'count': len(grns)
        })
    
    def post(self, request):
        """Create GRN"""
        serializer = GoodsReceiptCreateSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save()
            
            # Handle both dict and object return types
            if isinstance(result, dict):
                grn_number = result.get('grn_number', 'Created')
                po = result.get('po')
                po_status = result.get('po_status', po.status if po else 'RECEIVED')
            else:
                grn_number = 'Created'
                po = None
                po_status = 'RECEIVED'
            
            return Response({
                "message": "Goods Receipt created successfully",
                "grn_number": grn_number,
                "po_status": po_status,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== VENDOR INVOICE ====================

class VendorInvoiceViewSet(viewsets.ViewSet):
    """Vendor Invoice (AP Invoice) CRUD"""
    
    def list(self, request):
        """List all vendor invoices"""
        supplier_key = request.query_params.get('supplier_key')
        status_filter = request.query_params.get('status')
        
        queryset = Invoice.objects.filter(
            invoice_type='AP'
        ).select_related('party_key').all()
        
        if supplier_key:
            queryset = queryset.filter(party_key=supplier_key)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        queryset = queryset.order_by('-invoice_date', '-created_at')[:100]
        
        # Calculate totals
        invoices = []
        for inv in queryset:
            lines = InvoiceLine.objects.filter(invoice=inv)
            total_amount = sum(line.line_amount for line in lines)
            
            invoices.append({
                'invoice_id': str(inv.invoice_id),
                'invoice_number': inv.invoice_number,
                'invoice_date': inv.invoice_date,
                'due_date': inv.due_date,
                'supplier_key': inv.party_key.party_key if inv.party_key else None,
                'supplier_name': inv.party_key.name if inv.party_key else None,
                'total_amount': float(total_amount),
                'status': inv.status,
            })
        
        return Response({
            'invoices': invoices,
            'count': len(invoices)
        })
    
    def create(self, request):
        """Create vendor invoice (with auto GL posting)"""
        serializer = VendorInvoiceCreateSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save()
            
            # Handle both dict and object return types
            if isinstance(result, dict):
                invoice = result.get('invoice')
            else:
                invoice = result
            
            # Calculate total
            lines = InvoiceLine.objects.filter(invoice=invoice)
            total_amount = sum(line.line_amount for line in lines)
            
            return Response({
                "message": "Vendor invoice created and posted to GL",
                "invoice_id": str(invoice.invoice_id),
                "invoice_number": invoice.invoice_number,
                "total_amount": float(total_amount),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def retrieve(self, request, pk=None):
        """Get invoice detail"""
        try:
            invoice = Invoice.objects.select_related('party_key').get(
                invoice_id=pk, 
                invoice_type='AP'
            )
        except Invoice.DoesNotExist:
            return Response(
                {"error": "Invoice not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        lines = InvoiceLine.objects.filter(invoice=invoice).select_related('item_key').order_by('line_no')
        total_amount = sum(line.line_amount for line in lines)
        
        lines_data = [{
            'line_no': line.line_no,
            'item_key': line.item_key.item_key if line.item_key else None,
            'item_code': line.item_key.item_code if line.item_key else None,
            'item_name': line.item_key.name if line.item_key else None,
            'quantity': float(line.quantity) if line.quantity else 0,
            'unit_price': float(line.unit_price) if line.unit_price else 0,
            'line_amount': float(line.line_amount),
            'description': line.description,
        } for line in lines]
        
        return Response({
            'invoice_id': str(invoice.invoice_id),
            'invoice_number': invoice.invoice_number,
            'invoice_date': invoice.invoice_date,
            'due_date': invoice.due_date,
            'supplier_key': invoice.party_key.party_key if invoice.party_key else None,
            'supplier_name': invoice.party_key.name if invoice.party_key else None,
            'total_amount': float(total_amount),
            'status': invoice.status,
            'lines': lines_data
        })


# ==================== VENDOR PAYMENT ====================

class VendorPaymentViewSet(viewsets.ViewSet):
    """Vendor Payment CRUD"""
    
    def list(self, request):
        """List all vendor payments"""
        # Filter payments where party is a supplier
        from .serializers import Party
        supplier_keys = Party.objects.filter(party_type='SUPPLIER').values_list('party_key', flat=True)
        
        queryset = Payment.objects.filter(
            party_key__in=supplier_keys
        ).select_related('party_key').order_by('-payment_date', '-created_at')
        
        # Additional filter
        supplier_key = request.query_params.get('supplier_key')
        if supplier_key:
            queryset = queryset.filter(party_key=supplier_key)
        
        queryset = queryset[:100]
        
        payments = [{
            'payment_id': pmt.payment_id,
            'payment_date': pmt.payment_date,
            'supplier_key': pmt.party_key.party_key if pmt.party_key else None,
            'supplier_name': pmt.party_key.name if pmt.party_key else None,
            'amount': float(pmt.amount),
            'payment_method': pmt.payment_method,
            'reference_no': pmt.reference_no,
        } for pmt in queryset]
        
        return Response({
            'payments': payments,
            'count': len(payments)
        })
    
    def create(self, request):
        """Create vendor payment (with auto GL posting)"""
        serializer = VendorPaymentSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save()
            
            # Handle both dict and object return types
            if isinstance(result, dict):
                payment = result.get('payment')
            else:
                payment = result
            
            return Response({
                "message": "Vendor payment created and posted to GL",
                "payment_id": payment.payment_id,
                "amount": float(payment.amount),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def retrieve(self, request, pk=None):
        """Get payment detail"""
        try:
            payment = Payment.objects.select_related('party_key').get(payment_id=pk)
        except Payment.DoesNotExist:
            return Response(
                {"error": "Payment not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'payment_id': payment.payment_id,
            'payment_date': payment.payment_date,
            'supplier_key': payment.party_key.party_key if payment.party_key else None,
            'supplier_name': payment.party_key.name if payment.party_key else None,
            'amount': float(payment.amount),
            'payment_method': payment.payment_method,
            'reference_no': payment.reference_no,
            'remarks': payment.remarks,
        })


# ==================== PURCHASE DASHBOARD ====================

class PurchaseDashboardView(APIView):
    """Purchase module dashboard stats"""
    
    def get(self, request):
        # PO Stats
        po_stats = PurchaseOrder.objects.aggregate(
    total=Count('po_id'),
    draft=Count('po_id', filter=Q(status='DRAFT')),
    confirmed=Count('po_id', filter=Q(status='CONFIRMED')),
    received=Count('po_id', filter=Q(status='POSTED')),  # POSTED = goods received
    cancelled=Count('po_id', filter=Q(status='CANCELLED'))
)
        
        # Invoice Stats
        inv_stats = Invoice.objects.filter(invoice_type='AP').aggregate(
            total=Count('invoice_id'),
            draft=Count('invoice_id', filter=Q(status='DRAFT')),
            posted=Count('invoice_id', filter=Q(status='POSTED'))
        )
        
        # Calculate total amounts
        po_lines = PurchaseOrderLine.objects.select_related('po').filter(
            po__status='CONFIRMED'
        )
        total_po_value = sum(
            (line.quantity * line.unit_price - (line.discount_amount or 0))
            for line in po_lines
        )
        
        inv_lines = InvoiceLine.objects.select_related('invoice').filter(
            invoice__invoice_type='AP',
            invoice__status='POSTED'
        )
        total_inv_value = sum(line.line_amount for line in inv_lines)
        
        # Payment Stats (for suppliers only)
        from .serializers import Party
        supplier_keys = Party.objects.filter(party_type='SUPPLIER').values_list('party_key', flat=True)
        
        pmt_stats = Payment.objects.filter(party_key__in=supplier_keys).aggregate(
            total=Count('payment_id'),
            total_amount=Sum('amount')
        )
        
        return Response({
            'purchase_orders': po_stats,
            'invoices': inv_stats,
            'payments': {
                'total': pmt_stats['total'] or 0,
                'total_amount': float(pmt_stats['total_amount'] or 0)
            },
            'totals': {
                'confirmed_orders_value': float(total_po_value),
                'invoiced_value': float(total_inv_value)
            }
        })