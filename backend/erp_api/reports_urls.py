# backend/erp_api/reports_urls_PHASE7_COMPLETE.py
"""
Reports Module URL Configuration - PHASE 7 COMPLETE
Enhanced with Project and Cost Center Reporting

Add these to your main urls.py:
    path('api/', include('erp_api.reports_urls')),
"""

from django.urls import path
from .reports_views_PHASE7_COMPLETE import (
    ProfitLossReportView,
    BalanceSheetReportView,
    ProfitabilityAnalysisView,
    TrialBalanceReportView,
    GeneralLedgerReportView,
)

urlpatterns = [
    # Financial Reports - Enhanced with Multi-Dimensional Support
    path('reports/profit-loss/', ProfitLossReportView.as_view(), name='profit-loss-report'),
    path('reports/balance-sheet/', BalanceSheetReportView.as_view(), name='balance-sheet-report'),
    path('reports/trial-balance/', TrialBalanceReportView.as_view(), name='trial-balance-report'),
    path('reports/general-ledger/', GeneralLedgerReportView.as_view(), name='general-ledger-report'),
    
    # NEW: Profitability Analysis
    path('reports/profitability/', ProfitabilityAnalysisView.as_view(), name='profitability-analysis'),
]

"""
USAGE EXAMPLES:

1. Standard P&L:
   GET /api/reports/profit-loss/?company_key=1&start_date=2025-01-01&end_date=2025-12-31

2. P&L by Cost Center:
   GET /api/reports/profit-loss/?company_key=1&start_date=2025-01-01&end_date=2025-12-31&cost_center=5

3. P&L by Project:
   GET /api/reports/profit-loss/?company_key=1&start_date=2025-01-01&end_date=2025-12-31&project=10

4. Detailed P&L:
   GET /api/reports/profit-loss/?company_key=1&start_date=2025-01-01&end_date=2025-12-31&format=detailed

5. Balance Sheet by Cost Center:
   GET /api/reports/balance-sheet/?company_key=1&as_of_date=2025-12-31&cost_center=5

6. Profitability by Cost Center:
   GET /api/reports/profitability/?company_key=1&start_date=2025-01-01&end_date=2025-12-31&dimension=cost_center

7. Profitability by Project:
   GET /api/reports/profitability/?company_key=1&start_date=2025-01-01&end_date=2025-12-31&dimension=project

8. Trial Balance with filters:
   GET /api/reports/trial-balance/?company_key=1&as_of_date=2025-12-31&cost_center=5

9. General Ledger for specific account:
   GET /api/reports/general-ledger/?company_key=1&start_date=2025-01-01&end_date=2025-12-31&account_code=1500
"""