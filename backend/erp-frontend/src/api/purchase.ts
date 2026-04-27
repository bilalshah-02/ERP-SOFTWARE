// src/api/purchase.ts - COMPLETE WORKING VERSION
import { http } from "./http";

// ==================== TYPES ====================

export interface PurchaseOrderLine {
  item_key: number;
  quantity: number;
  unit_price: number;
  description?: string;
  discount_amount?: number;
}

export interface PurchaseOrder {
  po_id?: number;
  po_number?: string;
  order_date: string;
  supplier_key: number;
  supplier_name?: string;
  expected_date?: string;
  status?: string;
  remarks?: string;
  lines?: any[];
  total_amount?: number;
  created_at?: string;
}

export interface GoodsReceiptLine {
  po_line_id: number;
  quantity_received: number;
}

export interface GoodsReceipt {
  po_id: number;
  receipt_date: string;
  warehouse_key: number;
  notes?: string;
  inventory_account_key: number;
  lines: GoodsReceiptLine[];
}

export interface VendorInvoiceLine {
  item_key?: number;
  description?: string;
  quantity?: number;
  unit_price?: number;
  line_amount: number;
}

export interface VendorInvoice {
  invoice_id?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  supplier_key: number;
  supplier_name?: string;
  inventory_account_key?: number;
  ap_account_key: number;
  expense_account_key?: number;
  total_amount?: number;
  status?: string;
  lines: VendorInvoiceLine[];
}

export interface VendorPayment {
  payment_id?: number;
  payment_date: string;
  supplier_key: number;
  supplier_name?: string;
  amount: number;
  payment_method?: string;
  reference_no?: string;
  remarks?: string;
  ap_account_key: number;
  cash_account_key?: number;
  bank_account_key?: number;
  invoice_id?: string;
}

export interface PurchaseDashboard {
  purchase_orders?: {
    total: number;
    draft?: number;
    confirmed?: number;
    received?: number;
    cancelled?: number;
  };
  invoices?: {
    total: number;
    draft?: number;
    posted?: number;
  };
  payments?: {
    total: number;
    total_amount: number;
  };
  totals?: {
    confirmed_orders_value: number;
    invoiced_value: number;
  };
}

// Response wrapper types
export interface PurchaseOrdersResponse {
  orders: PurchaseOrder[];
  count: number;
}

export interface GoodsReceiptsResponse {
  receipts: any[];
  count: number;
}

export interface VendorInvoicesResponse {
  invoices: any[];
  count: number;
}

export interface VendorPaymentsResponse {
  payments: any[];
  count: number;
}

// ==================== API FUNCTIONS ====================

// Dashboard
export const fetchPurchaseDashboard = async (): Promise<PurchaseDashboard> => {
  const res = await http.get("/api/purchase/dashboard/");
  return res.data;
};

// Purchase Orders
export const fetchPurchaseOrders = async (): Promise<PurchaseOrdersResponse> => {
  const res = await http.get("/api/purchase/orders/");
  return res.data; // Returns {orders: [], count: N}
};

export const fetchPurchaseOrder = async (id: number): Promise<PurchaseOrder> => {
  const res = await http.get(`/api/purchase/orders/${id}/`);
  return res.data;
};

export const createPurchaseOrder = async (data: {
  company_key: number;
  supplier_key: number;
  order_date: string;
  expected_date?: string;
  remarks?: string;
  lines: PurchaseOrderLine[];
}): Promise<any> => {
  const res = await http.post("/api/purchase/orders/", data);
  return res.data;
};

export const approvePurchaseOrder = async (id: number): Promise<any> => {
  const res = await http.post(`/api/purchase/orders/${id}/approve/`);
  return res.data;
};

export const deletePurchaseOrder = async (id: number): Promise<void> => {
  await http.delete(`/api/purchase/orders/${id}/`);
};

// Goods Receipts
export const fetchGoodsReceipts = async (): Promise<GoodsReceiptsResponse> => {
  const res = await http.get("/api/purchase/receipts/");
  return res.data; // Returns {receipts: [], count: N}
};

export const createGoodsReceipt = async (data: GoodsReceipt): Promise<any> => {
  const res = await http.post("/api/purchase/receipts/", data);
  return res.data;
};

// Vendor Invoices
export const fetchVendorInvoices = async (): Promise<VendorInvoicesResponse> => {
  const res = await http.get("/api/purchase/invoices/");
  return res.data; // Returns {invoices: [], count: N}
};

export const fetchVendorInvoice = async (id: string): Promise<VendorInvoice> => {
  const res = await http.get(`/api/purchase/invoices/${id}/`);
  return res.data;
};

export const createVendorInvoice = async (data: {
  company_key: number;
  supplier_key: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  ap_account_key: number;
  inventory_account_key: number;
  lines: VendorInvoiceLine[];
}): Promise<any> => {
  const res = await http.post("/api/purchase/invoices/", data);
  return res.data;
};

// Vendor Payments
export const fetchVendorPayments = async (): Promise<VendorPaymentsResponse> => {
  const res = await http.get("/api/purchase/payments/");
  return res.data; // Returns {payments: [], count: N}
};

export const fetchVendorPayment = async (id: number): Promise<VendorPayment> => {
  const res = await http.get(`/api/purchase/payments/${id}/`);
  return res.data;
};

export const createVendorPayment = async (data: {
  company_key: number;
  supplier_key: number;
  payment_date: string;
  amount: number;
  payment_method?: string;
  reference_no?: string;
  remarks?: string;
  ap_account_key: number;
  bank_account_key: number;
  invoice_id?: string;
}): Promise<any> => {
  const res = await http.post("/api/purchase/payments/", data);
  return res.data;
};