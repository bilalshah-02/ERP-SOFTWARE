# backend/erp_api/production_views.py - COMPLETE FIXED VERSION
"""
Production Views - Works with comprehensive production_serializers.py

Key Features:
- Uses model_by_table() helper
- Compatible with FIFO costing serializers  
- Proper error handling with traceback
- Consistent response format
"""

from rest_framework.viewsets import ViewSet
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q

from .production_serializers import (
    BomSerializer, BomCreateSerializer,
    ProductionBatchSerializer,
    MaterialIssueSerializer,
    ProductionCompletionSerializer,
    # ⭐ PHASE 8: Labor & Overhead
    LaborEntrySerializer,
    OverheadAllocationSerializer,
    BatchCostSummarySerializer,
)

# Import models using the helper
def model_by_table(table: str):
    """Helper to get model by table name"""
    from . import models
    for name in dir(models):
        cls = getattr(models, name)
        if hasattr(cls, "_meta") and getattr(cls._meta, "db_table", None) == table:
            return cls
    raise LookupError(f"Model for table '{table}' not found")

# Get models
Bom = model_by_table("bom")
BomComponent = model_by_table("bom_component")
ProductionBatch = model_by_table("production_batch")
DimItem = model_by_table("dim_item")
DimBatch = model_by_table("dim_batch")


# ==================== BOM VIEWSET ====================

