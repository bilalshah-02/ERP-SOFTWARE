import { http } from "./http";

export async function fetchProductCosting() {
  // DRF list endpoint returns either:
  // - an array []
  // - or { results: [] } if pagination is enabled
  const res = await http.get("/api/product-costing/");
  const data = res.data;
  return Array.isArray(data) ? data : data?.results ?? [];
}
