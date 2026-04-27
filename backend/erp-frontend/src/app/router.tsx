// src/app/router.tsx - FIXED AND REORGANIZED
import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import Dashboard from "../pages/Dashboard";
import Settings from "../Settings";
import Profile from "../Profile";

// Inventory Module
import InventoryLevelsConfig from "../pages/inventory/InventoryLevelsConfig";
import Items from "../pages/inventory/Items";
import ItemCreate from "../pages/inventory/ItemCreate";
import ItemRecipeCreate from "../pages/inventory/ItemRecipeCreate";
import ItemRecipeView from "../pages/inventory/ItemRecipeView";
import InventoryDashboard from "../pages/inventory/InventoryDashboard";
import StockAdjustmentCreate from "../pages/inventory/StockAdjustmentCreate";
import StockBalanceReport from "../pages/inventory/StockBalanceReport";
import StockMovements from "../pages/inventory/StockMovements";
import StockTransferCreate from "../pages/inventory/StockTransferCreate";

// Costing
import ProductCosting from "../pages/costing/ProductCosting";
import ProjectCosting from "../pages/costing/ProjectCosting";
import BatchCosting from "../pages/costing/BatchCosting";
import ProcessCosting from "../pages/costing/ProcessCosting";

// CRM
import Customers from "../pages/crm/Customers";
import CrmDashboard from "../pages/crm/CrmDashboard";
import LeadList from "../pages/crm/LeadList";
import LeadCreate from "../pages/crm/LeadCreate";
import LeadDetail from "../pages/crm/LeadDetail";
import ActivityList from "../pages/crm/ActivityList";
import ActivityCreate from "../pages/crm/ActivityCreate";
import LeadPipeline from "../pages/crm/LeadPipeline";
import LeadConvert from "../pages/crm/LeadConvert";

// Financial/GL Module
import Banks from "../pages/financial/Banks";
import JournalEntry from "../pages/financial/JournalEntry";
import GlDashboard from "../pages/financial/GlDashboard";
import JournalEntryList from "../pages/financial/JournalEntryList";
import ChartOfAccountsList from "../pages/financial/ChartOfAccountsList";
import FiscalPeriodList from "../pages/financial/FiscalPeriodList";
import TrialBalance from "../pages/financial/reports/TrialBalance";
import ProfitLoss from "../pages/financial/reports/ProfitLoss";
import BalanceSheet from "../pages/financial/reports/BalanceSheet";
import CashFlow from "../pages/financial/reports/CashFlow";
import AgingReport from "../pages/financial/reports/AgingReport";

// Purchase Module
import PurchaseDashboard from "../pages/purchase/PurchaseDashboard";
import PurchaseOrderList from "../pages/purchase/PurchaseOrderList";
import PurchaseOrderCreate from "../pages/purchase/PurchaseOrderCreate";
import GoodsReceipt from "../pages/purchase/GoodsReceipt";
import VendorInvoiceList from "../pages/purchase/VendorInvoiceList";
import VendorInvoiceCreate from "../pages/purchase/VendorInvoiceCreate";
import VendorPaymentList from "../pages/purchase/VendorPaymentList";
import VendorPaymentCreate from "../pages/purchase/VendorPaymentCreate";
import PurchaseOrderDetail from "../pages/purchase/PurchaseOrderDetail";
import VendorInvoiceDetail from "../pages/purchase/VendorInvoiceDetail";
import VendorPaymentDetail from "../pages/purchase/VendorPaymentDetail";



// Sales Module
import SalesDashboard from "../pages/sales/SalesDashboard";
import SalesOrderList from "../pages/sales/SalesOrderList";
import SalesOrderCreate from "../pages/sales/SalesOrderCreate";
import SalesOrderDetail from "../pages/sales/SalesOrderDetail";
import DeliveryNoteCreate from "../pages/sales/DeliveryNoteCreate";
import DeliveryNoteList from "../pages/sales/DeliveryNoteList";
import CustomerInvoiceList from "../pages/sales/CustomerInvoiceList";
import CustomerInvoiceCreate from "../pages/sales/CustomerInvoiceCreate";
import CustomerReceiptList from "../pages/sales/CustomerReceiptList";
import CustomerReceiptCreate from "../pages/sales/CustomerReceiptCreate";

// Supply Chain
import Vendors from "../pages/supply-chain/Vendors";

// Production Module
import ProductionDashboard from "../pages/production/ProductionDashboard";
import BOMList from "../pages/production/BOMList";
import BOMCreate from "../pages/production/BOMCreate";
import BOMDetail from "../pages/production/BOMDetail";
import BOMView from "../pages/production/BOMView";
import ProductionBatchList from "../pages/production/ProductionBatchList";
import ProductionBatchCreate from "../pages/production/ProductionBatchCreate";
import ProductionBatchDetail from "../pages/production/ProductionBatchDetail";
import MaterialIssue from "../pages/production/MaterialIssue";
import ProductionCompletion from "../pages/production/ProductionCompletion";

