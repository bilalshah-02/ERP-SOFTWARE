# backend/erp_api/sales_views.py - COMPLETE FIXED VERSION v3
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Count, Q
from decimal import Decimal

from . import models
from .sales_serializers import (
    SalesOrderSerializer,
    SalesOrderCreateSerializer,
    DeliveryNoteSerializer,
    CustomerInvoiceSerializer,
    CustomerReceiptSerializer,
)


def model_by_table(table: str):
    """Helper to get model by table name"""
    for name in dir(models):
        cls = getattr(models, name)
        if hasattr(cls, "_meta") and getattr(cls._meta, "db_table", None) == table:
            return cls
    raise LookupError(f"Model for table '{table}' not found")


# Get models
SalesOrder = model_by_table("sales_order")
SalesOrderLine = model_by_table("sales_order_line")
Invoice = model_by_table("invoice")
InvoiceLine = model_by_table("invoice_line")
Payment = model_by_table("payment")


# ==================== SALES ORDER VIEWSET ====================

class SalesOrderViewSet(viewsets.ViewSet):
    """Sales Order Management"""
    
    def list(self, request):
        """List sales orders with lines included"""
        status_filter = request.query_params.get('status')
        customer_key = request.query_params.get('customer_key')
        
        queryset = SalesOrder.objects.select_related('customer_key').all()
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if customer_key:
            queryset = queryset.filter(customer_key=customer_key)
        
        queryset = queryset.order_by('-order_date', '-so_id')[:100]
        
        orders = []
        for so in queryset:
            # ✅ FIX: Include lines in list response
            lines = SalesOrderLine.objects.filter(so=so).select_related('item_key')
            
            lines_data = [{
                'so_line_id': line.so_line_id,
                'line_no': line.line_no,
                'item_key': line.item_key.item_key,
                'item_code': line.item_key.item_code,
                'item_name': line.item_key.name,
                'description': line.description if line.description else '',
                'quantity': float(line.quantity),
                'unit_price': float(line.unit_price),
                'discount_amount': float(line.discount_amount or 0),
                'line_total': float(line.quantity * line.unit_price - (line.discount_amount or 0))
            } for line in lines]
            
            total = sum(line['line_total'] for line in lines_data)
            
            orders.append({
                'so_id': so.so_id,
                'so_number': so.so_number,
                'customer_name': so.customer_key.name if so.customer_key else None,
                'customer_key': so.customer_key.party_key if so.customer_key else None,
                'order_date': str(so.order_date),
                'delivery_date': str(so.delivery_date) if so.delivery_date else None,
                'status': so.status,
                'total_amount': float(total),
                'currency_code': so.currency_code.currency_code if so.currency_code else 'USD',
                'created_at': str(so.created_at) if so.created_at else None,
                'lines': lines_data  # ✅ CRITICAL: Include lines here!
            })
        
        return Response({
            'orders': orders,
            'count': len(orders)
        })
    
    def retrieve(self, request, pk=None):
        """Get single sales order"""
        try:
            so = SalesOrder.objects.select_related('customer_key').get(so_id=pk)
        except SalesOrder.DoesNotExist:
            return Response(
                {'error': 'Sales Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        lines = SalesOrderLine.objects.filter(so=so).select_related('item_key')
        lines_data = [{
            'so_line_id': line.so_line_id,
            'line_no': line.line_no,
            'item_key': line.item_key.item_key,
            'item_code': line.item_key.item_code,
            'item_name': line.item_key.name,
            'description': line.description if line.description else '',
            'quantity': float(line.quantity),
            'unit_price': float(line.unit_price),
            'discount_amount': float(line.discount_amount or 0),
            'line_total': float(line.quantity * line.unit_price - (line.discount_amount or 0))
        } for line in lines]
        
        return Response({
            'so_id': so.so_id,
            'so_number': so.so_number,
            'customer_key': so.customer_key.party_key,
            'customer_name': so.customer_key.name,
            'order_date': str(so.order_date),
            'delivery_date': str(so.delivery_date) if so.delivery_date else None,
            'status': so.status,
            'currency_code': so.currency_code.currency_code if so.currency_code else 'USD',
            'remarks': so.remarks if so.remarks else '',
            'lines': lines_data,
            'created_at': str(so.created_at) if so.created_at else None
        })
    
    def create(self, request):
        """Create sales order"""
        serializer = SalesOrderCreateSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save()
            
            # Handle both dict and object return types
            if isinstance(result, dict):
                so = result.get('sales_order')
                line_count = result.get('line_count', 0)
            else:
                so = result
                line_count = SalesOrderLine.objects.filter(so=so).count()
            
            return Response({
                'message': 'Sales Order created successfully',
                'so_id': so.so_id,
                'so_number': so.so_number,
                'line_count': line_count
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm sales order"""
        try:
            so = SalesOrder.objects.get(so_id=pk)
        except SalesOrder.DoesNotExist:
            return Response(
                {'error': 'Sales Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if so.status != 'DRAFT':
            return Response(
                {'error': f'Cannot confirm SO with status {so.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        so.status = 'CONFIRMED'
        so.save(update_fields=['status'])
        
        return Response({
            'message': 'Sales Order confirmed successfully',
            'so_number': so.so_number,
            'status': so.status
        })
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel sales order"""
        try:
            so = SalesOrder.objects.get(so_id=pk)
        except SalesOrder.DoesNotExist:
            return Response(
                {'error': 'Sales Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        so.status = 'CANCELLED'
        so.save(update_fields=['status'])
        
        return Response({
            'message': 'Sales Order cancelled',
            'so_number': so.so_number,
            'status': so.status
        })


# ==================== DELIVERY NOTE VIEW ====================

class DeliveryNoteView(APIView):
    """Create and list delivery notes"""
    
    def get(self, request):
        """List delivery notes with filters"""
        from .models import DeliveryNote, DeliveryNoteLine
        
        so_id = request.query_params.get('so_id')
        warehouse_key = request.query_params.get('warehouse_key')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        queryset = DeliveryNote.objects.select_related('so', 'warehouse_key').all()
        
        if so_id:
            queryset = queryset.filter(so_id=so_id)
        if warehouse_key:
            queryset = queryset.filter(warehouse_key=warehouse_key)
        if start_date:
            queryset = queryset.filter(delivery_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(delivery_date__lte=end_date)
        
        queryset = queryset.order_by('-delivery_date', '-dn_id')[:100]
        
        deliveries = []
        for dn in queryset:
            lines = DeliveryNoteLine.objects.filter(dn=dn).select_related('item_key')
            
            deliveries.append({
                'dn_id': dn.dn_id,
                'dn_number': dn.dn_number,
                'so_number': dn.so.so_number if dn.so else None,
                'so_id': dn.so_id,
                'delivery_date': str(dn.delivery_date),
                'warehouse_name': dn.warehouse_key.name if dn.warehouse_key else None,
                'warehouse_key': dn.warehouse_key.warehouse_key if dn.warehouse_key else None,
                'status': dn.status if dn.status else 'POSTED',
                'notes': dn.notes if dn.notes else '',
                'total_items': lines.count(),
                'total_quantity': sum(float(line.quantity_delivered) for line in lines),
                'created_at': str(dn.created_at) if dn.created_at else None,
            })
        
        return Response({
            'deliveries': deliveries,
            'count': len(deliveries)
        })
    
    def post(self, request):
        """Create delivery note"""
        serializer = DeliveryNoteSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save()
            
            if isinstance(result, dict):
                dn = result.get('delivery_note')
                inv_txns = result.get('inventory_transactions', [])
                so_status = result.get('so_status', 'DELIVERED')
            else:
                from .models import DeliveryNote
                dn = result if isinstance(result, DeliveryNote) else None
                inv_txns = []
                so_status = 'DELIVERED'
            
            return Response({
                'message': 'Delivery note created successfully',
                'delivery_note': dn.dn_number if dn else 'Created',
                'items_delivered': len(inv_txns),
                'sales_order_status': so_status
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== CUSTOMER INVOICE VIEWSET ====================

class CustomerInvoiceViewSet(viewsets.ViewSet):
    """Customer Invoice Management"""
    
    def list(self, request):
        """List customer invoices (AR)"""
        customer_key = request.query_params.get('customer_key')
        status_filter = request.query_params.get('status')
        
        queryset = Invoice.objects.filter(
            invoice_type='CUSTOMER'
        ).select_related('party_key').all()
        
        if customer_key:
            queryset = queryset.filter(party_key=customer_key)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        queryset = queryset.order_by('-invoice_date', '-created_at')[:100]
        
        invoices = []
        for inv in queryset:
            lines = InvoiceLine.objects.filter(invoice=inv)
            total = sum(line.line_amount for line in lines)
            
            invoices.append({
                'invoice_id': str(inv.invoice_id),
                'invoice_number': inv.invoice_number,
                'customer_name': inv.party_key.name if inv.party_key else None,
                'invoice_date': str(inv.invoice_date),
                'due_date': str(inv.due_date) if inv.due_date else None,
                'status': inv.status,
                'total_amount': float(total),
                'currency_code': inv.currency_code.currency_code if inv.currency_code else 'USD'
            })
        
        return Response({
            'invoices': invoices,
            'count': len(invoices)
        })
    
    def retrieve(self, request, pk=None):
        """Get single customer invoice"""
        try:
            inv = Invoice.objects.select_related('party_key').get(invoice_id=pk)
        except Invoice.DoesNotExist:
            return Response(
                {'error': 'Invoice not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        lines = InvoiceLine.objects.filter(invoice=inv).select_related('item_key')
        lines_data = [{
            'line_id': line.line_id,
            'line_no': line.line_no,
            'item_name': line.item_key.name if line.item_key else None,
            'description': line.description if line.description else '',
            'quantity': float(line.quantity or 0),
            'unit_price': float(line.unit_price or 0),
            'line_amount': float(line.line_amount),
            'tax_amount': float(line.tax_amount or 0)
        } for line in lines]
        
        return Response({
            'invoice_id': str(inv.invoice_id),
            'invoice_number': inv.invoice_number,
            'customer_name': inv.party_key.name,
            'invoice_date': str(inv.invoice_date),
            'due_date': str(inv.due_date) if inv.due_date else None,
            'status': inv.status,
            'lines': lines_data
        })
    
    def create(self, request):
        """Create customer invoice"""
        serializer = CustomerInvoiceSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save()
            
            if isinstance(result, dict):
                inv = result.get('invoice')
                line_count = result.get('line_count', 0)
            else:
                inv = result
                line_count = InvoiceLine.objects.filter(invoice=inv).count()
            
            return Response({
                'message': 'Customer Invoice created successfully',
                'invoice_id': str(inv.invoice_id),
                'invoice_number': inv.invoice_number,
                'line_count': line_count
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== CUSTOMER RECEIPT VIEWSET ====================

class CustomerReceiptViewSet(viewsets.ViewSet):
    """Customer Receipt Management (AR Payments)"""
    
    def list(self, request):
        """List customer receipts"""
        customer_key = request.query_params.get('customer_key')
        
        queryset = Payment.objects.select_related('party_key').all()
        
        if customer_key:
            queryset = queryset.filter(party_key=customer_key)
        
        queryset = queryset.order_by('-payment_date', '-created_at')[:100]
        
        receipts = [{
            'payment_id': pmt.payment_id,
            'customer_name': pmt.party_key.name if pmt.party_key else None,
            'payment_date': str(pmt.payment_date),
            'amount': float(pmt.amount),
            'payment_method': pmt.payment_method if pmt.payment_method else 'CASH',
            'reference_no': pmt.reference_no if pmt.reference_no else ''
        } for pmt in queryset]
        
        return Response({
            'receipts': receipts,
            'count': len(receipts)
        })
    
    def retrieve(self, request, pk=None):
        """Get single customer receipt"""
        try:
            pmt = Payment.objects.select_related('party_key').get(payment_id=pk)
        except Payment.DoesNotExist:
            return Response(
                {'error': 'Receipt not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'payment_id': pmt.payment_id,
            'customer_name': pmt.party_key.name,
            'payment_date': str(pmt.payment_date),
            'amount': float(pmt.amount),
            'payment_method': pmt.payment_method if pmt.payment_method else 'CASH',
            'reference_no': pmt.reference_no if pmt.reference_no else '',
            'remarks': pmt.remarks if pmt.remarks else ''
        })
    
    def create(self, request):
        """Create customer receipt"""
        serializer = CustomerReceiptSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save()
            
            if isinstance(result, dict):
                pmt = result.get('payment')
            else:
                pmt = result
            
            return Response({
                'message': 'Customer Receipt created successfully',
                'payment_id': pmt.payment_id,
                'amount': float(pmt.amount)
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== SALES DASHBOARD ====================

class SalesDashboardView(APIView):
    """Sales module dashboard"""
    
    def get(self, request):
        """Get sales overview"""
        
        so_stats = SalesOrder.objects.aggregate(
            total=Count('so_id'),
            draft=Count('so_id', filter=Q(status='DRAFT')),
            confirmed=Count('so_id', filter=Q(status='CONFIRMED')),
            delivered=Count('so_id', filter=Q(status='DELIVERED')),
            cancelled=Count('so_id', filter=Q(status='CANCELLED'))
        )
        
        inv_stats = Invoice.objects.filter(
            invoice_type='CUSTOMER'
        ).aggregate(
            total=Count('invoice_id'),
            draft=Count('invoice_id', filter=Q(status='DRAFT')),
            posted=Count('invoice_id', filter=Q(status='POSTED'))
        )
        
        so_lines = SalesOrderLine.objects.select_related('so').filter(
            so__status='CONFIRMED'
        )
        total_so_value = sum(
            (line.quantity * line.unit_price - (line.discount_amount or 0))
            for line in so_lines
        )
        
        inv_lines = InvoiceLine.objects.select_related('invoice').filter(
            invoice__invoice_type='CUSTOMER',
            invoice__status='POSTED'
        )
        total_inv_value = sum(line.line_amount for line in inv_lines)
        
        return Response({
            'sales_orders': so_stats,
            'invoices': inv_stats,
            'totals': {
                'confirmed_orders_value': float(total_so_value),
                'invoiced_value': float(total_inv_value)
            }
        })