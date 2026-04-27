// src/api/production.ts - FLEXIBLE TYPES (NO ERRORS)
import { http } from "./http";

// ==================== FLEXIBLE TYPES (ALLOWS STRING OR NUMBER) ====================

export interface BOM {
  bom_id?: number;
  bom_key?: number;
  bom_code?: string;
  parent_item_key?: number;
  product_key?: number;
  product_name?: string;
  product_code?: string;
  quantity_produced?: number | string;  // ✅ Flexible
  is_active?: boolean;
  components?: BOMComponent[];
  lines?: BOMComponent[];
  created_at?: string;
}

export interface BOMComponent {
  component_item_key: number;
  component_item_code?: string;
  component_item_name?: string;
  item_key?: number;
  item_code?: string;
  item_name?: string;
  quantity_per?: number | string;  // ✅ Flexible
  quantity?: number | string;      // ✅ Flexible
  uom?: string;
  scrap_percent?: number | string; // ✅ Flexible
}

export interface ProductionBatch {
  batch_id?: number;
  prod_batch_key?: number;
  batch_number?: string;
  bom_id?: number;
  bom_key?: number;
  bom_code?: string;
  product_name?: string;
  planned_quantity?: number | string;  // ✅ Flexible
  planned_qty?: number | string;       // ✅ Flexible
  actual_quantity?: number | string;   // ✅ Flexible
  actual_qty?: number | string;        // ✅ Flexible
  start_date?: string;
  end_date?: string;
  status?: string;
  notes?: string;
  created_at?: string;
}

