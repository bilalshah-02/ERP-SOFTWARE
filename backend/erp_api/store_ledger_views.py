# backend/erp_api/store_ledger_views.py
"""
Store Ledger Card (Stock Ledger Card)
Shows transaction-by-transaction movement with running balance
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Q
from decimal import Decimal
from datetime import datetime

from . import models


def model_by_table(table: str):
    for name in dir(models):
        cls = getattr(models, name)
        if hasattr(cls, "_meta") and getattr(cls._meta, "db_table", None) == table:
            return cls
    raise LookupError(f"Model for table '{table}' not found")


StockMovement = model_by_table("inventory_transaction")
DimItem = model_by_table("dim_item")
Warehouse = model_by_table("warehouse")
AppUser = model_by_table("app_user")


class StoreLedgerCardView(APIView):
    """
    Store Ledger Card - Transaction history with running balance
    
    GET /api/inventory/ledger-card/
    ?item_key=1
    &warehouse_key=1
    &start_date=2026-01-01
    &end_date=2026-02-09
    
    Returns:
    {
        "success": true,
        "item": {...},
        "warehouse": {...},
        "opening_balance": 100,
        "transactions": [
            {
                "date": "2026-01-05",
                "movement_type": "PURCHASE",
                "reference": "PO-001",
                "quantity_in": 50,
                "quantity_out": 0,
                "balance": 150,
                "issued_by": "Ahmad Khan",
                "notes": "Vendor: ABC Suppliers"
            },
            ...
        ],
        "closing_balance": 105
    }
    """
    
    def get(self, request):
        """Get store ledger card for an item"""
        try:
            # Get parameters
            item_key = request.query_params.get('item_key')
            warehouse_key = request.query_params.get('warehouse_key')
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            if not item_key:
                return Response({
                    'success': False,
                    'error': 'item_key is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get item details
            try:
                item = DimItem.objects.get(item_key=item_key)
            except DimItem.DoesNotExist:
                return Response({
                    'success': False,
                    'error': f'Item {item_key} not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Get warehouse details (if specified)
            warehouse = None
            if warehouse_key:
                try:
                    warehouse = Warehouse.objects.get(warehouse_key=warehouse_key)
                except Warehouse.DoesNotExist:
                    return Response({
                        'success': False,
                        'error': f'Warehouse {warehouse_key} not found'
                    }, status=status.HTTP_404_NOT_FOUND)
            
            # Build query
            movements_query = Q(item_key=item_key)
            
            if warehouse_key:
                movements_query &= Q(warehouse_key=warehouse_key)
            
            # Calculate opening balance (before start_date)
            opening_balance = Decimal('0')
            if start_date:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
                opening_movements = StockMovement.objects.filter(
                    movements_query,
                    movement_date__lt=start_date_obj
                )
                
                opening_in = opening_movements.filter(
                    movement_type__in=['PURCHASE', 'RECEIPT', 'TRANSFER_IN', 'ADJUSTMENT_IN', 'PRODUCTION', 'RETURN']
                ).aggregate(total=Sum('quantity'))['total'] or 0
                
                opening_out = opening_movements.filter(
                    movement_type__in=['SALE', 'ISSUE', 'TRANSFER_OUT', 'ADJUSTMENT_OUT', 'CONSUMPTION']
                ).aggregate(total=Sum('quantity'))['total'] or 0
                
                opening_balance = Decimal(str(opening_in)) - Decimal(str(opening_out))
            
            # Get transactions within date range
            transactions_query = movements_query
            if start_date:
                transactions_query &= Q(movement_date__gte=start_date)
            if end_date:
                transactions_query &= Q(movement_date__lte=end_date)
            
            movements = StockMovement.objects.filter(
                transactions_query
            ).select_related(
                'created_by'
            ).order_by('movement_date', 'created_at', 'stock_movement_id')
            
            # Build transaction list with running balance
            transactions = []
            running_balance = opening_balance
            
            for movement in movements:
                # Determine IN vs OUT
                quantity_in = Decimal('0')
                quantity_out = Decimal('0')
                
                if movement.movement_type in ['PURCHASE', 'RECEIPT', 'TRANSFER_IN', 'ADJUSTMENT_IN', 'PRODUCTION', 'RETURN']:
                    quantity_in = Decimal(str(movement.quantity or 0))
                    running_balance += quantity_in
                else:  # SALE, ISSUE, TRANSFER_OUT, ADJUSTMENT_OUT, CONSUMPTION
                    quantity_out = Decimal(str(movement.quantity or 0))
                    running_balance -= quantity_out
                
                # Get user who created the transaction
                issued_by = 'System'
                if movement.created_by:
                    issued_by = movement.created_by.full_name or movement.created_by.username
                
                # Build reference
                reference = movement.reference_number or f"{movement.movement_type}-{movement.stock_movement_id}"
                
                transactions.append({
                    'movement_id': movement.stock_movement_id,
                    'date': movement.movement_date.isoformat() if movement.movement_date else None,
                    'movement_type': movement.movement_type,
                    'reference': reference,
                    'quantity_in': float(quantity_in),
                    'quantity_out': float(quantity_out),
                    'balance': float(running_balance),
                    'uom': item.uom,
                    'issued_by': issued_by,
                    'notes': movement.notes or '',
                    'created_at': movement.created_at.isoformat() if movement.created_at else None,
                })
            
            closing_balance = running_balance
            
            # Build response
            return Response({
                'success': True,
                'item': {
                    'item_key': item.item_key,
                    'item_code': item.item_code,
                    'name': item.name,
                    'uom': item.uom,
                },
                'warehouse': {
                    'warehouse_key': warehouse.warehouse_key,
                    'code': warehouse.warehouse_code,
                    'name': warehouse.name,
                } if warehouse else None,
                'period': {
                    'start_date': start_date,
                    'end_date': end_date,
                },
                'opening_balance': float(opening_balance),
                'transactions': transactions,
                'closing_balance': float(closing_balance),
                'transaction_count': len(transactions),
            })
            
        except Exception as e:
            import traceback
            print("ERROR in Store Ledger Card:")
            print(traceback.format_exc())
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StoreLedgerSummaryView(APIView):
    """
    Summary of all items with ledger info
    
    GET /api/inventory/ledger-summary/?warehouse_key=1
    
    Returns list of items with current stock and last movement
    """
    
    def get(self, request):
        """Get ledger summary for all items"""
        try:
            warehouse_key = request.query_params.get('warehouse_key')
            
            # Get all active items
            items = DimItem.objects.filter(is_active=True)
            
            summary = []
            for item in items:
                # Get last movement
                movements_query = Q(item_key=item.item_key)
                if warehouse_key:
                    movements_query &= Q(warehouse_key=warehouse_key)
                
                last_movement = StockMovement.objects.filter(
                    movements_query
                ).order_by('-movement_date', '-created_at').first()
                
                # Calculate current stock
                if warehouse_key:
                    from .models import StockBalance as SB
                    balance = SB.objects.filter(
                        item_key=item.item_key,
                        warehouse_key=warehouse_key
                    ).aggregate(total=Sum('quantity_on_hand'))['total'] or 0
                else:
                    from .models import StockBalance as SB
                    balance = SB.objects.filter(
                        item_key=item.item_key
                    ).aggregate(total=Sum('quantity_on_hand'))['total'] or 0
                
                summary.append({
                    'item_key': item.item_key,
                    'item_code': item.item_code,
                    'item_name': item.name,
                    'current_stock': float(balance),
                    'last_movement_date': last_movement.movement_date.isoformat() if last_movement and last_movement.movement_date else None,
                    'last_movement_type': last_movement.movement_type if last_movement else None,
                })
            
            return Response({
                'success': True,
                'summary': summary,
                'count': len(summary)
            })
            
        except Exception as e:
            import traceback
            print("ERROR in Store Ledger Summary:")
            print(traceback.format_exc())
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)