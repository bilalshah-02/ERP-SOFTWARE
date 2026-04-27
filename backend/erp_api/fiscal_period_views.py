# backend/erp_api/fiscal_period_views.py - FIXED FOR YOUR MODEL
"""
Fiscal Period Views - Manage accounting periods

Works with your actual FiscalPeriod model fields:
- period_key (PK)
- company_key
- period_code
- start_date
- end_date
- is_closed
"""

from rest_framework.viewsets import ViewSet
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from datetime import datetime

def model_by_table(table: str):
    """Helper to get model by table name"""
    from . import models
    for name in dir(models):
        cls = getattr(models, name)
        if hasattr(cls, "_meta") and getattr(cls._meta, "db_table", None) == table:
            return cls
    raise LookupError(f"Model for table '{table}' not found")

# Get model
FiscalPeriod = model_by_table("fiscal_period")


class FiscalPeriodViewSet(ViewSet):
    """Fiscal Period CRUD operations"""
    
    def list(self, request):
        """List all fiscal periods"""
        try:
            company_key = request.query_params.get('company_key')
            
            # Filter by company if provided
            if company_key:
                periods = FiscalPeriod.objects.filter(company_key=company_key).order_by('-start_date')
            else:
                periods = FiscalPeriod.objects.all().order_by('-start_date')
            
            data = [{
                'period_key': p.period_key,
                'period_code': p.period_code,
                'start_date': p.start_date.isoformat() if p.start_date else None,
                'end_date': p.end_date.isoformat() if p.end_date else None,
                'is_closed': p.is_closed if hasattr(p, 'is_closed') else None,
                'company_key': p.company_key_id if hasattr(p, 'company_key_id') else None,
            } for p in periods]
            
            return Response({
                'success': True,
                
                    'periods': data,
                    'count': len(data)
                
            })
            
        except Exception as e:
            import traceback
            print("ERROR in fiscal period list:")
            print(traceback.format_exc())
            return Response(
                {
                    'success': False,
                    'error': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, pk=None):
        """Get single fiscal period"""
        try:
            period = get_object_or_404(FiscalPeriod, period_key=pk)
            
            data = {
                'period_key': period.period_key,
                'period_code': period.period_code,
                'start_date': period.start_date.isoformat() if period.start_date else None,
                'end_date': period.end_date.isoformat() if period.end_date else None,
                'is_closed': period.is_closed if hasattr(period, 'is_closed') else None,
                'company_key': period.company_key_id if hasattr(period, 'company_key_id') else None,
            }
            
            return Response({
                'success': True,
                'data': data
            })
            
        except Exception as e:
            import traceback
            print("ERROR in fiscal period retrieve:")
            print(traceback.format_exc())
            return Response(
                {
                    'success': False,
                    'error': str(e)
                },
                status=status.HTTP_404_NOT_FOUND
            )
    
    def create(self, request):
        """Create new fiscal period"""
        try:
            data = request.data
            
            # Required fields
            period_code = data.get('period_code')
            start_date = data.get('start_date')
            end_date = data.get('end_date')
            
            if not all([period_code, start_date, end_date]):
                return Response({
                    'success': False,
                    'error': 'period_code, start_date, and end_date are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Parse dates
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
            except ValueError as e:
                return Response({
                    'success': False,
                    'error': f'Invalid date format. Use YYYY-MM-DD. Error: {str(e)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate dates
            if end_date_obj < start_date_obj:
                return Response({
                    'success': False,
                    'error': 'End date must be after start date'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get company_key
            company_key = data.get('company_key', 1)
            
            # Check for overlapping periods
            overlapping = FiscalPeriod.objects.filter(
                company_key_id=company_key,
                start_date__lte=end_date_obj,
                end_date__gte=start_date_obj
            ).exists()
            
            if overlapping:
                return Response({
                    'success': False,
                    'error': 'A period already exists that overlaps with these dates'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if period_code is unique for this company
            if FiscalPeriod.objects.filter(company_key_id=company_key, period_code=period_code).exists():
                return Response({
                    'success': False,
                    'error': f'Period code "{period_code}" already exists for this company'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create period - ONLY use fields that exist in your model
            period = FiscalPeriod.objects.create(
                company_key_id=company_key,
                period_code=period_code,
                start_date=start_date_obj,
                end_date=end_date_obj,
                is_closed=data.get('is_closed', False)
            )
            
            return Response({
                'success': True,
                'message': f'Period {period_code} created successfully',
                'data': {
                    'period_key': period.period_key,
                    'period_code': period.period_code,
                    'start_date': period.start_date.isoformat(),
                    'end_date': period.end_date.isoformat(),
                    'is_closed': period.is_closed if hasattr(period, 'is_closed') else None,
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            print("ERROR in fiscal period create:")
            print(traceback.format_exc())
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def update(self, request, pk=None):
        """Update fiscal period"""
        try:
            period = get_object_or_404(FiscalPeriod, period_key=pk)
            data = request.data
            
            # Update only the fields that exist
            if 'period_code' in data:
                period.period_code = data['period_code']
            
            if 'start_date' in data:
                period.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            
            if 'end_date' in data:
                period.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
            
            if 'is_closed' in data and hasattr(period, 'is_closed'):
                period.is_closed = data['is_closed']
            
            period.save()
            
            return Response({
                'success': True,
                'message': 'Period updated successfully',
                'data': {
                    'period_key': period.period_key,
                    'period_code': period.period_code,
                    'start_date': period.start_date.isoformat(),
                    'end_date': period.end_date.isoformat(),
                }
            })
            
        except Exception as e:
            import traceback
            print("ERROR in fiscal period update:")
            print(traceback.format_exc())
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, pk=None):
        """Delete fiscal period"""
        try:
            period = get_object_or_404(FiscalPeriod, period_key=pk)
            
            # Check if period has transactions
            # Get GlJournal model
            GlJournal = model_by_table("gl_journal")
            
            if GlJournal.objects.filter(period_key=period).exists():
                return Response({
                    'success': False,
                    'error': 'Cannot delete period with posted transactions'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            period_code = period.period_code
            period.delete()
            
            return Response({
                'success': True,
                'message': f'Period {period_code} deleted successfully'
            })
            
        except Exception as e:
            import traceback
            print("ERROR in fiscal period delete:")
            print(traceback.format_exc())
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class FiscalPeriodActionsView(APIView):
    """Actions on fiscal periods (open/close)"""
    
    def post(self, request, pk, action):
        """Perform action on period"""
        try:
            period = get_object_or_404(FiscalPeriod, period_key=pk)
            
            # Check if model has is_closed field
            if not hasattr(period, 'is_closed'):
                return Response({
                    'success': False,
                    'error': 'Period model does not support open/close status'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if action == 'open' or action == 'reopen':
                period.is_closed = False
                period.save()
                return Response({
                    'success': True,
                    'message': f'Period {period.period_code} opened'
                })
            
            elif action == 'close':
                period.is_closed = True
                period.save()
                return Response({
                    'success': True,
                    'message': f'Period {period.period_code} closed'
                })
            
            else:
                return Response({
                    'success': False,
                    'error': f'Unknown action: {action}'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            import traceback
            print(f"ERROR in fiscal period {action}:")
            print(traceback.format_exc())
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)