class BomViewSet(ViewSet):
    """Bill of Materials ViewSet"""
    
    def list(self, request):
        """List all BOMs with components"""
        try:
            boms_qs = Bom.objects.select_related('parent_item_key').all()
            serializer = BomSerializer(boms_qs, many=True)
            
            return Response({
                'success': True,
                'data': {
                    'boms': serializer.data,
                    'count': len(serializer.data)
                }
            })
            
        except Exception as e:
            import traceback
            print("ERROR in BOM list:")
            print(traceback.format_exc())
            return Response(
                {
                    'success': False,
                    'error': str(e),
                    'detail': traceback.format_exc()
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, pk=None):
        """Get single BOM with components"""
        try:
            bom = get_object_or_404(Bom.objects.select_related('parent_item_key'), bom_key=pk)
            serializer = BomSerializer(bom)
            
            return Response({
                'success': True,
                'data': serializer.data
            })
            
        except Exception as e:
            import traceback
            print("ERROR in BOM retrieve:")
            print(traceback.format_exc())
            return Response(
                {
                    'success': False,
                    'error': str(e)
                },
                status=status.HTTP_404_NOT_FOUND if 'not found' in str(e).lower() else status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request):
        """Create new BOM with validation"""
        try:
            serializer = BomCreateSerializer(data=request.data)
            
            if serializer.is_valid():
                bom = serializer.save()
                result_serializer = BomSerializer(bom)
                
                return Response({
                    'success': True,
                    'message': f'BOM {bom.bom_code} created successfully',
                    'data': result_serializer.data
                }, status=status.HTTP_201_CREATED)
            
            return Response({
                'success': False,
                'error': 'Validation failed',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            import traceback
            print("ERROR in BOM create:")
            print(traceback.format_exc())
            return Response(
                {
                    'success': False,
                    'error': str(e),
                    'detail': traceback.format_exc()
                },
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a BOM"""
        try:
            bom = get_object_or_404(Bom, bom_key=pk)
            bom.is_active = True
            bom.save()
            
            return Response({
                'success': True,
                'message': f'BOM {bom.bom_code} activated'
            })
        except Exception as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a BOM"""
        try:
            bom = get_object_or_404(Bom, bom_key=pk)
            bom.is_active = False
            bom.save()
            
            return Response({
                'success': True,
                'message': f'BOM {bom.bom_code} deactivated'
            })
        except Exception as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# ==================== PRODUCTION BATCH VIEWSET ====================

class ProductionBatchViewSet(ViewSet):
    """Production Batch ViewSet"""
    
    def list(self, request):
        """List all production batches"""
        try:
            batches = ProductionBatch.objects.select_related(
                'batch_key', 'bom_key', 'bom_key__parent_item_key'
            ).all().order_by('-created_at')
            
            serializer = ProductionBatchSerializer(batches, many=True)
            
            return Response({
                'success': True,
                'data': {
                    'batches': serializer.data,
                    'count': len(serializer.data)
                }
            })
            
        except Exception as e:
            import traceback
            print("ERROR in batch list:")
            print(traceback.format_exc())
            return Response(
                {
                    'success': False,
                    'error': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, pk=None):
        """Get single batch details"""
        try:
            batch = get_object_or_404(
                ProductionBatch.objects.select_related(
                    'batch_key', 'bom_key', 'bom_key__parent_item_key'
                ),
                prod_batch_key=pk
            )
            
            serializer = ProductionBatchSerializer(batch)
            
            return Response({
                'success': True,
                'data': serializer.data
            })
            
        except Exception as e:
            import traceback
            print("ERROR in batch retrieve:")
            print(traceback.format_exc())
            return Response(
                {
                    'success': False,
                    'error': str(e)
                },
                status=status.HTTP_404_NOT_FOUND if 'not found' in str(e).lower() else status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request):
        """Create a new production batch"""
        try:
            data = request.data
            bom_key = data.get('bom_key')
            planned_quantity = data.get('planned_quantity')
            
            if not bom_key or not planned_quantity:
                return Response(
                    {'success': False, 'error': 'bom_key and planned_quantity are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get BOM
            bom = get_object_or_404(Bom, bom_key=bom_key)
            
            # Generate batch number
            from django.utils import timezone
            today = timezone.now()
            
            # Count batches (simple counter without date filter)
            batch_count = DimBatch.objects.count() + 1
            batch_number_str = f"BATCH-{today.strftime('%Y%m%d')}-{batch_count:04d}"
            
            # Create Batch record with only valid fields
            batch_record = DimBatch.objects.create(
    batch_number=batch_number_str,
    mfg_date=today.date(),
    item_key=bom.parent_item_key  # ← ADD THIS LINE
)
            
            # Create ProductionBatch
            prod_batch = ProductionBatch.objects.create(
                company_key_id=1, 
                batch_key=batch_record,
                bom_key=bom,
                planned_qty=planned_quantity,
                start_date=data.get('start_date', today.date()),
                status='DRAFT',
                created_by_id=None, 
            )
            
            serializer = ProductionBatchSerializer(prod_batch)
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Bom.DoesNotExist:
            return Response(
                {'success': False, 'error': f'BOM with key {bom_key} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import traceback
            print("ERROR in batch create:", traceback.format_exc())
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ==================== MATERIAL ISSUE ====================

class MaterialIssueView(APIView):
    """..."""
    
    def post(self, request):
        """Issue materials with FIFO costing and validation"""
        try:
            # Convert prod_batch_key to dim_batch key
            data = request.data.copy()
            prod_batch = ProductionBatch.objects.filter(
                prod_batch_key=data.get('batch_key')
            ).first()
            if prod_batch:
                data['batch_key'] = prod_batch.batch_key.batch_key
            
            serializer = MaterialIssueSerializer(data=data)
            
            if serializer.is_valid():
                result = serializer.save()
                
                return Response({
                    'success': True,
                    'message': f'Materials issued successfully for batch {result["batch_number"]}',
                    'data': result
                }, status=status.HTTP_201_CREATED)
            
            return Response({
                'success': False,
                'error': 'Validation failed',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            import traceback
            print("ERROR in Material Issue:")
            print(traceback.format_exc())
            return Response(
                {
                    'success': False,
                    'error': str(e),
                    'detail': traceback.format_exc()
                },
                status=status.HTTP_400_BAD_REQUEST
            )            
        except Exception as e:
            import traceback
            print("ERROR in Material Issue:")
            print(traceback.format_exc())
            return Response(
                {
                    'success': False,
                    'error': str(e),
                    'detail': traceback.format_exc()
                },
                status=status.HTTP_400_BAD_REQUEST
            )


# ==================== PRODUCTION COMPLETION ====================

class ProductionCompletionView(APIView):
    """
    Complete production and receive finished goods
    
    Expected payload:
    {
        "prod_batch_key": 1,
        "completion_date": "2024-01-20",
        "quantity_completed": 95,
        "warehouse_key": 1,
        "wip_account_key": 5,
        "fg_inventory_account_key": 3,
        "notes": "Optional notes",
        "created_by": 1
    }
    
    Returns:
    {
        "production_batch": {...},
        "batch_number": "BATCH-202401-0123",
        "gl_journal": {...},
        "total_amount": 1234.56,
        "quantity_completed": 95.0,
        "unit_cost": 12.99
    }
    """
    
    def post(self, request):
        """Complete production with accurate WIP costing"""
        try:
            serializer = ProductionCompletionSerializer(data=request.data)
            
            if serializer.is_valid():
                result = serializer.save()
                
                return Response({
                    'success': True,
                    'message': result.get('message', 'Production completed successfully'),
                    'data': result
                }, status=status.HTTP_201_CREATED)
            
            return Response({
                'success': False,
                'error': 'Validation failed',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            import traceback
            print("ERROR in Production Completion:")
            print(traceback.format_exc())
            return Response(
                {
                    'success': False,
                    'error': str(e),
                    'detail': traceback.format_exc()
                },
                status=status.HTTP_400_BAD_REQUEST
            )


# ==================== DASHBOARD ====================


# ==================== PHASE 8: LABOR & OVERHEAD VIEWS ====================

# ==================== LABOR COST VIEW ====================

class LaborEntryView(APIView):
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
    
    def post(self, request):
        """Record labor entry"""
        try:
            # Import serializer (add this import at top of file)
            # from .production_serializers import LaborEntrySerializer
            
            serializer = LaborEntrySerializer(data=request.data)
            
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            result = serializer.save()
            
            return Response({
                'success': True,
                'data': result
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            print("ERROR in labor entry:")
            print(traceback.format_exc())
            return Response({
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== OVERHEAD ALLOCATION VIEW ====================

class OverheadAllocationView(APIView):
    """
    Allocate overhead to production batch
    
    POST /api/production/overhead/
    {
        "prod_batch_key": 123,
        "overhead_method": "PERCENTAGE",  // or UNIT, FIXED
        "overhead_rate": 40.00,
        "allocation_date": "2026-01-18",
        "notes": "Factory overhead"
    }
    """
    
    def post(self, request):
        """Allocate overhead"""
        try:
            # Import serializer (add this import at top of file)
            # from .production_serializers import OverheadAllocationSerializer
            
            serializer = OverheadAllocationSerializer(data=request.data)
            
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            result = serializer.save()
            
            return Response({
                'success': True,
                'data': result
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            print("ERROR in overhead allocation:")
            print(traceback.format_exc())
            return Response({
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== BATCH COST SUMMARY VIEW ====================

class BatchCostSummaryView(APIView):
    """
    Get cost summary for a production batch
    
    GET /api/production/batches/{batch_id}/cost-summary/
    
    Returns detailed breakdown of material, labor, overhead costs
    """
    
    def get(self, request, batch_id=None):
        """Get batch cost summary"""
        try:
            # Get batch_id from URL parameter or query string
            prod_batch_key = batch_id or request.query_params.get('prod_batch_key')
            
            if not prod_batch_key:
                return Response({
                    'success': False,
                    'error': 'prod_batch_key is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Import serializer (add this import at top of file)
            # from .production_serializers import BatchCostSummarySerializer
            
            serializer = BatchCostSummarySerializer()
            result = serializer.get_cost_summary(prod_batch_key)
            
            return Response({
                'success': True,
                'data': result
            })
            
        except ProductionBatch.DoesNotExist:
            return Response({
                'success': False,
                'error': f'Production batch {prod_batch_key} not found'
            }, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            import traceback
            print("ERROR in batch cost summary:")
            print(traceback.format_exc())
            return Response({
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== LABOR REPORT VIEW ====================

class LaborReportView(APIView):
    """
    Get labor report for production
    
    GET /api/production/labor-report/
    ?company_key=1
    &start_date=2026-01-01
    &end_date=2026-01-31
    &prod_batch_key=123 (optional)
    
    Returns labor hours and costs by batch, worker, cost center
    """
    
    def get(self, request):
        """Get labor report"""
        try:
            company_key = request.query_params.get('company_key', 1)
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            prod_batch_key = request.query_params.get('prod_batch_key')
            
            if not start_date or not end_date:
                return Response({
                    'success': False,
                    'error': 'start_date and end_date are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Parse dates
            from datetime import datetime
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            
            # Build query
            labor_entries = BatchCostDetail.objects.filter(
                cost_head='LABOR',
                created_at__date__gte=start,
                created_at__date__lte=end
            ).select_related('prod_batch_key__batch_key')
            
            if prod_batch_key:
                labor_entries = labor_entries.filter(prod_batch_key_id=prod_batch_key)
            
            # Filter by company
            labor_entries = labor_entries.filter(
                prod_batch_key__company_key_id=company_key
            )
            
            # Calculate totals
            total_cost = labor_entries.aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0')
            
            # Build detailed list
            labor_list = []
            for entry in labor_entries:
                # Parse notes to extract hours/rate if possible
                notes = entry.notes or ''
                
                labor_list.append({
                    'batch_cost_id': entry.batch_cost_id,
                    'prod_batch_key': entry.prod_batch_key_id,
                    'batch_number': entry.prod_batch_key.batch_key.batch_number,
                    'labor_cost': float(entry.amount),
                    'notes': notes,
                    'created_at': entry.created_at
                })
            
            return Response({
                'success': True,
                'data': {
                    'period': {
                        'start_date': start_date,
                        'end_date': end_date
                    },
                    'summary': {
                        'total_entries': len(labor_list),
                        'total_labor_cost': float(total_cost)
                    },
                    'entries': labor_list
                }
            })
            
        except Exception as e:
            import traceback
            print("ERROR in labor report:")
            print(traceback.format_exc())
            return Response({
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== OVERHEAD REPORT VIEW ====================

class OverheadReportView(APIView):
    """
    Get overhead report for production
    
    GET /api/production/overhead-report/
    ?company_key=1
    &start_date=2026-01-01
    &end_date=2026-01-31
    
    Returns overhead allocations by batch and method
    """
    
    def get(self, request):
        """Get overhead report"""
        try:
            company_key = request.query_params.get('company_key', 1)
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            if not start_date or not end_date:
                return Response({
                    'success': False,
                    'error': 'start_date and end_date are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Parse dates
            from datetime import datetime
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            
            # Build query
            overhead_entries = BatchCostDetail.objects.filter(
                cost_head='OVERHEAD',
                created_at__date__gte=start,
                created_at__date__lte=end
            ).select_related('prod_batch_key__batch_key')
            
            # Filter by company
            overhead_entries = overhead_entries.filter(
                prod_batch_key__company_key_id=company_key
            )
            
            # Calculate totals
            total_cost = overhead_entries.aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0')
            
            # Build detailed list
            overhead_list = []
            for entry in overhead_entries:
                overhead_list.append({
                    'batch_cost_id': entry.batch_cost_id,
                    'prod_batch_key': entry.prod_batch_key_id,
                    'batch_number': entry.prod_batch_key.batch_key.batch_number,
                    'overhead_cost': float(entry.amount),
                    'notes': entry.notes,
                    'created_at': entry.created_at
                })
            
            return Response({
                'success': True,
                'data': {
                    'period': {
                        'start_date': start_date,
                        'end_date': end_date
                    },
                    'summary': {
                        'total_entries': len(overhead_list),
                        'total_overhead_cost': float(total_cost)
                    },
                    'entries': overhead_list
                }
            })
            
        except Exception as e:
            import traceback
            print("ERROR in overhead report:")
            print(traceback.format_exc())
            return Response({
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class ProductionDashboardView(APIView):
    """Production module dashboard with statistics"""
    
    def get(self, request):
        """Get production statistics"""
        try:
            # BOM statistics
            total_boms = Bom.objects.count()
            active_boms = Bom.objects.filter(is_active=True).count()
            inactive_boms = total_boms - active_boms
            
            # Batch statistics with correct status values
            batch_stats = ProductionBatch.objects.aggregate(
                total=Count('prod_batch_key'),
                draft=Count('prod_batch_key', filter=Q(status='DRAFT') | Q(status__isnull=True)),
                in_progress=Count('prod_batch_key', filter=Q(status='POSTED')),
                completed=Count('prod_batch_key', filter=Q(status='CONFIRMED'))
            )
            
            return Response({
                'success': True,
                'data': {
                    'boms': {
                        'total': total_boms,
                        'active': active_boms,
                        'inactive': inactive_boms
                    },
                    'batches': {
                        'total': batch_stats['total'],
                        'draft': batch_stats['draft'],
                        'in_progress': batch_stats['in_progress'],
                        'completed': batch_stats['completed']
                    }
                }
            })
            
        except Exception as e:
            import traceback
            print("ERROR in Dashboard:")
            print(traceback.format_exc())
            return Response(
                {
                    'success': False,
                    'error': str(e),
                    'detail': traceback.format_exc()
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ==================== MATERIAL AVAILABILITY ====================

class MaterialAvailabilityView(APIView):
    """
    Check material availability before production
    
    This uses the comprehensive validation from serializers
    """
    
    def post(self, request):
        """Check if materials are available for production"""
        try:
            from .production_serializers import MaterialAvailabilityCheckSerializer
            
            serializer = MaterialAvailabilityCheckSerializer(data=request.data)
            
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'error': 'Validation failed',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get validated data
            bom_key = serializer.validated_data['bom_key']
            quantity = serializer.validated_data['quantity_to_produce']
            warehouse_key = serializer.validated_data.get('warehouse_key', 1)
            
            # Get BOM
            bom = Bom.objects.get(bom_key=bom_key)
            components = BomComponent.objects.filter(bom_key=bom).select_related('component_item_key')
            
            # Check availability using costing engine
            from .inventory_costing import InventoryCostingEngine
            costing_engine = InventoryCostingEngine()
            
            requirements = []
            all_available = True
            
            for comp in components:
                # Calculate required with scrap
                scrap_factor = 1 + (comp.scrap_percent or 0) / 100
                qty_required = quantity * comp.quantity_per * scrap_factor
                
                # Get available stock
                try:
                    available = costing_engine.get_available_stock(
                        request.data.get('company_key', 1),
                        comp.component_item_key.item_key,
                        warehouse_key
                    )
                except:
                    available = 0  # Fallback if costing engine fails
                
                sufficient = available >= qty_required
                if not sufficient:
                    all_available = False
                
                requirements.append({
                    'item_key': comp.component_item_key.item_key,
                    'item_code': comp.component_item_key.item_code,
                    'item_name': comp.component_item_key.name,
                    'uom': getattr(comp.component_item_key, 'unit_of_measure', '') or '',
                    'required': float(qty_required),
                    'available': float(available),
                    'sufficient': sufficient
                })
            
            return Response({
                'success': True,
                'data': {
                    'available': all_available,
                    'recipe_info': {
                        'bom_code': bom.bom_code,
                        'product_name': bom.parent_item_key.name,
                        'quantity': float(quantity)
                    },
                    'requirements': requirements
                }
            })
            
        except Bom.DoesNotExist:
            return Response({
                'success': False,
                'error': 'BOM not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            print("ERROR in Material Availability:")
            print(traceback.format_exc())
            return Response(
                {
                    'success': False,
                    'error': str(e),
                    'detail': traceback.format_exc()
                },
                status=status.HTTP_400_BAD_REQUEST
            )


# ==================== MATERIAL AVAILABILITY BY PRODUCT ====================

class MaterialAvailabilityByProductView(APIView):
    """
    Check material availability by product (finds recipe automatically)
    
    Convenience endpoint that finds the BOM for a product automatically.
    """
    
    def post(self, request):
        """Check if materials are available for a product"""
        try:
            product_item_key = request.data.get('product_item_key')
            quantity = request.data.get('quantity')
            
            if not product_item_key or not quantity:
                return Response({
                    'success': False,
                    'error': 'product_item_key and quantity are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get product
            product = DimItem.objects.get(item_key=product_item_key)
            
            # Find active BOM for this product
            bom = Bom.objects.filter(
                parent_item_key=product,
                is_active=True
            ).first()
            
            if not bom:
                return Response({
                    'success': False,
                    'error': f'No active recipe (BOM) found for product {product.name}'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Get components
            components = BomComponent.objects.filter(bom_key=bom).select_related('component_item_key')
            
            # Check availability using costing engine
            from .inventory_costing import InventoryCostingEngine
            costing_engine = InventoryCostingEngine()
            
            warehouse_key = request.data.get('warehouse_key', 1)
            company_key = request.data.get('company_key', 1)
            
            requirements = []
            all_available = True
            
            for comp in components:
                # Calculate required with scrap
                scrap_factor = 1 + (comp.scrap_percent or 0) / 100
                qty_required = float(quantity) * comp.quantity_per * scrap_factor
                
                # Get available stock
                try:
                    available = costing_engine.get_available_stock(
                        company_key,
                        comp.component_item_key.item_key,
                        warehouse_key
                    )
                except:
                    available = 0  # Fallback if costing engine fails
                
                sufficient = available >= qty_required
                if not sufficient:
                    all_available = False
                
                requirements.append({
                    'item_key': comp.component_item_key.item_key,
                    'item_code': comp.component_item_key.item_code,
                    'item_name': comp.component_item_key.name,
                    'uom': getattr(comp.component_item_key, 'unit_of_measure', '') or '',
                    'required': float(qty_required),
                    'available': float(available),
                    'sufficient': sufficient
                })
            
            return Response({
                'success': True,
                'data': {
                    'available': all_available,
                    'recipe_info': {
                        'product_name': product.name,
                        'product_code': product.item_code,
                        'bom_code': bom.bom_code
                    },
                    'requirements': requirements
                }
            })
            
        except DimItem.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Product not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            print("ERROR in Material Availability By Product:")
            print(traceback.format_exc())
            return Response(
                {
                    'success': False,
                    'error': str(e),
                    'detail': traceback.format_exc()
                },
                status=status.HTTP_400_BAD_REQUEST
            )