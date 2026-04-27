# backend/erp_api/inventory_views.py - COMPLETE WITH RECIPE ENDPOINT
"""
Inventory Module Views - COMPLETE VERSION

Features:
- Stock adjustment creation
- Stock transfer between warehouses
- Stock movements history
- Stock balance report
- Stock ledger with running balance
- Inventory dashboard
- Warehouse listing
- ✅ NEW: Item Recipe endpoints (create/get recipes)
"""

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Q, F
from decimal import Decimal
from django.db import transaction

from . import models
from .inventory_serializers import (
    StockAdjustmentSerializer,
    StockTransferSerializer,
    InventoryTransactionSerializer,
    StockBalanceSerializer,
    StockLedgerSerializer,
)


def model_by_table(table: str):
    """Helper to get model by table name"""
    for name in dir(models):
        cls = getattr(models, name)
        if hasattr(cls, "_meta") and getattr(cls._meta, "db_table", None) == table:
            return cls
    raise LookupError(f"Model for table '{table}' not found")


# Get models
InventoryTransaction = model_by_table("inventory_transaction")
InventoryBalance = model_by_table("inventory_balance")
DimItem = model_by_table("dim_item")
Warehouse = model_by_table("warehouse")


# ==================== WAREHOUSE LIST VIEW ====================

