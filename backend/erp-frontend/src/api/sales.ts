// src/api/sales.ts - COMPLETE FIXED VERSION
import { http } from "./http";

// ==================== TYPES ====================

export interface SalesOrderLine {
  item_key: number;
  quantity: number;
  unit_price: number;
  description?: string;
  discount_amount?: number;
  tax_key?: number;
}

export interface SalesOrder {
  so_id?: number;
  so_number?: string;
  order_date: string;
  customer_key: number;
  customer_name?: string;
  delivery_date?: string;
  status?: string;
  remarks?: string;
  lines?: any[];
  created_at?: string;
  total_amount?: number;
}

export interface DeliveryNote {
  so_id: number;
  delivery_date: string;
  warehouse_key: number;
  notes?: string;
  inventory_account_key: number;
  cogs_account_key: number;
}

export interface CustomerInvoiceLine {
  so_line_id: number;
  quantity: number;
}

export interface CustomerInvoice {
  so_id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  ar_account_key: number;
  revenue_account_key: number;
  lines: CustomerInvoiceLine[];
}

export interface CustomerReceipt {
  company_key: number;
  customer_key: number;
  payment_date: string;
  amount: number;
  payment_method?: string;
  reference_no?: string;
  notes?: string;
  cash_account_key: number;
  ar_account_key: number;
  invoice_id?: string;
}

export interface SalesDashboard {
  sales_orders?: {
    total: number;
    by_status: Record<string, number>;
  };
  invoices?: {
    total: number;
    total_amount: number;
  };
  receipts?: {
    total: number;
    total_amount: number;
  };
}

// ✅ NEW: Response types for list endpoints
export interface SalesOrdersResponse {
  orders: SalesOrder[];
  count: number;
}

export interface DeliveryNotesResponse {
  deliveries: any[];
  count: number;
}

export interface InvoicesResponse {
  invoices: any[];
  count: number;
}

export interface ReceiptsResponse {
  receipts: any[];
  count: number;
}

// ==================== API FUNCTIONS ====================

// Dashboard
export const fetchSalesDashboard = async (): Promise<SalesDashboard> => {
  const res = await http.get("/api/sales/dashboard/");
  return res.data;
};

// Sales Orders
// ✅ FIXED: Returns the full response object
export const fetchSalesOrders = async (): Promise<SalesOrdersResponse> => {
  const res = await http.get("/api/sales/orders/");
  return res.data;  // Returns {orders: [], count: 2}
};

export const fetchSalesOrder = async (id: number): Promise<SalesOrder> => {
  const res = await http.get(`/api/sales/orders/${id}/`);
  return res.data;
};

export const createSalesOrder = async (data: {
  company_key: number;
  customer_key: number;
  order_date: string;
  delivery_date?: string;
  remarks?: string;
  lines: SalesOrderLine[];
}): Promise<SalesOrder> => {
  const res = await http.post("/api/sales/orders/", data);
  return res.data;
};

export const updateSalesOrder = async (
  id: number,
  data: Partial<SalesOrder>
): Promise<SalesOrder> => {
  const res = await http.put(`/api/sales/orders/${id}/`, data);
  return res.data;
};

export const deleteSalesOrder = async (id: number): Promise<void> => {
  await http.delete(`/api/sales/orders/${id}/`);
};

// Delivery Notes
export const createDeliveryNote = async (
  data: DeliveryNote
): Promise<any> => {
  const res = await http.post("/api/sales/deliveries/", data);
  return res.data;
};

// ✅ FIXED: Return type matches response structure
export const fetchDeliveryNotes = async (): Promise<DeliveryNotesResponse> => {
  const response = await http.get('/api/sales/deliveries/');
  return response.data;  // Returns {deliveries: [], count: 2}
};

// Customer Invoices
// ✅ FIXED: Return type matches response structure
export const fetchCustomerInvoices = async (): Promise<InvoicesResponse> => {
  const res = await http.get("/api/sales/invoices/");
  return res.data;  // Returns {invoices: [], count: 2}
};

export const createCustomerInvoice = async (
  data: CustomerInvoice
): Promise<any> => {
  const res = await http.post("/api/sales/invoices/", data);
  return res.data;
};

// Customer Receipts
// ✅ FIXED: Return type matches response structure
export const fetchCustomerReceipts = async (): Promise<ReceiptsResponse> => {
  const res = await http.get("/api/sales/receipts/");
  return res.data;  // Returns {receipts: [], count: 2}
};

export const createCustomerReceipt = async (
  data: CustomerReceipt
): Promise<any> => {
  const res = await http.post("/api/sales/receipts/", data);
  return res.data;
};