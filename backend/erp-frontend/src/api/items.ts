// src/api/items.ts - UPDATED WITH RECIPE FUNCTIONS
import { http } from "./http";

export interface Item {
  item_key?: number;
  item_code: string;
  name: string;
  description?: string;
  item_class: string;
  uom: string;
  costing_method?: string;
  is_batch_tracked?: boolean;
  is_active?: boolean;
  created_at?: string;
}

export interface ItemRecipe {
  product_item_key: number;
  product_name?: string;
  product_code?: string;
  bom_id?: number;
  bom_code?: string;
  components: Array<{
    item_key: number;
    item_name?: string;
    item_code?: string;
    quantity_per: number;
    quantity?: number; // Alias
    uom?: string;
  }>;
}

export const ITEM_CLASSES = [
  { value: "INVENTORY", label: "Inventory" },
  { value: "MANUFACTURED", label: "Manufactured" },
  { value: "SERVICE", label: "Service" },
  { value: "NON_INVENTORY", label: "Non-Inventory" },
  { value: "KIT", label: "Kit" },
  { value: "FIXED_ASSET", label: "Fixed Asset" },
];

export const COSTING_METHODS = [
  { value: "FIFO", label: "FIFO" },
  { value: "LIFO", label: "LIFO" },
  { value: "AVERAGE", label: "Average" },
  { value: "STANDARD", label: "Standard" },
  { value: "SPECIFIC", label: "Specific" },
];

export const UOMS = [
  "pcs", "kg", "ltr", "meter", "box", "carton", "dozen", "ton", "gram", "ml"
];

export async function fetchItems(search?: string, item_class?: string): Promise<Item[]> {
  const params: any = {};
  if (search) params.search = search;
  if (item_class) params.item_class = item_class;
  
  const res = await http.get("/api/items/", { params });
  return res.data as Item[];
}

export async function fetchItemById(id: number): Promise<Item> {
  const res = await http.get(`/api/items/${id}/`);
  return res.data as Item;
}

export async function createItem(data: Item): Promise<Item> {
  const res = await http.post("/api/items/", data);
  return res.data as Item;
}

export async function updateItem(id: number, data: Item): Promise<Item> {
  const res = await http.put(`/api/items/${id}/`, data);
  return res.data as Item;
}

export async function deleteItem(id: number): Promise<void> {
  await http.delete(`/api/items/${id}/`);
}

// ==================== NEW: RECIPE FUNCTIONS ====================

/**
 * Create a recipe for a product (creates BOM in background)
 */
export async function createItemRecipe(data: {
  product_item_key: number;
  components: Array<{
    component_item_key: number;
    quantity_per: number;
    uom?: string;
  }>;
}): Promise<any> {
  const res = await http.post("/api/items/recipe/", data);
  return res.data;
}

/**
 * Get recipe for a product (fetches BOM)
 */
export async function fetchItemRecipe(product_item_key: number): Promise<ItemRecipe> {
  const res = await http.get(`/api/items/${product_item_key}/recipe/`);
  return res.data as ItemRecipe;
}

/**
 * Update recipe for a product
 */
export async function updateItemRecipe(
  product_item_key: number,
  data: {
    components: Array<{
      component_item_key: number;
      quantity_per: number;
      uom?: string;
    }>;
  }
): Promise<any> {
  const res = await http.put(`/api/items/${product_item_key}/recipe/`, data);
  return res.data;
}

/**
 * Check if product has a recipe
 */
export async function checkItemHasRecipe(product_item_key: number): Promise<boolean> {
  try {
    await http.get(`/api/items/${product_item_key}/recipe/`);
    return true;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return false;
    }
    throw error;
  }
}