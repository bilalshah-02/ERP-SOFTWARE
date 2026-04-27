# backend/erp_api/gl_dashboard_view.py
"""
GL Module Dashboard View
Shows comprehensive General Ledger overview with:
- Journal entry statistics
- Account activity summary  
- Period status
- Recent postings
- Chart of Accounts summary
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count, Q, F
from decimal import Decimal
from . import models


def model_by_table(table: str):
    """Helper to get model by table name"""
    for name in dir(models):
        cls = getattr(models, name)
        if hasattr(cls, "_meta") and getattr(cls._meta, "db_table", None) == table:
            return cls
    raise LookupError(f"Model for table '{table}' not found in erp_api.models")


# Get models
GlJournal = model_by_table("gl_journal")
GlLine = model_by_table("gl_line")
ChartOfAccounts = model_by_table("chart_of_accounts")
FiscalPeriod = model_by_table("fiscal_period")
DimCompany = model_by_table("dim_company")


class GlDashboardView(APIView):
    """
    GET /api/gl/dashboard/
    
    Returns GL module overview:
    - Journal entry statistics (total, by status, by period)
    - Account activity (accounts with balances, recent activity)
    - Period status (open/closed periods)
    - Recent journal entries
    - Chart of Accounts summary
    """
    
    def get(self, request):
        company_key = request.query_params.get('company_key')
        period_key = request.query_params.get('period_key')
        
        # Filter by company if provided
        journal_filter = Q()
        account_filter = Q()
        period_filter = Q()
        
        if company_key:
            journal_filter &= Q(company_key=company_key)
            account_filter &= Q(company_key=company_key)
            period_filter &= Q(company_key=company_key)
        
        # ==================== JOURNAL ENTRY STATISTICS ====================
        
        # Total journals
        total_journals = GlJournal.objects.filter(journal_filter).count()
        
        # Journals by status
        journals_by_status = GlJournal.objects.filter(journal_filter).values('status').annotate(
            count=Count('gl_id')
        )
        status_counts = {item['status']: item['count'] for item in journals_by_status if item['status']}
        
        # Journals by period (if period specified)
        period_stats = None
        if period_key:
            period = FiscalPeriod.objects.filter(period_key=period_key).first()
            if period:
                period_journals = GlJournal.objects.filter(
                    journal_filter,
                    period_key=period
                ).aggregate(
                    total=Count('gl_id'),
                    total_debit=Sum('glline__debit'),
                    total_credit=Sum('glline__credit')
                )
                
                period_stats = {
                    'period_code': period.period_code,
                    'start_date': period.start_date,
                    'end_date': period.end_date,
                    'is_closed': period.is_closed if hasattr(period, 'is_closed') else None,
                    'journal_count': period_journals['total'] or 0,
                    'total_debit': float(period_journals['total_debit'] or 0),
                    'total_credit': float(period_journals['total_credit'] or 0),
                }
        
        # Recent journals (last 10)
        recent_journals = GlJournal.objects.filter(journal_filter).order_by('-created_at')[:10]
        recent_journal_list = []
        
        for journal in recent_journals:
            # Calculate totals for this journal
            lines = GlLine.objects.filter(gl=journal).aggregate(
                total_debit=Sum('debit'),
                total_credit=Sum('credit'),
                line_count=Count('gl_line_id')
            )
            
            recent_journal_list.append({
                'gl_id': journal.gl_id,
                'journal_number': journal.journal_number,
                'journal_date': journal.journal_date,
                'description': journal.description,
                'status': journal.status,
                'total_debit': float(lines['total_debit'] or 0),
                'total_credit': float(lines['total_credit'] or 0),
                'line_count': lines['line_count'],
                'created_at': journal.created_at,
            })
        
        # ==================== CHART OF ACCOUNTS SUMMARY ====================
        
        # Total accounts
        total_accounts = ChartOfAccounts.objects.filter(account_filter).count()
        
        # Accounts by type
        accounts_by_type = ChartOfAccounts.objects.filter(account_filter).values('account_type').annotate(
            count=Count('account_key')
        )
        type_counts = {item['account_type']: item['count'] for item in accounts_by_type if item['account_type']}
        
        # Active vs Inactive
        active_accounts = ChartOfAccounts.objects.filter(account_filter, is_active=True).count()
        inactive_accounts = total_accounts - active_accounts
        
        # Posting vs Non-posting
        posting_accounts = ChartOfAccounts.objects.filter(account_filter, is_posting=True).count()
        non_posting_accounts = total_accounts - posting_accounts
        
        # ==================== ACCOUNT ACTIVITY ====================
        
        # Accounts with recent activity (last 30 days)
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.now().date() - timedelta(days=30)
        
        # Build filter for GL lines based on journal filter
        line_filter = Q(gl__journal_date__gte=thirty_days_ago)
        if company_key:
            line_filter &= Q(gl__company_key=company_key)
        
        active_account_ids = GlLine.objects.filter(
            line_filter
        ).values_list('account_key', flat=True).distinct()
        
        accounts_with_activity = len(set(active_account_ids))
        
        # Top 5 most active accounts
        top_active_accounts = GlLine.objects.filter(
            line_filter
        ).values(
            'account_key',
            'account_key__account_code',
            'account_key__account_name'
        ).annotate(
            transaction_count=Count('gl_line_id'),
            total_debit=Sum('debit'),
            total_credit=Sum('credit')
        ).order_by('-transaction_count')[:5]
        
        top_accounts_list = [
            {
                'account_key': item['account_key'],
                'account_code': item['account_key__account_code'],
                'account_name': item['account_key__account_name'],
                'transaction_count': item['transaction_count'],
                'total_debit': float(item['total_debit'] or 0),
                'total_credit': float(item['total_credit'] or 0),
                'net_movement': float((item['total_debit'] or 0) - (item['total_credit'] or 0))
            }
            for item in top_active_accounts
        ]
        
        # ==================== PERIOD SUMMARY ====================
        
        # Get all periods for company
        periods = FiscalPeriod.objects.filter(period_filter).order_by('-start_date')[:12]
        period_summary = []
        
        for period in periods:
            journals_in_period = GlJournal.objects.filter(
                journal_filter,
                period_key=period
            ).count()
            
            period_summary.append({
                'period_key': period.period_key,
                'period_code': period.period_code,
                'start_date': period.start_date,
                'end_date': period.end_date,
                'is_closed': period.is_closed if hasattr(period, 'is_closed') else None,
                'journal_count': journals_in_period
            })
        
        # Count open vs closed periods
        if hasattr(FiscalPeriod, 'is_closed'):
            open_periods = FiscalPeriod.objects.filter(period_filter, is_closed=False).count()
            closed_periods = FiscalPeriod.objects.filter(period_filter, is_closed=True).count()
        else:
            open_periods = None
            closed_periods = None
        
        # ==================== OVERALL GL ACTIVITY ====================
        
        # Total debits and credits (all time)
        # Build filter for GL lines
        overall_line_filter = Q()
        if company_key:
            overall_line_filter &= Q(gl__company_key=company_key)
        
        overall_totals = GlLine.objects.filter(overall_line_filter).aggregate(
            total_debit=Sum('debit'),
            total_credit=Sum('credit'),
            total_lines=Count('gl_line_id')
        )
        
        # Calculate balance (should be 0 if books are balanced)
        total_debit = overall_totals['total_debit'] or 0
        total_credit = overall_totals['total_credit'] or 0
        out_of_balance = abs(float(total_debit - total_credit))
        
        # ==================== BUILD RESPONSE ====================
        
        return Response({
            'journal_statistics': {
                'total_journals': total_journals,
                'by_status': status_counts,
                'current_period': period_stats,
                'total_debit': float(total_debit),
                'total_credit': float(total_credit),
                'out_of_balance': out_of_balance,
                'total_lines': overall_totals['total_lines'] or 0,
            },
            'chart_of_accounts': {
                'total_accounts': total_accounts,
                'by_type': type_counts,
                'active': active_accounts,
                'inactive': inactive_accounts,
                'posting': posting_accounts,
                'non_posting': non_posting_accounts,
            },
            'account_activity': {
                'accounts_with_recent_activity': accounts_with_activity,
                'total_accounts': total_accounts,
                'activity_rate': round(accounts_with_activity / total_accounts * 100, 2) if total_accounts > 0 else 0,
                'top_active_accounts': top_accounts_list,
            },
            'period_summary': {
                'total_periods': len(period_summary),
                'open_periods': open_periods,
                'closed_periods': closed_periods,
                'recent_periods': period_summary,
            },
            'recent_journals': recent_journal_list,
        })