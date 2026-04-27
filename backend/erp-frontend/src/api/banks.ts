import { http } from "./http";

export interface Bank {
  party_key?: number;
  party_code: string;
  name: string;
  party_type?: string;
  tax_id?: string;        // Account Number
  phone?: string;         // Branch
  email?: string;         // Swift/IBAN
  address_line1?: string; // Bank Address
  city?: string;
  country?: string;
  created_at?: string;
}

export async function fetchBanks(search?: string) {
  const params = search ? { search } : {};
  const res = await http.get("/api/banks/", { params });
  return res.data;
}

export async function fetchBankById(id: number) {
  const res = await http.get(`/api/banks/${id}/`);
  return res.data;
}

export async function createBank(data: Bank) {
  const res = await http.post("/api/banks/", data);
  return res.data;
}

export async function updateBank(id: number, data: Bank) {
  const res = await http.put(`/api/banks/${id}/`, data);
  return res.data;
}

export async function deleteBank(id: number) {
  await http.delete(`/api/banks/${id}/`);
}