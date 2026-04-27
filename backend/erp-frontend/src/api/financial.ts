// src/api/financial.ts
import { http } from "./http";

// ==================== TYPES ====================

export interface GlDashboard {
  journal_statistics: {
    total_journals: number;
    by_status: Record<string, number>;
    current_period: {
      period_code: string;
      start_date: string;
      end_date: string;
      is_closed: boolean;
      journal_count: number;
      total_debit: number;
      total_credit: number;
    } | null;
    total_debit: number;
    total_credit: number;
    out_of_balance: number;
    total_lines: number;
  };
  chart_of_accounts: {
    total_accounts: number;
    by_type: Record<string, number>;
    active: number;
    inactive: number;
    posting: number;
    non_posting: number;
  };
  account_activity: {
    accounts_with_recent_activity: number;
    total_accounts: number;
    activity_rate: number;
    top_active_accounts: Array<{
      account_key: number;
      account_code: string;
      account_name: string;
      transaction_count: number;
      total_debit: number;
      total_credit: number;
      net_movement: number;
    }>;
  };
  period_summary: {
    total_periods: number;
    open_periods: number | null;
    closed_periods: number | null;
    recent_periods: Array<{
      period_key: number;
      period_code: string;
      start_date: string;
      end_date: string;
      is_closed: boolean | null;
      journal_count: number;
    }>;
  };
  recent_journals: Array<{
    gl_id: number;
    journal_number: string;
    journal_date: string;
    description: string;
    status: string;
    total_debit: number;
    total_credit: number;
    line_count: number;
    created_at: string;
  }>;
}

export interface JournalEntry {
  gl_id?: number;
  journal_number?: string;
  journal_date: string;
  description?: string;
  status?: string;
  company_key?: number;
  period_key?: number;
  created_at?: string;
  lines?: JournalLine[];
}

export interface JournalLine {
  gl_line_id?: number;
  account_key: number;
  account_code?: string;
  account_name?: string;
  debit: number;
  credit: number;
  cost_center_key?: number;
  project_job_id?: number;
  description?: string;
}

export interface Account {
  account_key?: number;
  account_code: string;
  account_name: string;
  account_type: string;
  parent_account_key?: number;
  is_posting: boolean;
  is_active: boolean;
  description?: string;
  company_key?: number;
}

export interface FiscalPeriod {
  period_key?: number;
  period_code: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  company_key?: number;
}

// ==================== API FUNCTIONS ====================

// Dashboard
export const fetchGlDashboard = async (params?: {
  company_key?: number;
  period_key?: number;
}): Promise<GlDashboard> => {
  const res = await http.get("/api/gl/dashboard/", { params });
  return res.data;
};

// Journal Entries
export const fetchJournalEntries = async (params?: {
  status?: string;
  period_key?: number;
  company_key?: number;
}): Promise<JournalEntry[]> => {
  const res = await http.get("/api/journal-entries/", { params });
  return res.data;
};

export const fetchJournalEntry = async (id: number): Promise<JournalEntry> => {
  const res = await http.get(`/api/journal-entries/${id}/`);
  return res.data;
};

export const createJournalEntry = async (
  data: JournalEntry
): Promise<JournalEntry> => {
  const res = await http.post("/api/journal-entries/", data);
  return res.data;
};

export const deleteJournalEntry = async (id: number): Promise<void> => {
  await http.delete(`/api/journal-entries/${id}/`);
};

// Chart of Accounts
export const fetchAccounts = async (params?: {
  account_type?: string;
  is_posting?: boolean;
  is_active?: boolean;
  company_key?: number;
}): Promise<Account[]> => {
  const res = await http.get("/api/accounts/", { params });
  return res.data;
};

export const fetchAccount = async (id: number): Promise<Account> => {
  const res = await http.get(`/api/accounts/${id}/`);
  return res.data;
};

export const createAccount = async (data: Account): Promise<Account> => {
  const res = await http.post("/api/accounts/", data);
  return res.data;
};

export const updateAccount = async (
  id: number,
  data: Partial<Account>
): Promise<Account> => {
  const res = await http.patch(`/api/accounts/${id}/`, data);
  return res.data;
};

export const deleteAccount = async (id: number): Promise<void> => {
  await http.delete(`/api/accounts/${id}/`);
};

// Fiscal Periods
export const fetchPeriods = async (params?: {
  is_closed?: boolean;
  company_key?: number;
}): Promise<FiscalPeriod[]> => {
  const res = await http.get("/api/periods/", { params });
  
  // Handle {periods: [...], count: N} format
  if (res.data?.periods && Array.isArray(res.data.periods)) {
    return res.data.periods;
  }
  
  // Handle direct array format
  if (Array.isArray(res.data)) {
    return res.data;
  }
  
  // Fallback
  console.warn('Unexpected periods response format:', res.data);
  return [];
};

export const closePeriod = async (
  id: number
): Promise<{ message: string; period: FiscalPeriod }> => {
  const res = await http.post(`/api/periods/${id}/close/`);
  return res.data;
};

export const reopenPeriod = async (
  id: number
): Promise<{ message: string; period: FiscalPeriod }> => {
  const res = await http.post(`/api/periods/${id}/reopen/`);
  return res.data;
};

export const createPeriod = async (
  data: FiscalPeriod
): Promise<FiscalPeriod> => {
  const res = await http.post("/api/periods/", data);
  
  // Handle wrapped response
  if (res.data?.success && res.data?.data) {
    return res.data.data;
  }
  
  return res.data;
};