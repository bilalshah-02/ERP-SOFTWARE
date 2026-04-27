import { http } from "./http";

export interface Vendor {
  party_key?: number;
  party_code: string;
  name: string;
  party_type?: string;
  tax_id?: string;
  phone?: string;
  email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  country?: string;
  created_at?: string;
}

export async function fetchVendors(search?: string): Promise<Vendor[]> {
  const params = search ? { search } : {};
  const res = await http.get("/api/vendors/", { params });
  return res.data as Vendor[];
}

export async function fetchVendorById(id: number): Promise<Vendor> {
  const res = await http.get(`/api/vendors/${id}/`);
  return res.data as Vendor;
}

export async function createVendor(data: Vendor): Promise<Vendor> {
  const res = await http.post("/api/vendors/", data);
  return res.data as Vendor;
}

export async function updateVendor(id: number, data: Vendor): Promise<Vendor> {
  const res = await http.put(`/api/vendors/${id}/`, data);
  return res.data as Vendor;
}

export async function deleteVendor(id: number): Promise<void> {
  await http.delete(`/api/vendors/${id}/`);
}