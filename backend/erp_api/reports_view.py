# backend/erp_api/reports_views_PHASE7_COMPLETE.py
"""
Financial Reports Module - PHASE 7 COMPLETE
Enhanced with Project and Cost Center Reporting

New Features:
- P&L by Cost Center
- P&L by Project  
- Balance Sheet by dimensions
- Profitability analysis by department/project
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Q, F, Case, When, DecimalField
from decimal import Decimal
from datetime import datetime
from .models import *


def model_by_table(table_name):
    """Helper to get model class from table name"""
    import sys
    from . import models
    
    for name in dir(models):
        obj = getattr(models, name)
        if hasattr(obj, '_meta') and hasattr(obj._meta, 'db_table'):
            if obj._meta.db_table == table_name:
                return obj
    return None


class ProfitLossReportView(APIView):
    """
    Profit & Loss Statement with Multi-Dimensional Support
    
    GET /api/reports/profit-loss/
    Parameters:
    - company_key: required
    - start_date: required (YYYY-MM-DD)
    - end_date: required (YYYY-MM-DD)
    - cost_center: optional (filter by cost center)
    - project: optional (filter by project)
    - format: optional (summary|detailed) default=summary
    """
    
    def get(self, request):
        try:
            # Get parameters
            company_key = request.query_params.get('company_key')
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            cost_center = request.query_params.get('cost_center')
            project = request.query_params.get('project')
            report_format = request.query_params.get('format', 'summary')
            
            # Validate required parameters
            if not all([company_key, start_date, end_date]):
                return Response({
                    'error': 'company_key, start_date, and end_date are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get models
            GlJournal = model_by_table('gl_journal')
            GlLine = model_by_table('gl_line')
            ChartOfAccounts = model_by_table('chart_of_accounts')
            
            # Build base query
            gl_lines = GlLine.objects.filter(
                gl__company_key_id=company_key,
                gl__journal_date__gte=start_date,
                gl__journal_date__lte=end_date,
                gl__status='POSTED'
            ).select_related('account_key', 'gl')
            
            # Apply dimensional filters
            dimension_text = ""
            if cost_center:
                gl_lines = gl_lines.filter(cost_center_key_id=cost_center)
                dimension_text = f" - Cost Center {cost_center}"
            
            if project:
                gl_lines = gl_lines.filter(project_key_id=project)
                dimension_text += f" - Project {project}"
            
            # Get all revenue accounts
            revenue_accounts = ChartOfAccounts.objects.filter(
                company_key_id=company_key,
                account_type='REVENUE'
            ).values_list('account_key', flat=True)
            
            # Get all expense accounts
            expense_accounts = ChartOfAccounts.objects.filter(
                company_key_id=company_key,
                account_type='EXPENSE'
            ).values_list('account_key', flat=True)
            
            # Calculate revenue (credit - debit for revenue accounts)
            revenue_lines = gl_lines.filter(account_key_id__in=revenue_accounts)
            
            if report_format == 'detailed':
                # Detailed revenue breakdown
                revenue_detail = revenue_lines.values(
                    'account_key__account_code',
                    'account_key__account_name'
                ).annotate(
                    amount=Sum(F('credit') - F('debit'))
                ).order_by('account_key__account_code')
                
                revenue_data = {
                    'accounts': [
                        {
                            'code': item['account_key__account_code'],
                            'name': item['account_key__account_name'],
                            'amount': float(item['amount'] or 0)
                        }
                        for item in revenue_detail
                    ],
                    'total': float(sum(item['amount'] or 0 for item in revenue_detail))
                }
            else:
                # Summary
                total_revenue = revenue_lines.aggregate(
                    total=Sum(F('credit') - F('debit'))
                )['total'] or Decimal('0')
                revenue_data = {'total': float(total_revenue)}
            
            # Calculate expenses (debit - credit for expense accounts)
            expense_lines = gl_lines.filter(account_key_id__in=expense_accounts)
            
            # Separate COGS from operating expenses
            cogs_accounts = ChartOfAccounts.objects.filter(
                company_key_id=company_key,
                account_type='EXPENSE',
                account_name__icontains='cost of goods'
            ).values_list('account_key', flat=True)
            
            cogs_lines = expense_lines.filter(account_key_id__in=cogs_accounts)
            operating_expense_lines = expense_lines.exclude(account_key_id__in=cogs_accounts)
            
            if report_format == 'detailed':
                # COGS breakdown
                cogs_detail = cogs_lines.values(
                    'account_key__account_code',
                    'account_key__account_name'
                ).annotate(
                    amount=Sum(F('debit') - F('credit'))
                ).order_by('account_key__account_code')
                
                cogs_data = {
                    'accounts': [
                        {
                            'code': item['account_key__account_code'],
                            'name': item['account_key__account_name'],
                            'amount': float(item['amount'] or 0)
                        }
                        for item in cogs_detail
                    ],
                    'total': float(sum(item['amount'] or 0 for item in cogs_detail))
                }
                
                # Operating expenses breakdown
                opex_detail = operating_expense_lines.values(
                    'account_key__account_code',
                    'account_key__account_name'
                ).annotate(
                    amount=Sum(F('debit') - F('credit'))
                ).order_by('account_key__account_code')
                
                opex_data = {
                    'accounts': [
                        {
                            'code': item['account_key__account_code'],
                            'name': item['account_key__account_name'],
                            'amount': float(item['amount'] or 0)
                        }
                        for item in opex_detail
                    ],
                    'total': float(sum(item['amount'] or 0 for item in opex_detail))
                }
            else:
                # Summary
                total_cogs = cogs_lines.aggregate(
                    total=Sum(F('debit') - F('credit'))
                )['total'] or Decimal('0')
                
                total_opex = operating_expense_lines.aggregate(
                    total=Sum(F('debit') - F('credit'))
                )['total'] or Decimal('0')
                
                cogs_data = {'total': float(total_cogs)}
                opex_data = {'total': float(total_opex)}
            
            # Calculate totals
            revenue_total = Decimal(str(revenue_data['total']))
            cogs_total = Decimal(str(cogs_data['total']))
            opex_total = Decimal(str(opex_data['total']))
            
            gross_profit = revenue_total - cogs_total
            net_profit = gross_profit - opex_total
            
            # Calculate margins
            gross_margin = (gross_profit / revenue_total * 100) if revenue_total else Decimal('0')
            net_margin = (net_profit / revenue_total * 100) if revenue_total else Decimal('0')
            
            # Build response
            response_data = {
                'report_type': 'Profit & Loss Statement',
                'company_key': company_key,
                'period': {
                    'start_date': start_date,
                    'end_date': end_date
                },
                'dimensions': dimension_text.strip(' -'),
                'revenue': revenue_data,
                'cost_of_goods_sold': cogs_data,
                'gross_profit': float(gross_profit),
                'gross_margin_pct': float(gross_margin),
                'operating_expenses': opex_data,
                'net_profit': float(net_profit),
                'net_margin_pct': float(net_margin),
                'format': report_format
            }
            
            return Response(response_data)
            
        except Exception as e:
            import traceback
            return Response({
                'error': str(e),
                'traceback': traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BalanceSheetReportView(APIView):
    """
    Balance Sheet Report with Multi-Dimensional Support
    
    GET /api/reports/balance-sheet/
    Parameters:
    - company_key: required
    - as_of_date: required (YYYY-MM-DD)
    - cost_center: optional
    - project: optional
    - format: optional (summary|detailed)
    """
    
    def get(self, request):
        try:
            # Get parameters
            company_key = request.query_params.get('company_key')
            as_of_date = request.query_params.get('as_of_date')
            cost_center = request.query_params.get('cost_center')
            project = request.query_params.get('project')
            report_format = request.query_params.get('format', 'summary')
            
            if not all([company_key, as_of_date]):
                return Response({
                    'error': 'company_key and as_of_date are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get models
            GlLine = model_by_table('gl_line')
            ChartOfAccounts = model_by_table('chart_of_accounts')
            
            # Build base query - all transactions up to as_of_date
            gl_lines = GlLine.objects.filter(
                gl__company_key_id=company_key,
                gl__journal_date__lte=as_of_date,
                gl__status='POSTED'
            ).select_related('account_key', 'gl')
            
            # Apply dimensional filters
            dimension_text = ""
            if cost_center:
                gl_lines = gl_lines.filter(cost_center_key_id=cost_center)
                dimension_text = f" - Cost Center {cost_center}"
            
            if project:
                gl_lines = gl_lines.filter(project_key_id=project)
                dimension_text += f" - Project {project}"
            
            # Helper function to get account balances
            def get_account_balances(account_type):
                accounts = ChartOfAccounts.objects.filter(
                    company_key_id=company_key,
                    account_type=account_type
                ).values_list('account_key', flat=True)
                
                lines = gl_lines.filter(account_key_id__in=accounts)
                
                if report_format == 'detailed':
                    detail = lines.values(
                        'account_key__account_code',
                        'account_key__account_name'
                    ).annotate(
                        balance=Sum(F('debit') - F('credit'))
                    ).order_by('account_key__account_code')
                    
                    return {
                        'accounts': [
                            {
                                'code': item['account_key__account_code'],
                                'name': item['account_key__account_name'],
                                'balance': float(item['balance'] or 0)
                            }
                            for item in detail
                        ],
                        'total': float(sum(item['balance'] or 0 for item in detail))
                    }
                else:
                    total = lines.aggregate(
                        total=Sum(F('debit') - F('credit'))
                    )['total'] or Decimal('0')
                    return {'total': float(total)}
            
            # Get balances for each account type
            assets = get_account_balances('ASSET')
            liabilities = get_account_balances('LIABILITY')
            equity = get_account_balances('EQUITY')
            
            # Calculate retained earnings (Revenue - Expenses)
            revenue = get_account_balances('REVENUE')
            expenses = get_account_balances('EXPENSE')
            
            retained_earnings = Decimal(str(revenue['total'])) - Decimal(str(expenses['total']))
            
            # Total equity including retained earnings
            total_equity = Decimal(str(equity['total'])) + retained_earnings
            
            # Build response
            response_data = {
                'report_type': 'Balance Sheet',
                'company_key': company_key,
                'as_of_date': as_of_date,
                'dimensions': dimension_text.strip(' -'),
                'assets': assets,
                'liabilities': liabilities,
                'equity': {
                    'equity_accounts': equity,
                    'retained_earnings': float(retained_earnings),
                    'total': float(total_equity)
                },
                'total_assets': assets['total'],
                'total_liabilities_equity': float(Decimal(str(liabilities['total'])) + total_equity),
                'balanced': abs(Decimal(str(assets['total'])) - (Decimal(str(liabilities['total'])) + total_equity)) < Decimal('0.01'),
                'format': report_format
            }
            
            return Response(response_data)
            
        except Exception as e:
            import traceback
            return Response({
                'error': str(e),
                'traceback': traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProfitabilityAnalysisView(APIView):
    """
    Profitability Analysis by Cost Center or Project
    
    GET /api/reports/profitability/
    Parameters:
    - company_key: required
    - start_date: required
    - end_date: required
    - dimension: required (cost_center|project)
    """
    
    def get(self, request):
        try:
            company_key = request.query_params.get('company_key')
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            dimension = request.query_params.get('dimension', 'cost_center')
            
            if not all([company_key, start_date, end_date]):
                return Response({
                    'error': 'company_key, start_date, and end_date are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if dimension not in ['cost_center', 'project']:
                return Response({
                    'error': 'dimension must be either cost_center or project'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get models
            GlLine = model_by_table('gl_line')
            ChartOfAccounts = model_by_table('chart_of_accounts')
            DimCostCenter = model_by_table('dim_cost_center')
            DimProject = model_by_table('dim_project')
            
            # Get revenue and expense accounts
            revenue_accounts = ChartOfAccounts.objects.filter(
                company_key_id=company_key,
                account_type='REVENUE'
            ).values_list('account_key', flat=True)
            
            expense_accounts = ChartOfAccounts.objects.filter(
                company_key_id=company_key,
                account_type='EXPENSE'
            ).values_list('account_key', flat=True)
            
            # Build query
            dimension_field = f'{dimension}_key_id'
            dimension_name_field = f'{dimension}_key__name' if dimension == 'cost_center' else f'{dimension}_key__project_name'
            
            # Get all transactions with dimension
            gl_lines = GlLine.objects.filter(
                gl__company_key_id=company_key,
                gl__journal_date__gte=start_date,
                gl__journal_date__lte=end_date,
                gl__status='POSTED'
            ).exclude(**{dimension_field: None})
            
            # Get unique dimensions
            if dimension == 'cost_center':
                dimensions = DimCostCenter.objects.filter(
                    company_key_id=company_key
                ).values('cost_center_key', 'name')
            else:
                dimensions = DimProject.objects.filter(
                    company_key_id=company_key
                ).values('project_key', 'project_name')
            
            # Calculate profitability for each dimension
            results = []
            for dim in dimensions:
                dim_key = dim['cost_center_key'] if dimension == 'cost_center' else dim['project_key']
                dim_name = dim['name'] if dimension == 'cost_center' else dim['project_name']
                
                # Revenue for this dimension
                revenue = gl_lines.filter(
                    **{dimension_field: dim_key},
                    account_key_id__in=revenue_accounts
                ).aggregate(
                    total=Sum(F('credit') - F('debit'))
                )['total'] or Decimal('0')
                
                # Expenses for this dimension
                expenses = gl_lines.filter(
                    **{dimension_field: dim_key},
                    account_key_id__in=expense_accounts
                ).aggregate(
                    total=Sum(F('debit') - F('credit'))
                )['total'] or Decimal('0')
                
                profit = revenue - expenses
                margin = (profit / revenue * 100) if revenue else Decimal('0')
                
                results.append({
                    'dimension_key': dim_key,
                    'dimension_name': dim_name,
                    'revenue': float(revenue),
                    'expenses': float(expenses),
                    'profit': float(profit),
                    'margin_pct': float(margin)
                })
            
            # Sort by profit descending
            results.sort(key=lambda x: x['profit'], reverse=True)
            
            # Calculate totals
            total_revenue = sum(r['revenue'] for r in results)
            total_expenses = sum(r['expenses'] for r in results)
            total_profit = sum(r['profit'] for r in results)
            
            response_data = {
                'report_type': f'Profitability by {dimension.replace("_", " ").title()}',
                'company_key': company_key,
                'period': {
                    'start_date': start_date,
                    'end_date': end_date
                },
                'dimension': dimension,
                'results': results,
                'totals': {
                    'revenue': total_revenue,
                    'expenses': total_expenses,
                    'profit': total_profit,
                    'margin_pct': (total_profit / total_revenue * 100) if total_revenue else 0
                }
            }
            
            return Response(response_data)
            
        except Exception as e:
            import traceback
            return Response({
                'error': str(e),
                'traceback': traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TrialBalanceReportView(APIView):
    """
    Trial Balance Report - Enhanced version
    
    GET /api/reports/trial-balance/
    Parameters:
    - company_key: required
    - as_of_date: required
    - cost_center: optional
    - project: optional
    """
    
    def get(self, request):
        try:
            company_key = request.query_params.get('company_key')
            as_of_date = request.query_params.get('as_of_date')
            cost_center = request.query_params.get('cost_center')
            project = request.query_params.get('project')
            
            if not all([company_key, as_of_date]):
                return Response({
                    'error': 'company_key and as_of_date are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get models
            GlLine = model_by_table('gl_line')
            
            # Build query
            gl_lines = GlLine.objects.filter(
                gl__company_key_id=company_key,
                gl__journal_date__lte=as_of_date,
                gl__status='POSTED'
            ).select_related('account_key')
            
            # Apply filters
            if cost_center:
                gl_lines = gl_lines.filter(cost_center_key_id=cost_center)
            if project:
                gl_lines = gl_lines.filter(project_key_id=project)
            
            # Group by account and calculate totals
            account_balances = gl_lines.values(
                'account_key__account_code',
                'account_key__account_name',
                'account_key__account_type'
            ).annotate(
                total_debit=Sum('debit'),
                total_credit=Sum('credit'),
                balance=Sum(F('debit') - F('credit'))
            ).order_by('account_key__account_code')
            
            # Format results
            accounts = []
            total_debit = Decimal('0')
            total_credit = Decimal('0')
            
            for acc in account_balances:
                debit = acc['total_debit'] or Decimal('0')
                credit = acc['total_credit'] or Decimal('0')
                balance = acc['balance'] or Decimal('0')
                
                total_debit += debit
                total_credit += credit
                
                accounts.append({
                    'account_code': acc['account_key__account_code'],
                    'account_name': acc['account_key__account_name'],
                    'account_type': acc['account_key__account_type'],
                    'debit': float(debit),
                    'credit': float(credit),
                    'balance': float(balance)
                })
            
            # Check if balanced
            difference = abs(total_debit - total_credit)
            is_balanced = difference < Decimal('0.01')
            
            response_data = {
                'report_type': 'Trial Balance',
                'company_key': company_key,
                'as_of_date': as_of_date,
                'accounts': accounts,
                'totals': {
                    'debit': float(total_debit),
                    'credit': float(total_credit),
                    'difference': float(difference)
                },
                'balanced': is_balanced,
                'filters': {
                    'cost_center': cost_center,
                    'project': project
                }
            }
            
            return Response(response_data)
            
        except Exception as e:
            import traceback
            return Response({
                'error': str(e),
                'traceback': traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GeneralLedgerReportView(APIView):
    """
    General Ledger Detail Report
    
    GET /api/reports/general-ledger/
    Parameters:
    - company_key: required
    - start_date: required
    - end_date: required
    - account_code: optional (specific account)
    - cost_center: optional
    - project: optional
    """
    
    def get(self, request):
        try:
            company_key = request.query_params.get('company_key')
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            account_code = request.query_params.get('account_code')
            cost_center = request.query_params.get('cost_center')
            project = request.query_params.get('project')
            
            if not all([company_key, start_date, end_date]):
                return Response({
                    'error': 'company_key, start_date, and end_date are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get models
            GlLine = model_by_table('gl_line')
            
            # Build query
            gl_lines = GlLine.objects.filter(
                gl__company_key_id=company_key,
                gl__journal_date__gte=start_date,
                gl__journal_date__lte=end_date,
                gl__status='POSTED'
            ).select_related('account_key', 'gl')
            
            # Apply filters
            if account_code:
                gl_lines = gl_lines.filter(account_key__account_code=account_code)
            if cost_center:
                gl_lines = gl_lines.filter(cost_center_key_id=cost_center)
            if project:
                gl_lines = gl_lines.filter(project_key_id=project)
            
            # Order by date and journal
            gl_lines = gl_lines.order_by('gl__journal_date', 'gl__journal_number', 'line_no')
            
            # Format transactions
            transactions = []
            running_balance = Decimal('0')
            
            for line in gl_lines:
                debit = line.debit or Decimal('0')
                credit = line.credit or Decimal('0')
                running_balance += debit - credit
                
                transactions.append({
                    'date': str(line.gl.journal_date),
                    'journal_number': line.gl.journal_number,
                    'account_code': line.account_key.account_code,
                    'account_name': line.account_key.account_name,
                    'description': line.description or line.gl.description,
                    'debit': float(debit),
                    'credit': float(credit),
                    'balance': float(running_balance),
                    'cost_center': line.cost_center_key_id,
                    'project': line.project_key_id
                })
            
            response_data = {
                'report_type': 'General Ledger',
                'company_key': company_key,
                'period': {
                    'start_date': start_date,
                    'end_date': end_date
                },
                'filters': {
                    'account_code': account_code,
                    'cost_center': cost_center,
                    'project': project
                },
                'transactions': transactions,
                'transaction_count': len(transactions),
                'ending_balance': float(running_balance)
            }
            
            return Response(response_data)
            
        except Exception as e:
            import traceback
            return Response({
                'error': str(e),
                'traceback': traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)