class WarehouseListView(APIView):
    """List all warehouses"""
    
    def get(self, request):
        """Get all warehouses"""
        try:
            warehouses = Warehouse.objects.all().order_by('code')
            
            warehouse_list = [
                {
                    'warehouse_key': wh.warehouse_key,
                    'code': wh.code,
                    'name': wh.name,
                }
                for wh in warehouses
            ]
            
            return Response(warehouse_list, status=status.HTTP_200_OK)
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error fetching warehouses: {str(e)}")
            return Response(
                {'error': f'Failed to fetch warehouses: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ==================== ITEM RECIPE VIEW (NEW!) ====================

class ItemRecipeView(APIView):
    """Create and manage item recipes (creates BOM in background) - FIXED"""
    
    def post(self, request):
        """Create recipe for a product"""
        try:
            product_item_key = request.data.get('product_item_key')
            components = request.data.get('components', [])
            
            if not product_item_key:
                return Response(
                    {'error': 'product_item_key is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not components or len(components) == 0:
                return Response(
                    {'error': 'At least one component is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print("========== RECIPE CREATE ==========")
            print(f"Product: {product_item_key}")
            print(f"Components: {components}")
            
            # Get models
            Bom = model_by_table("bom")
            BomComponent = model_by_table("bom_component")
            
            # Get product
            product = DimItem.objects.get(item_key=product_item_key)
            
            # Check if BOM already exists
            existing_bom = Bom.objects.filter(
                parent_item_key=product,
                is_active=True
            ).first()
            
            if existing_bom:
                return Response(
                    {'error': f'Recipe already exists for {product.name}. Use update instead.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            with transaction.atomic():
                # Generate BOM code
                bom_code = f"{product.item_code}-RECIPE"
                
                # ✅ FIX: Only use fields that exist in BOM model
                bom = Bom.objects.create(
                    bom_code=bom_code,
                    parent_item_key=product,
                    description=f"Recipe for {product.name}",
                    is_active=True
                )
                
                print(f"✅ BOM created: {bom.bom_key} - {bom_code}")
                
                # Create components
                component_count = 0
                for comp_data in components:
                    component_item_key = comp_data.get('component_item_key')
                    quantity_per = comp_data.get('quantity_per') or comp_data.get('quantity')
                    
                    if component_item_key and quantity_per and quantity_per > 0:
                        component_item = DimItem.objects.get(item_key=component_item_key)
                        
                        # ✅ FIX: Only use fields that exist in BomComponent model
                        BomComponent.objects.create(
                            bom_key=bom,
                            component_item_key=component_item,
                            quantity_per=quantity_per,
                            scrap_percent=0  # Default scrap
                        )
                        component_count += 1
                        print(f"  ✅ Component: {component_item.name} - {quantity_per}")
                
                print(f"✅ Recipe created with {component_count} components")
                print("===================================")
                
                return Response({
                    'message': 'Recipe created successfully',
                    'bom_id': bom.bom_key,
                    'bom_code': bom.bom_code,
                    'product_name': product.name,
                    'components_count': component_count
                }, status=status.HTTP_201_CREATED)
                
        except DimItem.DoesNotExist:
            return Response(
                {'error': 'Product or component item not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import traceback
            print("❌ ERROR creating recipe:")
            print(traceback.format_exc())
            return Response(
                {'error': str(e), 'detail': traceback.format_exc()},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def get(self, request, product_item_key=None):
        """Get recipe for a product"""
        try:
            if not product_item_key:
                return Response(
                    {'error': 'product_item_key is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get models
            Bom = model_by_table("bom")
            BomComponent = model_by_table("bom_component")
            
            # Get product
            product = DimItem.objects.get(item_key=product_item_key)
            
            # Get BOM
            bom = Bom.objects.filter(
                parent_item_key=product,
                is_active=True
            ).first()
            
            if not bom:
                return Response(
                    {'error': f'No recipe found for {product.name}'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get components
            bom_components = BomComponent.objects.filter(bom_key=bom).select_related('component_item_key')
            
            components = [{
                'item_key': comp.component_item_key.item_key,
                'item_code': comp.component_item_key.item_code,
                'item_name': comp.component_item_key.name,
                'quantity_per': float(comp.quantity_per),
                'uom': comp.component_item_key.uom  # Get UOM from item, not component
            } for comp in bom_components]
            
            return Response({
                'product_item_key': product.item_key,
                'product_code': product.item_code,
                'product_name': product.name,
                'bom_id': bom.bom_key,
                'bom_code': bom.bom_code,
                'components': components
            }, status=status.HTTP_200_OK)
            
        except DimItem.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import traceback
            print("❌ ERROR fetching recipe:")
            print(traceback.format_exc())
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

# ==================== STOCK ADJUSTMENT VIEW ====================

class StockAdjustmentView(APIView):
    """Create stock adjustments"""
    
    def post(self, request):
        """Create stock adjustment"""
        serializer = StockAdjustmentSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save()
            
            return Response({
    'message': 'Stock adjustment created successfully',
    'data': result
}, status=status.HTTP_201_CREATED)
            
            if result['gl_journal']:
                response_data['gl_journal_number'] = result['gl_journal'].journal_number
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== STOCK TRANSFER VIEW ====================

class StockTransferView(APIView):
    """Transfer stock between warehouses"""
    
    def post(self, request):
        """Create stock transfer"""
        serializer = StockTransferSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save()
            return Response({
                'message': 'Stock transfer created successfully',
                'out_txn_id': result['out_transaction'].inv_txn_id,
                'in_txn_id': result['in_transaction'].inv_txn_id,
                'quantity': result['quantity'],
                'from_warehouse': result['from_warehouse'],
                'to_warehouse': result['to_warehouse']
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== STOCK MOVEMENTS VIEW ====================

class StockMovementsView(APIView):
    """List all inventory transactions (movements)"""
    
    def get(self, request):
        """Get inventory movements with filters"""
        item_key = request.query_params.get('item_key')
        warehouse_key = request.query_params.get('warehouse_key')
        movement_type = request.query_params.get('movement_type')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        queryset = InventoryTransaction.objects.select_related(
            'item_key', 'warehouse_key'
        ).all()
        
        if item_key:
            queryset = queryset.filter(item_key=item_key)
        if warehouse_key:
            queryset = queryset.filter(warehouse_key=warehouse_key)
        if movement_type:
            queryset = queryset.filter(movement_type=movement_type)
        if start_date:
            queryset = queryset.filter(tx_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(tx_date__lte=end_date)
        
        queryset = queryset.order_by('-tx_date', '-inv_txn_id')[:100]
        
        movements = [{
            'inv_txn_id': txn.inv_txn_id,
            'item_key': txn.item_key.item_key,
            'item_code': txn.item_key.item_code,
            'item_name': txn.item_key.name,
            'warehouse_key': txn.warehouse_key.warehouse_key,
            'warehouse_name': txn.warehouse_key.name,
            'movement_type': txn.movement_type,
            'quantity': float(txn.quantity),
            'unit_cost': float(txn.unit_cost) if txn.unit_cost else None,
            'total_cost': float(txn.total_cost) if txn.total_cost else None,
            'transaction_date': txn.tx_date,
            'source_doc_type': txn.source_doc_type,
            'source_doc_id': txn.source_doc_id if hasattr(txn, 'source_doc_id') else None
        } for txn in queryset]
        
        return Response({
            'movements': movements,
            'count': len(movements)
        })


# ==================== STOCK BALANCE REPORT ====================

class StockBalanceView(APIView):
    """Stock balance report"""
    
    def get(self, request):
        """Get current stock balance by item and warehouse"""
        warehouse_key = request.query_params.get('warehouse_key')
        
        from django.db import connection
        
        with connection.cursor() as cursor:
            sql = """
                SELECT 
                    i.item_key,
                    i.item_code,
                    i.name as item_name,
                    w.warehouse_key,
                    w.code as warehouse_code,
                    w.name as warehouse_name,
                    SUM(it.quantity) as quantity_on_hand,
                    (
                        SELECT COALESCE(AVG(unit_cost), 0)
                        FROM erp.inventory_transaction
                        WHERE item_key = i.item_key 
                        AND warehouse_key = w.warehouse_key
                        AND quantity > 0
                    ) as average_cost,
                    SUM(it.quantity) * (
                        SELECT COALESCE(AVG(unit_cost), 0)
                        FROM erp.inventory_transaction
                        WHERE item_key = i.item_key 
                        AND warehouse_key = w.warehouse_key
                        AND quantity > 0
                    ) as total_value
                FROM erp.inventory_transaction it
                JOIN erp.dim_item i ON it.item_key = i.item_key
                JOIN erp.warehouse w ON it.warehouse_key = w.warehouse_key
            """
            
            params = []
            if warehouse_key:
                sql += " WHERE w.warehouse_key = %s"
                params.append(warehouse_key)
            
            sql += """
                GROUP BY i.item_key, i.item_code, i.name, w.warehouse_key, w.code, w.name
                HAVING SUM(it.quantity) != 0
                ORDER BY i.item_code, w.code
            """
            
            cursor.execute(sql, params)
            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        return Response(results)


# ==================== STOCK LEDGER REPORT ====================

class StockLedgerView(APIView):
    """Get stock ledger (running balance) for an item in a warehouse"""
    
    def get(self, request):
        """Get stock ledger with running balance"""
        item_key = request.query_params.get('item_key')
        warehouse_key = request.query_params.get('warehouse_key')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not item_key or not warehouse_key:
            return Response(
                {'error': 'item_key and warehouse_key are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = InventoryTransaction.objects.filter(
            item_key=item_key,
            warehouse_key=warehouse_key
        )
        
        if start_date:
            queryset = queryset.filter(tx_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(tx_date__lte=end_date)
        
        queryset = queryset.order_by('tx_date', 'inv_txn_id')
        
        # Calculate running balance
        ledger = []
        running_balance = Decimal('0.00')
        
        for txn in queryset:
            running_balance += txn.quantity
            
            ledger.append({
                'inv_txn_id': txn.inv_txn_id,
                'transaction_date': txn.tx_date,
                'movement_type': txn.movement_type,
                'quantity': float(txn.quantity),
                'running_balance': float(running_balance),
                'unit_cost': float(txn.unit_cost) if txn.unit_cost else None,
                'source_doc_type': txn.source_doc_type,
                'source_doc_id': txn.source_doc_id if hasattr(txn, 'source_doc_id') else None
            })
        
        # Get item details
        item = DimItem.objects.get(item_key=item_key)
        warehouse = Warehouse.objects.get(warehouse_key=warehouse_key)
        
        return Response({
            'item': {
                'item_key': item.item_key,
                'item_code': item.item_code,
                'item_name': item.name
            },
            'warehouse': {
                'warehouse_key': warehouse.warehouse_key,
                'warehouse_name': warehouse.name
            },
            'ledger': ledger,
            'final_balance': float(running_balance)
        })


# ==================== INVENTORY DASHBOARD ====================

class InventoryDashboardView(APIView):
    """Inventory module dashboard"""
    
    def get(self, request):
        """Get inventory overview"""
        
        # Total transactions by type
        txn_stats = InventoryTransaction.objects.aggregate(
            total=Sum('quantity'),
            in_qty=Sum('quantity', filter=Q(movement_type='IN')),
            out_qty=Sum('quantity', filter=Q(movement_type='OUT')),
            adjustment_qty=Sum('quantity', filter=Q(movement_type='ADJUSTMENT')),
            transfer_qty=Sum('quantity', filter=Q(movement_type='TRANSFER'))
        )
        
        # Total value of inventory
        total_value = InventoryTransaction.objects.filter(
            total_cost__isnull=False
        ).aggregate(total=Sum('total_cost'))['total'] or 0
        
        # Count unique items with stock
        items_with_stock = InventoryTransaction.objects.values(
            'item_key'
        ).annotate(
            total_qty=Sum('quantity')
        ).filter(total_qty__gt=0).count()
        
        # Count warehouses with stock
        warehouses_with_stock = InventoryTransaction.objects.values(
            'warehouse_key'
        ).annotate(
            total_qty=Sum('quantity')
        ).filter(total_qty__gt=0).count()
        
        # Recent transactions
        recent_txns = InventoryTransaction.objects.select_related(
            'item_key', 'warehouse_key'
        ).order_by('-tx_date', '-inv_txn_id')[:10]
        
        recent_txns_data = [{
            'inv_txn_id': txn.inv_txn_id,
            'item_name': txn.item_key.name,
            'warehouse_name': txn.warehouse_key.name,
            'movement_type': txn.movement_type,
            'quantity': float(txn.quantity),
            'transaction_date': txn.tx_date,
            'source_doc_type': txn.source_doc_type
        } for txn in recent_txns]
        
        # Count total active items
        total_items = DimItem.objects.filter(is_active=True).count()

        # Today's transactions
        from datetime import date
        today = date.today()
        today_in = InventoryTransaction.objects.filter(
            tx_date=today, movement_type='IN'
        ).aggregate(qty=Sum('quantity'))['qty'] or 0
        today_out = InventoryTransaction.objects.filter(
            tx_date=today, movement_type='OUT'
        ).aggregate(qty=Sum('quantity'))['qty'] or 0
        today_count = InventoryTransaction.objects.filter(tx_date=today).count()

        return Response({
            'total_items': total_items,
            'items_in_stock': items_with_stock,
            'low_stock_items': 0,
            'out_of_stock': max(0, total_items - items_with_stock),
            'total_value': float(total_value),
            'total_quantity': float(txn_stats['total'] or 0),
            'today_stock_in': float(today_in or 0),
            'today_stock_out': float(abs(today_out or 0)),
            'today_movements': today_count,
            'recent_movements': recent_txns_data
        })