export interface ProductionDashboard {
  boms?: {
    total: number;
    active: number;
    inactive?: number;
  };
  batches?: {
    total: number;
    draft?: number;
    in_progress: number;
    completed: number;
  };
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Unwrap API responses - handles {success, data} format
 */
const unwrap = (response: any): any => {
  if (response.success !== undefined && response.data) {
    return response.data;
  }
  return response;
};

/**
 * Normalize batch - keep as-is from backend (no conversion)
 */
const normalizeBatch = (batch: any): ProductionBatch => {
  return {
    ...batch,
    batch_id: batch.batch_id || batch.prod_batch_key,
    bom_id: batch.bom_id || batch.bom_key,
    // Keep original values (let frontend handle conversion)
    planned_quantity: batch.planned_quantity || batch.planned_qty,
    actual_quantity: batch.actual_quantity || batch.actual_qty,
  };
};

/**
 * Normalize component - keep as-is from backend
 */
const normalizeComponent = (comp: any): BOMComponent => {
  return {
    ...comp,
    // Keep original values
    quantity_per: comp.quantity_per || comp.quantity,
    quantity: comp.quantity || comp.quantity_per,
  };
};

// ==================== DASHBOARD ====================

export const fetchProductionDashboard = async (): Promise<ProductionDashboard> => {
  const res = await http.get("/api/production/dashboard/");
  return unwrap(res.data) as ProductionDashboard;
};

// ==================== BOMs ====================

export const fetchBOMs = async (): Promise<BOM[]> => {
  const res = await http.get("/api/production/boms/");
  const data: any = unwrap(res.data);
  const boms = data.boms || data;
  
  return Array.isArray(boms) ? boms.map((bom: any) => ({
    ...bom,
    bom_id: bom.bom_id || bom.bom_key,
    components: bom.components?.map((c: any) => normalizeComponent(c)),
    lines: bom.lines?.map((l: any) => normalizeComponent(l)),
  })) : [];
};

export const fetchBOM = async (id: number): Promise<BOM> => {
  const res = await http.get(`/api/production/boms/${id}/`);
  const bom: any = unwrap(res.data);
  
  return {
    ...bom,
    bom_id: bom.bom_id || bom.bom_key,
    components: bom.components?.map((c: any) => normalizeComponent(c)),
    lines: bom.lines?.map((l: any) => normalizeComponent(l)),
  };
};

export const createBOM = async (data: {
  parent_item_key: number;
  bom_code: string;
  quantity_produced?: number;
  description?: string;
  is_active?: boolean;
  components: Array<{
    component_item_key: number;
    quantity_per: number;
    uom?: string;
    scrap_percent?: number;
  }>;
}): Promise<any> => {
  const res = await http.post("/api/production/boms/", data);
  return unwrap(res.data);
};

export const deactivateBOM = async (id: number): Promise<any> => {
  const res = await http.post(`/api/production/boms/${id}/deactivate/`);
  return res.data;
};

export const activateBOM = async (id: number): Promise<any> => {
  const res = await http.post(`/api/production/boms/${id}/activate/`);
  return res.data;
};

// ==================== PRODUCTION BATCHES ====================

export const fetchProductionBatches = async (): Promise<ProductionBatch[]> => {
  const res = await http.get("/api/production/batches/");
  const data: any = unwrap(res.data);
  const batches = data.batches || data;
  
  return Array.isArray(batches) ? batches.map((b: any) => normalizeBatch(b)) : [];
};

export const fetchProductionBatch = async (id: number): Promise<ProductionBatch> => {
  const res = await http.get(`/api/production/batches/${id}/`);
  const batch: any = unwrap(res.data);
  return normalizeBatch(batch);
};

export const createProductionBatch = async (data: {
  bom_key: number;
  planned_quantity: number;
  start_date?: string;
  notes?: string;
}): Promise<any> => {
  const res = await http.post("/api/production/batches/", data);
  const result: any = unwrap(res.data);
  return normalizeBatch(result);
};

// ==================== MATERIAL AVAILABILITY ====================

export const checkMaterialAvailability = async (
  bom_key: number,
  quantity: number
): Promise<any> => {
  const res = await http.post("/api/production/material-availability/", {
    bom_key,
    quantity_to_produce: quantity,
    warehouse_key: 1,
  });
  return unwrap(res.data);
};

export const checkMaterialAvailabilityByProduct = async (
  product_item_key: number,
  quantity: number
): Promise<any> => {
  const res = await http.post("/api/production/check-materials-by-product/", {
    product_item_key,
    quantity,
    warehouse_key: 1,
    company_key: 1,
  });
  return unwrap(res.data);
};

// ==================== MATERIAL ISSUE ====================

export const issueMaterials = async (data: {
  batch_id: number;
  issue_date: string;
  warehouse_key: number;
  wip_account_key: number;
  inventory_account_key: number;
  notes?: string;
  lines: Array<{
    item_key: number;
    quantity: number;
  }>;
}): Promise<any> => {
  const batch = await fetchProductionBatch(data.batch_id);
  
  // Convert to number for API call
  const plannedQty = typeof batch.planned_quantity === 'string' 
    ? parseFloat(batch.planned_quantity) 
    : (batch.planned_quantity || 0);
  
  const payload = {
    company_key: 1,
    bom_key: batch.bom_id || batch.bom_key || 0,
    batch_key: data.batch_id,
    issue_date: data.issue_date,
    warehouse_key: data.warehouse_key,
    quantity_to_produce: plannedQty,
    inventory_account_key: data.inventory_account_key,
    wip_account_key: data.wip_account_key,
    notes: data.notes,
    created_by: 1,
  };
  
  const res = await http.post("/api/production/material-issue/", payload);
  return res.data;
};

// ==================== PRODUCTION COMPLETION ====================

export const completeProduction = async (data: {
  batch_id: number;
  completion_date: string;
  quantity_completed: number;
  warehouse_key: number;
  fg_inventory_account_key: number;
  wip_account_key: number;
  notes?: string;
}): Promise<any> => {
  const payload = {
    prod_batch_key: data.batch_id,
    completion_date: data.completion_date,
    quantity_completed: data.quantity_completed,
    warehouse_key: data.warehouse_key,
    wip_account_key: data.wip_account_key,
    fg_inventory_account_key: data.fg_inventory_account_key,
    notes: data.notes,
    created_by: 1,
  };
  
  const res = await http.post("/api/production/completion/", payload);
  return res.data;
};

// ==================== PRODUCT-BASED FUNCTIONS ====================

export const createProductionBatchFromProduct = async (data: {
  product_item_key: number;
  planned_quantity: number;
  start_date?: string;
  notes?: string;
}): Promise<any> => {
  const res = await http.post("/api/production/batches/from-product/", data);
  return unwrap(res.data);
};

export const getProductionRequirements = async (
  product_item_key: number,
  quantity: number
): Promise<any> => {
  const res = await http.post("/api/production/calculate-requirements/", {
    product_item_key,
    quantity,
  });
  return unwrap(res.data);
};


export const addLabor = async (data: {
  prod_batch_key: number;
  labor_hours: number;
  hourly_rate: number;
  labor_date: string;
  worker_name?: string;
  cost_center_key?: number;
  notes?: string;
}): Promise<any> => {
  const res = await http.post("/api/production/labor/", {
    ...data,
    created_by: 1,
  });
  return res.data;
};

export const addOverhead = async (data: {
  prod_batch_key: number;
  overhead_method: "PERCENTAGE" | "UNIT" | "FIXED";
  overhead_rate: number;
  allocation_date: string;
  notes?: string;
}): Promise<any> => {
  const res = await http.post("/api/production/overhead/", {
    ...data,
    created_by: 1,
  });
  return res.data;
};

export const fetchBatchCostSummary = async (batch_id: number): Promise<any> => {
  const res = await http.get(`/api/production/batches/${batch_id}/cost-summary/`);
  return unwrap(res.data);
};

export const fetchLaborReport = async (
  start_date: string,
  end_date: string,
  company_key: number = 1
): Promise<any> => {
  const res = await http.get("/api/production/labor-report/", {
    params: { company_key, start_date, end_date },
  });
  return unwrap(res.data);
};

export const fetchOverheadReport = async (
  start_date: string,
  end_date: string,
  company_key: number = 1
): Promise<any> => {
  const res = await http.get("/api/production/overhead-report/", {
    params: { company_key, start_date, end_date },
  });
  return unwrap(res.data);
};
