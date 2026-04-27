# backend/erp_api/purchase_urls.py
"""
Purchase Module URL Configuration
Add these to your main urls.py
"""

from django.urls import path
from .purchase_views import (
    PurchaseOrderViewSet,
    GoodsReceiptView,
    VendorInvoiceViewSet,
    VendorPaymentViewSet,
    PurchaseDashboardView,
)

# Purchase Order routes
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

# Vendor Invoice routes
vendor_invoice_list = VendorInvoiceViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

vendor_invoice_detail = VendorInvoiceViewSet.as_view({
    'get': 'retrieve'
})

# Vendor Payment routes
vendor_payment_list = VendorPaymentViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

vendor_payment_detail = VendorPaymentViewSet.as_view({
    'get': 'retrieve'
})

# URL patterns to add to main urls.py
purchase_urlpatterns = [
    # Dashboard
    path("purchase/dashboard/", PurchaseDashboardView.as_view(), name="purchase-dashboard"),
    
    # Purchase Orders
    path("purchase/orders/", purchase_order_list, name="purchase-orders"),
    path("purchase/orders/<int:pk>/", purchase_order_detail, name="purchase-order-detail"),
    path("purchase/orders/<int:pk>/approve/", purchase_order_approve, name="purchase-order-approve"),
    
    # Goods Receipts
    path("purchase/receipts/", GoodsReceiptView.as_view(), name="goods-receipt"),
    
    # Vendor Invoices
    path("purchase/invoices/", vendor_invoice_list, name="vendor-invoices"),
    path("purchase/invoices/<str:pk>/", vendor_invoice_detail, name="vendor-invoice-detail"),
    
    # Vendor Payments
    path("purchase/payments/", vendor_payment_list, name="vendor-payments"),
    path("purchase/payments/<int:pk>/", vendor_payment_detail, name="vendor-payment-detail"),
]