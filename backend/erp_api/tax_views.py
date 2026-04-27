# backend/erp_api/tax_views.py - PHASE 6 COMPLETE
"""
✅ PHASE 6: Tax Management Views

API endpoints for:
- Tax configuration
- Tax calculation (preview)
- Tax reports
- Available tax rates
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, date
from decimal import Decimal

from .tax_engine import tax_engine, tax_reporter


# ==================== TAX CALCULATION ====================

class TaxCalculationView(APIView):
    """
    Calculate tax (preview before posting)
    
    POST /api/tax/calculate/
    {
        "amount": 1000.00,
        "tax_rate_key": 1,
        "transaction_date": "2026-01-18",
        "tax_inclusive": false
    }
    
    Returns calculated tax amount
    """
    
    def post(self, request):
        """Calculate tax"""
        try:
            amount = Decimal(str(request.data.get('amount', 0)))
            tax_rate_key = request.data.get('tax_rate_key')
            transaction_date = request.data.get('transaction_date')
            tax_inclusive = request.data.get('tax_inclusive', False)
            
            if not tax_rate_key:
                return Response({
                    'success': False,
                    'error': 'tax_rate_key is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Parse date
            if transaction_date:
                transaction_date = datetime.strptime(transaction_date, '%Y-%m-%d').date()
            else:
                transaction_date = date.today()
            
            # Calculate tax
            if tax_inclusive:
                result = tax_engine.calculate_tax_inclusive(
                    amount, tax_rate_key, transaction_date
                )
            else:
                result = tax_engine.calculate_tax(
                    amount, tax_rate_key, transaction_date
                )
            
            return Response({
                'success': True,
                'data': result
            })
            
        except Exception as e:
            import traceback
            print("ERROR in Tax Calculation:")
            print(traceback.format_exc())
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


# ==================== AVAILABLE TAX RATES ====================

class TaxRatesView(APIView):
    """
    Get available tax rates
    
    GET /api/tax/rates/?company_key=1&as_of_date=2026-01-18
    
    Returns list of active tax rates
    """
    
    def get(self, request):
        """Get available tax rates"""
        try:
            company_key = request.query_params.get('company_key', 1)
            as_of_date = request.query_params.get('as_of_date')
            
            if as_of_date:
                as_of_date = datetime.strptime(as_of_date, '%Y-%m-%d').date()
            else:
                as_of_date = date.today()
            
            rates = tax_engine.get_available_tax_rates(company_key, as_of_date)
            
            return Response({
                'success': True,
                'data': {
                    'company_key': int(company_key),
                    'as_of_date': str(as_of_date),
                    'rates': rates
                }
            })
            
        except Exception as e:
            import traceback
            print("ERROR in Tax Rates:")
            print(traceback.format_exc())
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== TAX REPORT ====================

class TaxReportView(APIView):
    """
    Tax Report (VAT Return style)
    
    GET /api/tax/report/
    ?company_key=1
    &start_date=2026-01-01
    &end_date=2026-01-31
    &tax_type_key=1 (optional)
    
    Returns tax collected vs tax paid
    """
    
    def get(self, request):
        """Generate tax report"""
        try:
            company_key = request.query_params.get('company_key', 1)
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            tax_type_key = request.query_params.get('tax_type_key')
            
            if not start_date or not end_date:
                return Response({
                    'success': False,
                    'error': 'start_date and end_date are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            
            if tax_type_key:
                tax_type_key = int(tax_type_key)
            
            report = tax_reporter.generate_tax_report(
                company_key, start_date, end_date, tax_type_key
            )
            
            return Response({
                'success': True,
                'data': report
            })
            
        except Exception as e:
            import traceback
            print("ERROR in Tax Report:")
            print(traceback.format_exc())
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== TAX SUMMARY (for dashboard) ====================

class TaxSummaryView(APIView):
    """
    Quick tax summary for dashboard
    
    GET /api/tax/summary/?company_key=1&month=2026-01
    
    Returns current month tax summary
    """
    
    def get(self, request):
        """Get tax summary"""
        try:
            from datetime import datetime
            from calendar import monthrange
            
            company_key = request.query_params.get('company_key', 1)
            month_str = request.query_params.get('month')
            
            if month_str:
                year, month = map(int, month_str.split('-'))
            else:
                today = date.today()
                year, month = today.year, today.month
            
            # Get month range
            start_date = date(year, month, 1)
            _, last_day = monthrange(year, month)
            end_date = date(year, month, last_day)
            
            report = tax_reporter.generate_tax_report(
                company_key, start_date, end_date
            )
            
            return Response({
                'success': True,
                'data': {
                    'month': f"{year}-{month:02d}",
                    'tax_collected': report['totals']['total_output_tax'],
                    'tax_paid': report['totals']['total_input_tax'],
                    'tax_payable': report['totals']['total_net_tax_payable'],
                    'tax_types': report['tax_types']
                }
            })
            
        except Exception as e:
            import traceback
            print("ERROR in Tax Summary:")
            print(traceback.format_exc())
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)