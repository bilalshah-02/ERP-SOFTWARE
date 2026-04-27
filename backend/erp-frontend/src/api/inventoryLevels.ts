// frontend/src/api/inventoryLevels.ts
/**
 * Inventory Levels & Reorder Management API
 * Store Ledger Card API
 */

import { http } from "./http";

// ==================== TYPES ====================

export interface InventoryLevelsInput {
  item_key: number;
  
  // Daily usage
  avg_daily_usage?: number;
  min_daily_usage?: number;
  max_daily_usage?: number;
  
  // Lead times (days)
  avg_lead_time_days?: number;
  min_lead_time_days?: number;
  max_lead_time_days?: number;
  
  // EOQ
  economic_order_qty?: number;
}

export interface InventoryLevels extends InventoryLevelsInput {
  // Calculated levels
  reorder_level: number;
  min_stock_absolute: number;
  min_stock_normal: number;
  max_stock_absolute: number;
  max_stock_normal: number;
}

export interface ItemWithLevels {
  item_key: number;
  item_code: string;
  name: string;
  
  // Usage
  avg_daily_usage: number;
  min_daily_usage: number;
  max_daily_usage: number;
  
  // Lead time
  avg_lead_time_days: number;
  min_lead_time_days: number;
  max_lead_time_days: number;
  
  // EOQ
  economic_order_qty: number;
  
  // Calculated levels
  reorder_level: number;
  min_stock_absolute: number;
  min_stock_normal: number;
  max_stock_absolute: number;
  max_stock_normal: number;
  
  // Current stock
  current_stock?: number;
  needs_reorder?: boolean;
  stock_status?: 'OK' | 'LOW' | 'CRITICAL' | 'REORDER' | 'OVERSTOCK';
}

export interface ReorderAlert {
  item_key: number;
  item_code: string;
  item_name: string;
  current_stock: number;
  reorder_level: number;
  shortage: number;
  economic_order_qty: number;
  suggested_order_qty: number;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
}

export interface LedgerTransaction {
  movement_id: number;
  date: string;
  movement_type: string;
  reference: string;
  quantity_in: number;
  quantity_out: number;
  balance: number;
  uom: string;
  issued_by: string;
  notes: string;
  created_at: string;
}

export interface StoreLedgerCard {
  item: {
    item_key: number;
    item_code: string;
    name: string;
    uom: string;
  };
  warehouse: {
    warehouse_key: number;
    code: string;
    name: string;
  } | null;
  period: {
    start_date: string | null;
    end_date: string | null;
  };
  opening_balance: number;
  transactions: LedgerTransaction[];
  closing_balance: number;
  transaction_count: number;
}

// ==================== HELPER ====================

const unwrap = (response: any): any => {
  if (response.success !== undefined && response.data) {
    return response.data;
  }
  return response;
};

// ==================== INVENTORY LEVELS ====================

/**
 * Configure inventory levels for an item
 */
export const configureInventoryLevels = async (
  data: InventoryLevelsInput
): Promise<InventoryLevels> => {
  const res = await http.post("/api/inventory/levels/", data);
  return unwrap(res.data);
};

/**
 * Get inventory levels for all items or specific item
 */
export const fetchInventoryLevels = async (params?: {
  item_key?: number;
  company_key?: number;
  warehouse_key?: number;
  needs_reorder?: boolean;
}): Promise<ItemWithLevels[]> => {
  const res = await http.get("/api/inventory/levels/list/", { params });
  const data = unwrap(res.data);
  return Array.isArray(data) ? data : [];
};

/**
 * Get items that need reordering
 */
export const fetchReorderAlerts = async (params?: {
  company_key?: number;
  warehouse_key?: number;
}): Promise<ReorderAlert[]> => {
  const res = await http.get("/api/inventory/reorder-alerts/", { params });
  const data = unwrap(res.data);
  return data.alerts || [];
};

// ==================== STORE LEDGER CARD ====================

/**
 * Get store ledger card for an item
 */
export const fetchStoreLedgerCard = async (params: {
  item_key: number;
  warehouse_key?: number;
  start_date?: string;
  end_date?: string;
}): Promise<StoreLedgerCard> => {
  const res = await http.get("/api/inventory/ledger-card/", { params });
  return unwrap(res.data);
};

/**
 * Get ledger summary for all items
 */
export const fetchStoreLedgerSummary = async (params?: {
  warehouse_key?: number;
}): Promise<any[]> => {
  const res = await http.get("/api/inventory/ledger-summary/", { params });
  const data = unwrap(res.data);
  return data.summary || [];
};