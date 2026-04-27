// src/api/crm.ts
import { http } from "./http";

// ==================== TYPES ====================

export interface Lead {
  lead_id?: number;
  lead_code?: string;
  lead_name: string;
  company_key?: number;
  contact_person?: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  estimated_value?: number;
  currency_code?: string;
  customer_party_key?: number;
  customer_name?: string;
  created_at?: string;
  created_by?: number;
}

export interface Activity {
  activity_id?: number;
  lead_id?: number;
  lead_code?: string;
  lead_name?: string;
  party_key?: number;
  party_name?: string;
  activity_type: string;
  subject: string;
  notes?: string;
  due_at?: string;
  completed_at?: string;
  created_at?: string;
  created_by?: number;
}

export interface CrmDashboard {
  leads?: {
    total: number;
    by_status: Record<string, number>;
    total_value: number;
    avg_value: number;
    conversion_rate: number;
    converted_count: number;
  };
  activities?: {
    total: number;
    completed: number;
    pending: number;
    by_type: Record<string, number>;
  };
  recent_leads?: Lead[];
}

export interface PipelineStage {
  stage: string;
  count: number;
  total_value: number;
  leads: Lead[];
}

export interface LeadPipeline {
  pipeline: PipelineStage[];
}

// ==================== API FUNCTIONS ====================

// Dashboard
export const fetchCrmDashboard = async (): Promise<CrmDashboard> => {
  const res = await http.get("/api/crm/dashboard/");
  return res.data;
};

// Leads
export const fetchLeads = async (params?: {
  status?: string;
  source?: string;
}): Promise<Lead[]> => {
  const res = await http.get("/api/crm/leads/", { params });
  return res.data;
};

export const fetchLead = async (id: number): Promise<Lead> => {
  const res = await http.get(`/api/crm/leads/${id}/`);
  return res.data;
};

export const createLead = async (data: {
  company_key: number;
  lead_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  source?: string;
  estimated_value?: number;
  created_by?: number;
}): Promise<Lead> => {
  const res = await http.post("/api/crm/leads/", data);
  return res.data;
};

export const updateLead = async (
  id: number,
  data: Partial<Lead>
): Promise<Lead> => {
  const res = await http.patch(`/api/crm/leads/${id}/`, data);
  return res.data;
};

export const deleteLead = async (id: number): Promise<void> => {
  await http.delete(`/api/crm/leads/${id}/`);
};

export const convertLead = async (
  id: number,
  data: { create_customer?: boolean }
): Promise<{
  message: string;
  lead: Lead;
  customer: any;
}> => {
  const res = await http.post(`/api/crm/leads/${id}/convert/`, data);
  return res.data;
};

// Activities
export const fetchActivities = async (params?: {
  lead_id?: number;
  party_key?: number;
  activity_type?: string;
  completed?: boolean;
}): Promise<Activity[]> => {
  const res = await http.get("/api/crm/activities/", { params });
  return res.data;
};

export const fetchActivity = async (id: number): Promise<Activity> => {
  const res = await http.get(`/api/crm/activities/${id}/`);
  return res.data;
};

export const createActivity = async (data: {
  lead_id?: number;
  party_key?: number;
  activity_type: string;
  subject: string;
  notes?: string;
  due_at?: string;
  created_by?: number;
}): Promise<Activity> => {
  const res = await http.post("/api/crm/activities/", data);
  return res.data;
};

export const completeActivity = async (
  id: number,
  data: { completion_notes?: string }
): Promise<{
  message: string;
  activity: Activity;
}> => {
  const res = await http.post(`/api/crm/activities/${id}/complete/`, data);
  return res.data;
};

// Lead Activities (specific to a lead)
export const fetchLeadActivities = async (leadId: number): Promise<Activity[]> => {
  const res = await http.get(`/api/crm/leads/${leadId}/activities/`);
  return res.data;
};

// Pipeline
export const fetchPipeline = async (): Promise<LeadPipeline> => {
  const res = await http.get("/api/crm/pipeline/");
  return res.data;
};