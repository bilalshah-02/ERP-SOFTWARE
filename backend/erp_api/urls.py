# backend/erp_api/urls.py - COMPLETE WITH INVENTORY ENHANCEMENTS
from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import (
    CompanyViewSet, ProductCostingViewSet,
    
    # Master Data ViewSets
    VendorViewSet, ItemViewSet, CustomerViewSet, BankViewSet,
    
    # ✅ ItemWithRecipeView
    ItemWithRecipeView,
    
    # Lookups
    AccountsLookupView, CostCentersLookupView, ProjectsLookupView,
    
    # Journal Entry
    JournalEntryView, JournalEntryDetailView,
    
    # Financial Reports
    TrialBalanceView, ProfitLossView, BalanceSheetView, CashFlowView, AgingReportView,
)
from .costing import ProjectProfitabilityView, BatchCostSummaryView, ProcessCostSummaryView

# Import purchase views
from .purchase_views import (
    PurchaseOrderViewSet,
    GoodsReceiptView,
    VendorInvoiceViewSet,
    VendorPaymentViewSet,
    PurchaseDashboardView,
)

# Import production views
from .production_views import (
    BomViewSet,
    ProductionBatchViewSet,
    MaterialAvailabilityView,
    MaterialAvailabilityByProductView,
    MaterialIssueView,
    ProductionCompletionView,
    ProductionDashboardView,
    # ⭐ PHASE 8: Labor & Overhead
    LaborEntryView,
    OverheadAllocationView,
    BatchCostSummaryView,
    LaborReportView,
    OverheadReportView,
)

# Import fiscal period views
from .fiscal_period_views import FiscalPeriodViewSet, FiscalPeriodActionsView

# Import sales views
from .sales_views import (
    SalesOrderViewSet,
    DeliveryNoteView,
    CustomerInvoiceViewSet,
    CustomerReceiptViewSet,
    SalesDashboardView,
)

# Import inventory views
from .inventory_views import (
    StockAdjustmentView,
    StockTransferView,
    StockMovementsView,
    StockBalanceView,
    StockLedgerView,
    InventoryDashboardView,
    WarehouseListView,
    ItemRecipeView,  # ✅ NEW
)

# ⭐ NEW: Import inventory levels & ledger views
from .inventory_levels_views import (
    InventoryLevelsConfigView,
    InventoryLevelsListView,
    ReorderAlertsView,
)
from .store_ledger_views import (
    StoreLedgerCardView,
    StoreLedgerSummaryView,
)

# Import CRM views
from .crm_views import (
    LeadViewSet,
    ActivityViewSet,
    CrmDashboardView,
    LeadPipelineView,
)

# Import GL dashboard
from .gl_dashboard_view import GlDashboardView

router = DefaultRouter()

# Register viewsets
router.register(r"companies", CompanyViewSet, basename="companies")
router.register(r"product-costing", ProductCostingViewSet, basename="product-costing")
router.register(r"vendors", VendorViewSet, basename="vendors")
router.register(r"items", ItemViewSet, basename="items")
router.register(r"customers", CustomerViewSet, basename="customers")
router.register(r"banks", BankViewSet, basename="banks")

# Purchase Order ViewSet routes
purchase_order_list = PurchaseOrderViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
purchase_order_detail = PurchaseOrderViewSet.as_view({
    'get': 'retrieve'
})
purchase_order_approve = PurchaseOrderViewSet.as_view({
    'post': 'approve'
})

# Vendor Invoice ViewSet routes
vendor_invoice_list = VendorInvoiceViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
vendor_invoice_detail = VendorInvoiceViewSet.as_view({
    'get': 'retrieve'
})

# Vendor Payment ViewSet routes
vendor_payment_list = VendorPaymentViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
vendor_payment_detail = VendorPaymentViewSet.as_view({
    'get': 'retrieve'
})

# BOM ViewSet routes
bom_list = BomViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
bom_detail = BomViewSet.as_view({
    'get': 'retrieve'
})
bom_deactivate = BomViewSet.as_view({
    'post': 'deactivate'
})
bom_activate = BomViewSet.as_view({
    'post': 'activate'
})

# Production Batch ViewSet routes
production_batch_list = ProductionBatchViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
production_batch_detail = ProductionBatchViewSet.as_view({
    'get': 'retrieve'
})

# ✅ NEW: Production Batch from Product (recipe-based)
production_batch_from_product = ProductionBatchViewSet.as_view({
    'post': 'from_product'
})

# Sales Order ViewSet routes
sales_order_list = SalesOrderViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
sales_order_detail = SalesOrderViewSet.as_view({
    'get': 'retrieve'
})
sales_order_confirm = SalesOrderViewSet.as_view({
    'post': 'confirm'
})
sales_order_cancel = SalesOrderViewSet.as_view({
    'post': 'cancel'
})

# Customer Invoice ViewSet routes
customer_invoice_list = CustomerInvoiceViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
customer_invoice_detail = CustomerInvoiceViewSet.as_view({
    'get': 'retrieve'
})

