import { http } from "./http";

export interface Customer {
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

export async function fetchCustomers(search?: string) {
  const params = search ? { search } : {};
  const res = await http.get("/api/customers/", { params });
  return res.data;
}

export async function fetchCustomerById(id: number) {
  const res = await http.get(`/api/customers/${id}/`);
  return res.data;
}

export async function createCustomer(data: Customer) {
  const res = await http.post("/api/customers/", data);
  return res.data;
}

export async function updateCustomer(id: number, data: Customer) {
  const res = await http.put(`/api/customers/${id}/`, data);
  return res.data;
}

export async function deleteCustomer(id: number) {
  await http.delete(`/api/customers/${id}/`);
}