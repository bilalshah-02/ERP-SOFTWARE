# backend/erp_api/inventory_levels_views.py
"""
Inventory Levels & Reorder Management Views
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, F, Q, Value, DecimalField
from django.db.models.functions import Coalesce
from decimal import Decimal

from . import models
from .inventory_levels_serializers import (
    InventoryLevelsSerializer,
    ItemInventoryLevelsSummarySerializer
)


def model_by_table(table: str):
    for name in dir(models):
        cls = getattr(models, name)
        if hasattr(cls, "_meta") and getattr(cls._meta, "db_table", None) == table:
            return cls
    raise LookupError(f"Model for table '{table}' not found")


DimItem = model_by_table("dim_item")
StockBalance = model_by_table("inventory_balance")


class InventoryLevelsConfigView(APIView):
    """
    Configure inventory levels for an item
    
    POST /api/inventory/levels/
    {
        "item_key": 1,
        "avg_daily_usage": 30,
        "min_daily_usage": 20,
        "max_daily_usage": 50,
        "avg_lead_time_days": 7,
        "min_lead_time_days": 5,
        "max_lead_time_days": 10,
        "economic_order_qty": 200
    }
    
    Returns calculated levels:
    {
        "success": true,
        "data": {
            "reorder_level": 500,
            "min_stock_absolute": 0,
            "min_stock_normal": 290,
            "max_stock_absolute": 600,
            "max_stock_normal": 490,
            ...
        }
    }
    """
    
    def post(self, request):
        """Set/Update inventory levels for an item"""
        try:
            serializer = InventoryLevelsSerializer(data=request.data)
            
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            result = serializer.save()
            
            return Response({
                'success': True,
                'message': 'Inventory levels calculated and saved successfully',
                'data': result
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            print("ERROR in Inventory Levels Config:")
            print(traceback.format_exc())
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class InventoryLevelsListView(APIView):
    """
    Get inventory levels for all items or specific item
    
    GET /api/inventory/levels/list/?item_key=1
    GET /api/inventory/levels/list/?company_key=1
    GET /api/inventory/levels/list/?needs_reorder=true
    """
    
    def get(self, request):
        """Get inventory levels with current stock"""
        try:
            item_key = request.query_params.get('item_key')
            company_key = request.query_params.get('company_key', 1)
            needs_reorder = request.query_params.get('needs_reorder')
            warehouse_key = request.query_params.get('warehouse_key')
            
            # Base query
            queryset = DimItem.objects.filter(is_active=True)
            
            if item_key:
                queryset = queryset.filter(item_key=item_key)
            
            # Get stock balance for each item
            stock_balances = {}
            if warehouse_key:
                balances = StockBalance.objects.filter(
                    warehouse_key=warehouse_key
                ).values('item_key').annotate(
                    total=Sum('quantity_on_hand')
                )
            else:
                balances = StockBalance.objects.values('item_key').annotate(
                    total=Sum('quantity_on_hand')
                )
            
            for balance in balances:
                stock_balances[balance['item_key']] = balance['total'] or 0
            
            # Build response
            items_data = []
            for item in queryset:
                current_stock = Decimal(str(stock_balances.get(item.item_key, 0)))
                
                # Determine stock status
                stock_status = 'OK'
                needs_reorder_flag = False
                
                if hasattr(item, 'reorder_level') and item.reorder_level:
                    reorder_level = Decimal(str(item.reorder_level or 0))
                    min_normal = Decimal(str(item.min_stock_normal or 0))
                    min_absolute = Decimal(str(item.min_stock_absolute or 0))
                    max_normal = Decimal(str(item.max_stock_normal or 0))
                    
                    if current_stock <= min_absolute:
                        stock_status = 'CRITICAL'
                        needs_reorder_flag = True
                    elif current_stock <= min_normal:
                        stock_status = 'LOW'
                        needs_reorder_flag = True
                    elif current_stock <= reorder_level:
                        stock_status = 'REORDER'
                        needs_reorder_flag = True
                    elif current_stock >= max_normal:
                        stock_status = 'OVERSTOCK'
                
                item_data = {
                    'item_key': item.item_key,
                    'item_code': item.item_code,
                    'name': item.name,
                    
                    'avg_daily_usage': float(item.avg_daily_usage) if hasattr(item, 'avg_daily_usage') and item.avg_daily_usage else 0,
                    'min_daily_usage': float(item.min_daily_usage) if hasattr(item, 'min_daily_usage') and item.min_daily_usage else 0,
                    'max_daily_usage': float(item.max_daily_usage) if hasattr(item, 'max_daily_usage') and item.max_daily_usage else 0,
                    
                    'avg_lead_time_days': item.avg_lead_time_days if hasattr(item, 'avg_lead_time_days') else 0,
                    'min_lead_time_days': item.min_lead_time_days if hasattr(item, 'min_lead_time_days') else 0,
                    'max_lead_time_days': item.max_lead_time_days if hasattr(item, 'max_lead_time_days') else 0,
                    
                    'economic_order_qty': float(item.economic_order_qty) if hasattr(item, 'economic_order_qty') and item.economic_order_qty else 0,
                    
                    'reorder_level': float(item.reorder_level) if hasattr(item, 'reorder_level') and item.reorder_level else 0,
                    'min_stock_absolute': float(item.min_stock_absolute) if hasattr(item, 'min_stock_absolute') and item.min_stock_absolute else 0,
                    'min_stock_normal': float(item.min_stock_normal) if hasattr(item, 'min_stock_normal') and item.min_stock_normal else 0,
                    'max_stock_absolute': float(item.max_stock_absolute) if hasattr(item, 'max_stock_absolute') and item.max_stock_absolute else 0,
                    'max_stock_normal': float(item.max_stock_normal) if hasattr(item, 'max_stock_normal') and item.max_stock_normal else 0,
                    
                    'current_stock': float(current_stock),
                    'needs_reorder': needs_reorder_flag,
                    'stock_status': stock_status,
                }
                
                # Filter by reorder status if requested
                if needs_reorder == 'true' and not needs_reorder_flag:
                    continue
                
                items_data.append(item_data)
            
            return Response({
                'success': True,
                'data': items_data,
                'count': len(items_data)
            })
            
        except Exception as e:
            import traceback
            print("ERROR in Inventory Levels List:")
            print(traceback.format_exc())
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReorderAlertsView(APIView):
    """
    Get items that need reordering
    
    GET /api/inventory/reorder-alerts/?company_key=1&warehouse_key=1
    
    Returns items where current_stock <= reorder_level
    """
    
    def get(self, request):
        """Get reorder alerts"""
        try:
            company_key = request.query_params.get('company_key', 1)
            warehouse_key = request.query_params.get('warehouse_key')
            
            # Get items with reorder levels set
            items = DimItem.objects.filter(
                is_active=True
            ).exclude(
                Q(reorder_level__isnull=True) | Q(reorder_level=0)
            )
            
            # Get stock balances
            if warehouse_key:
                balances_qs = StockBalance.objects.filter(
                    warehouse_key=warehouse_key
                )
            else:
                balances_qs = StockBalance.objects.all()
            
            stock_balances = {}
            for balance in balances_qs.values('item_key').annotate(total=Sum('quantity_on_hand')):
                stock_balances[balance['item_key']] = balance['total'] or 0
            
            # Find items needing reorder
            alerts = []
            for item in items:
                current_stock = Decimal(str(stock_balances.get(item.item_key, 0)))
                reorder_level = Decimal(str(item.reorder_level or 0))
                eoq = Decimal(str(item.economic_order_qty or 0))
                
                if current_stock <= reorder_level:
                    shortage = reorder_level - current_stock
                    suggested_order_qty = max(eoq, shortage)
                    
                    alerts.append({
                        'item_key': item.item_key,
                        'item_code': item.item_code,
                        'item_name': item.name,
                        'current_stock': float(current_stock),
                        'reorder_level': float(reorder_level),
                        'shortage': float(shortage),
                        'economic_order_qty': float(eoq),
                        'suggested_order_qty': float(suggested_order_qty),
                        'priority': 'CRITICAL' if current_stock <= item.min_stock_absolute else 'HIGH' if current_stock <= item.min_stock_normal else 'NORMAL'
                    })
            
            # Sort by priority
            priority_order = {'CRITICAL': 0, 'HIGH': 1, 'NORMAL': 2}
            alerts.sort(key=lambda x: priority_order.get(x['priority'], 3))
            
            return Response({
                'success': True,
                'alerts': alerts,
                'count': len(alerts)
            })
            
        except Exception as e:
            import traceback
            print("ERROR in Reorder Alerts:")
            print(traceback.format_exc())
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)