# Customer Receipt ViewSet routes
customer_receipt_list = CustomerReceiptViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
customer_receipt_detail = CustomerReceiptViewSet.as_view({
    'get': 'retrieve'
})

# CRM Lead ViewSet routes
lead_list = LeadViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
lead_detail = LeadViewSet.as_view({
    'get': 'retrieve',
    'patch': 'partial_update'
})
lead_convert = LeadViewSet.as_view({
    'post': 'convert'
})
lead_activities = LeadViewSet.as_view({
    'get': 'activities'
})

# CRM Activity ViewSet routes
activity_list = ActivityViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
activity_detail = ActivityViewSet.as_view({
    'get': 'retrieve'
})
activity_complete = ActivityViewSet.as_view({
    'post': 'complete'
})

# ✅ CRITICAL: Custom routes BEFORE router.urls
urlpatterns = [
    # ✅ Recipe endpoints (MUST come BEFORE router.urls!)
    path("items/with-recipe/", ItemWithRecipeView.as_view(), name="item-with-recipe"),
    path("items/recipe/", ItemRecipeView.as_view(), name="item-recipe-create"),
    path("items/<int:product_item_key>/recipe/", ItemRecipeView.as_view(), name="item-recipe-detail"),
    
    # Costing Dashboards
    path("costing/projects/", ProjectProfitabilityView.as_view(), name="costing-projects"),
    path("costing/batches/", BatchCostSummaryView.as_view(), name="costing-batches"),
    path("costing/process/", ProcessCostSummaryView.as_view(), name="costing-process"),

    # Lookups
    path("lookups/accounts/", AccountsLookupView.as_view(), name="lookup-accounts"),
    path("lookups/cost-centers/", CostCentersLookupView.as_view(), name="lookup-cost-centers"),
    path("lookups/projects/", ProjectsLookupView.as_view(), name="lookup-projects"),

    # Journal Entry
    path("journal-entries/", JournalEntryView.as_view(), name="journal-entries"),
    path("journal-entries/<int:gl_id>/", JournalEntryDetailView.as_view(), name="journal-entry-detail"),
    
    # GL Dashboard
    path("gl/dashboard/", GlDashboardView.as_view(), name="gl-dashboard"),
    
    # Financial Reports
    path("reports/trial-balance/", TrialBalanceView.as_view(), name="trial-balance"),
    path("reports/profit-loss/", ProfitLossView.as_view(), name="profit-loss"),
    path("reports/balance-sheet/", BalanceSheetView.as_view(), name="balance-sheet"),
    path("reports/cash-flow/", CashFlowView.as_view(), name="cash-flow"),
    path("reports/aging/", AgingReportView.as_view(), name="aging-report"),
    
    # ==================== PURCHASE MODULE ====================
    
    # Purchase Dashboard
    path("purchase/dashboard/", PurchaseDashboardView.as_view(), name="purchase-dashboard"),
    
    # Purchase Orders
    path("purchase/orders/", purchase_order_list, name="purchase-orders"),
    path("purchase/orders/<int:pk>/", purchase_order_detail, name="purchase-order-detail"),
    path("purchase/orders/<int:pk>/approve/", purchase_order_approve, name="purchase-order-approve"),
    
    # Goods Receipts
    path("purchase/receipts/", GoodsReceiptView.as_view(), name="goods-receipt"),
    
    # Vendor Invoices
    path("purchase/invoices/", vendor_invoice_list, name="vendor-invoices"),
    path("purchase/invoices/<int:pk>/", vendor_invoice_detail, name="vendor-invoice-detail"),
    
    # Vendor Payments
    path("purchase/payments/", vendor_payment_list, name="vendor-payments"),
    path("purchase/payments/<int:pk>/", vendor_payment_detail, name="vendor-payment-detail"),
    
    # ==================== PRODUCTION MODULE ====================
    
    # Production Dashboard
    path("production/dashboard/", ProductionDashboardView.as_view(), name="production-dashboard"),
    
    # Bill of Materials (BOM)
    path("production/boms/", bom_list, name="bom-list"),
    path("production/boms/<int:pk>/", bom_detail, name="bom-detail"),
    path("production/boms/<int:pk>/deactivate/", bom_deactivate, name="bom-deactivate"),
    path("production/boms/<int:pk>/activate/", bom_activate, name="bom-activate"),
    
    # Production Batches
    path("production/batches/", production_batch_list, name="production-batches"),
    path("production/batches/from-product/", production_batch_from_product, name="production-batch-from-product"),
    path("production/batches/<int:pk>/", production_batch_detail, name="production-batch-detail"),
    
    # Material Operations
    path("production/material-availability/", MaterialAvailabilityView.as_view(), name="material-availability"),
    # ✅ NEW: Material check by product
    path("production/check-materials-by-product/", MaterialAvailabilityByProductView.as_view(), name="check-materials-by-product"),
    path("production/material-issue/", MaterialIssueView.as_view(), name="material-issue"),
    path("production/completion/", ProductionCompletionView.as_view(), name="production-completion"),

    # ⭐ PHASE 8: Labor & Overhead Tracking
    path("production/labor/", LaborEntryView.as_view(), name="labor-entry"),
    path("production/overhead/", OverheadAllocationView.as_view(), name="overhead-allocation"),
    
    # ⭐ PHASE 8: Cost Reports
    path("production/batches/<int:batch_id>/cost-summary/", BatchCostSummaryView.as_view(), name="batch-cost-summary"),
    path("production/labor-report/", LaborReportView.as_view(), name="labor-report"),
    path("production/overhead-report/", OverheadReportView.as_view(), name="overhead-report"),

    # ==================== FISCAL PERIODS ====================
    path("periods/", FiscalPeriodViewSet.as_view({'get': 'list', 'post': 'create'})),
    path("periods/<int:pk>/", FiscalPeriodViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})),
    path("periods/<int:pk>/<str:action>/", FiscalPeriodActionsView.as_view()),
    
    # ==================== SALES MODULE ====================
    
    # Sales Dashboard
    path("sales/dashboard/", SalesDashboardView.as_view(), name="sales-dashboard"),
    
    # Sales Orders
    path("sales/orders/", sales_order_list, name="sales-orders"),
    path("sales/orders/<int:pk>/", sales_order_detail, name="sales-order-detail"),
    path("sales/orders/<int:pk>/confirm/", sales_order_confirm, name="sales-order-confirm"),
    path("sales/orders/<int:pk>/cancel/", sales_order_cancel, name="sales-order-cancel"),
    
    # Delivery Notes
    path("sales/deliveries/", DeliveryNoteView.as_view(), name="delivery-note"),
    
    # Customer Invoices
    path("sales/invoices/", customer_invoice_list, name="customer-invoices"),
    path("sales/invoices/<uuid:pk>/", customer_invoice_detail, name="customer-invoice-detail"),
    
    # Customer Receipts
    path("sales/receipts/", customer_receipt_list, name="customer-receipts"),
    path("sales/receipts/<int:pk>/", customer_receipt_detail, name="customer-receipt-detail"),
    
    # ==================== INVENTORY MODULE ====================
    
    # Inventory Dashboard
    path("inventory/dashboard/", InventoryDashboardView.as_view(), name="inventory-dashboard"),
    
    # Stock Movements
    path("inventory/movements/", StockMovementsView.as_view(), name="stock-movements"),
    
    # Stock Adjustments
    path("inventory/adjustments/", StockAdjustmentView.as_view(), name="stock-adjustment"),
    
    # Stock Transfers
    path("inventory/transfers/", StockTransferView.as_view(), name="stock-transfer"),
    
    # Stock Balance Report
    path("inventory/balance/", StockBalanceView.as_view(), name="stock-balance"),
    
    # Stock Ledger Report
    path("inventory/ledger/", StockLedgerView.as_view(), name="stock-ledger"),

    # Warehouses
    path("warehouses/", WarehouseListView.as_view(), name="warehouses-list"),
    
    # ⭐⭐⭐ NEW: INVENTORY LEVELS & REORDER MANAGEMENT ⭐⭐⭐
    
    # Configure inventory levels for an item
    path("inventory/levels/", InventoryLevelsConfigView.as_view(), name="inventory-levels-config"),
    
    # List all items with inventory levels and stock status
    path("inventory/levels/list/", InventoryLevelsListView.as_view(), name="inventory-levels-list"),
    
    # Get reorder alerts (items below reorder level)
    path("inventory/reorder-alerts/", ReorderAlertsView.as_view(), name="reorder-alerts"),
    
    # ⭐⭐⭐ NEW: STORE LEDGER CARD ⭐⭐⭐
    
    # Get detailed ledger card for an item (transaction history with running balance)
    path("inventory/ledger-card/", StoreLedgerCardView.as_view(), name="store-ledger-card"),
    
    # Get summary of all items with last movement
    path("inventory/ledger-summary/", StoreLedgerSummaryView.as_view(), name="store-ledger-summary"),
    
    # ==================== CRM MODULE ====================
    
    # CRM Dashboard
    path("crm/dashboard/", CrmDashboardView.as_view(), name="crm-dashboard"),
    
    # Lead Pipeline
    path("crm/pipeline/", LeadPipelineView.as_view(), name="lead-pipeline"),
    
    # Leads
    path("crm/leads/", lead_list, name="leads"),
    path("crm/leads/<int:pk>/", lead_detail, name="lead-detail"),
    path("crm/leads/<int:pk>/convert/", lead_convert, name="lead-convert"),
    path("crm/leads/<int:pk>/activities/", lead_activities, name="lead-activities"),
    
    # Activities
    path("crm/activities/", activity_list, name="activities"),
    path("crm/activities/<int:pk>/", activity_detail, name="activity-detail"),
    path("crm/activities/<int:pk>/complete/", activity_complete, name="activity-complete"),
    
# ✅ CRITICAL: Router URLs come AFTER custom routes
] + router.urls