// ⭐ PHASE 8: Labor & Overhead
import LaborEntry from "../pages/production/LaborEntry";
import OverheadAllocation from "../pages/production/OverheadAllocation";
import BatchCostBreakdown from "../pages/production/BatchCostBreakdown";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      // ==================== MAIN ====================
      { index: true, element: <Dashboard /> },
      { path: "settings", element: <Settings /> },
      { path: "profile", element: <Profile /> },

      // ==================== INVENTORY MODULE ====================
      { path: "inventory/dashboard", element: <InventoryDashboard /> },
      
      // Items
      { path: "inventory/items", element: <Items /> },
      { path: "inventory/items/create", element: <ItemCreate /> },
      
      // Recipe Routes (must come BEFORE generic :id routes)
      { path: "inventory/items/:id/recipe", element: <ItemRecipeView /> },
      { path: "inventory/items/:id/recipe/create", element: <ItemRecipeCreate /> },
      { path: "inventory/items/:id/recipe/edit", element: <ItemRecipeCreate /> },

        // Inventory Levels & Reorder Management
      { path: "inventory/levels/config", element: <InventoryLevelsConfig /> },  // ← ADD THIS
      
      
      // Stock Operations
      { path: "inventory/adjustments/create", element: <StockAdjustmentCreate /> },
      { path: "inventory/balance", element: <StockBalanceReport /> },
      { path: "inventory/movements", element: <StockMovements /> },
      { path: "inventory/transfers/create", element: <StockTransferCreate /> },

      // ==================== COSTING MODULE ====================
      { path: "costing/product", element: <ProductCosting /> },
      { path: "costing/project", element: <ProjectCosting /> },
      { path: "costing/batch", element: <BatchCosting /> },
      { path: "costing/process", element: <ProcessCosting /> },

      // ==================== CRM MODULE ====================
      { path: "crm/dashboard", element: <CrmDashboard /> },
      { path: "crm/customers", element: <Customers /> },
      
      // Leads
      { path: "crm/leads", element: <LeadList /> },
      { path: "crm/leads/create", element: <LeadCreate /> },
      { path: "crm/leads/:id", element: <LeadDetail /> },
      { path: "crm/leads/:id/convert", element: <LeadConvert /> },
      
      // Activities
      { path: "crm/activities", element: <ActivityList /> },
      { path: "crm/activities/create", element: <ActivityCreate /> },
      
      // Pipeline
      { path: "crm/pipeline", element: <LeadPipeline /> },

      // ==================== FINANCIAL/GL MODULE ====================
      { path: "financial/gl/dashboard", element: <GlDashboard /> },
      
      // Journal Entries
      { path: "financial/journal-entry", element: <JournalEntry /> },
      { path: "financial/journal-list", element: <JournalEntryList /> },
      
      // Setup
      { path: "financial/chart-of-accounts", element: <ChartOfAccountsList /> },
      { path: "financial/periods", element: <FiscalPeriodList /> },
      { path: "financial/banking", element: <Banks /> },
      
      // Reports
      { path: "financial/reports/trial-balance", element: <TrialBalance /> },
      { path: "financial/reports/profit-loss", element: <ProfitLoss /> },
      { path: "financial/reports/balance-sheet", element: <BalanceSheet /> },
      { path: "financial/reports/cash-flow", element: <CashFlow /> },
      { path: "financial/reports/aging", element: <AgingReport /> },

      // ==================== PURCHASE MODULE ====================
      { path: "purchase/dashboard", element: <PurchaseDashboard /> },
      
      // in routes:
      { path: "purchase/invoices/:id", element: <VendorInvoiceDetail /> },
      // Purchase Orders
      { path: "purchase/orders", element: <PurchaseOrderList /> },
      { path: "purchase/orders/create", element: <PurchaseOrderCreate /> },
      { path: "purchase/orders/:id", element: <PurchaseOrderDetail /> },
      
      // Goods Receipt
      { path: "purchase/receipts", element: <GoodsReceipt /> },
      
      // Vendor Invoices
      { path: "purchase/invoices", element: <VendorInvoiceList /> },
      { path: "purchase/invoices/create", element: <VendorInvoiceCreate /> },
      
      // Vendor Payments
      { path: "purchase/payments", element: <VendorPaymentList /> },
      { path: "purchase/payments/create", element: <VendorPaymentCreate /> },
      { path: "purchase/payments/:id", element: <VendorPaymentDetail /> },


      // ==================== SALES MODULE ====================
      { path: "sales/dashboard", element: <SalesDashboard /> },
      
      // Sales Orders
      { path: "sales/orders", element: <SalesOrderList /> },
      { path: "sales/orders/create", element: <SalesOrderCreate /> },
      { path: "sales/orders/:id", element: <SalesOrderDetail /> },
      
      // Delivery Notes
      { path: "sales/deliveries", element: <DeliveryNoteList /> },
      { path: "sales/deliveries/create", element: <DeliveryNoteCreate /> },
      
      // Customer Invoices
      { path: "sales/invoices", element: <CustomerInvoiceList /> },
      { path: "sales/invoices/create", element: <CustomerInvoiceCreate /> },
      
      // Customer Receipts
      { path: "sales/receipts", element: <CustomerReceiptList /> },
      { path: "sales/receipts/create", element: <CustomerReceiptCreate /> },

      // ==================== SUPPLY CHAIN MODULE ====================
      { path: "supply-chain/vendors", element: <Vendors /> },

      // ==================== PRODUCTION MODULE ====================
      { path: "production/dashboard", element: <ProductionDashboard /> },
      
      // Bill of Materials (BOM)
      { path: "production/boms", element: <BOMList /> },
      { path: "production/boms/view", element: <BOMView /> },
      { path: "production/boms/create", element: <BOMCreate /> },
      { path: "production/boms/:id", element: <BOMDetail /> },
      
      // Production Batches
      { path: "production/batches", element: <ProductionBatchList /> },
      { path: "production/batches/create", element: <ProductionBatchCreate /> },
      { path: "production/batches/:id", element: <ProductionBatchDetail /> },
      
      // Production Operations
      { path: "production/material-issue", element: <MaterialIssue /> },
      { path: "production/completion", element: <ProductionCompletion /> },
      
      // ⭐ PHASE 8: Labor & Overhead
      { path: "production/batches/:id/labor", element: <LaborEntry /> },
      { path: "production/batches/:id/overhead", element: <OverheadAllocation /> },
      { path: "production/batches/:id/costs", element: <BatchCostBreakdown /> },
    ],
  },
]);