// src/pages/financial/ChartOfAccountsList.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  type Account,
} from "../../api/financial";
import FormWrapper from "../../components/FormWrapper";

export default function ChartOfAccountsList() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState<Account>({
    account_code: "",
    account_name: "",
    account_type: "ASSET",
    is_posting: true,
    is_active: true,
    description: "",
  });

  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts", typeFilter],
    queryFn: () =>
      fetchAccounts({
        account_type: typeFilter || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setShowForm(false);
      resetForm();
      alert("Account created successfully!");
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Error creating account");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Account }) =>
      updateAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setShowForm(false);
      resetForm();
      alert("Account updated successfully!");
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Error updating account");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      alert("Account deleted successfully!");
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Error deleting account");
    },
  });

  const resetForm = () => {
    setFormData({
      account_code: "",
      account_name: "",
      account_type: "ASSET",
      is_posting: true,
      is_active: true,
      description: "",
    });
    setEditingAccount(null);
  };

  const handleEdit = (account: Account) => {
    setFormData(account);
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleDelete = (id: number, accountCode: string) => {
    if (window.confirm(`Delete Account ${accountCode}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAccount && editingAccount.account_key) {
      updateMutation.mutate({
        id: editingAccount.account_key,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((account: any) =>
    account.account_code?.toLowerCase().includes(search.toLowerCase()) ||
    account.account_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (showForm) {
    return (
      <FormWrapper
        title={editingAccount ? "Edit Account" : "Create Account"}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false);
          resetForm();
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Account Code*</label>
            <input
              type="text"
              className="form-control"
              name="account_code"
              value={formData.account_code}
              onChange={handleChange}
              required
              placeholder="1000"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Account Name*</label>
            <input
              type="text"
              className="form-control"
              name="account_name"
              value={formData.account_name}
              onChange={handleChange}
              required
              placeholder="Cash in Hand"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Account Type*</label>
            <select
              className="form-select"
              name="account_type"
              value={formData.account_type}
              onChange={handleChange}
              required
            >
              <option value="ASSET">Asset</option>
              <option value="LIABILITY">Liability</option>
              <option value="EQUITY">Equity</option>
              <option value="REVENUE">Revenue</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Status</label>
            <div className="form-check form-switch mt-2">
              <input
                className="form-check-input"
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              <label className="form-check-label">Active</label>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                name="is_posting"
                checked={formData.is_posting}
                onChange={handleChange}
              />
              <label className="form-check-label">Posting Account</label>
            </div>
          </div>

          <div className="col-12">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="col-12">
            <div className="alert alert-info">
              <strong>💡 Tip:</strong> Posting accounts are used in transactions.
              Non-posting accounts are typically parent/header accounts.
            </div>
          </div>
        </div>
      </FormWrapper>
    );
  }

  return (
    <div className="row g-4">
      <div className="col-12">
        <div className="card-box d-flex align-items-center justify-content-between">
          <div>
            <h2 className="fw-bold mb-1">Chart of Accounts</h2>
            <div className="text-muted">Manage your account structure</div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            + Create Account
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="col-12">
        <div className="card-box">
          <div className="row g-3">
            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="Search by code or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="ASSET">Asset</option>
                <option value="LIABILITY">Liability</option>
                <option value="EQUITY">Equity</option>
                <option value="REVENUE">Revenue</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Account Name</th>
                  <th>Type</th>
                  <th>Posting</th>
                  <th>Status</th>
                  <th style={{ width: 150 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center">
                      Loading...
                    </td>
                  </tr>
                ) : filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center">
                      No accounts found
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((account: Account) => (
                    <tr key={account.account_key}>
                      <td className="fw-bold">{account.account_code}</td>
                      <td className="fw-semibold">{account.account_name}</td>
                      <td>
                        <span className="badge bg-secondary">
                          {account.account_type}
                        </span>
                      </td>
                      <td>
                        {account.is_posting ? (
                          <span className="badge bg-success">Yes</span>
                        ) : (
                          <span className="badge bg-secondary">No</span>
                        )}
                      </td>
                      <td>
                        {account.is_active ? (
                          <span className="badge bg-success">Active</span>
                        ) : (
                          <span className="badge bg-danger">Inactive</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEdit(account)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() =>
                            handleDelete(account.account_key!, account.account_code)
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {filteredAccounts.length > 0 && (
            <div className="mt-3 pt-3 border-top">
              <div className="row text-center">
                <div className="col-md-3">
                  <div className="text-muted small">Total Accounts</div>
                  <div className="fs-5 fw-bold">{filteredAccounts.length}</div>
                </div>
                <div className="col-md-3">
                  <div className="text-muted small">Posting</div>
                  <div className="fs-5 fw-bold text-success">
                    {
                      filteredAccounts.filter((a: any) => a.is_posting).length
                    }
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-muted small">Active</div>
                  <div className="fs-5 fw-bold text-primary">
                    {filteredAccounts.filter((a: any) => a.is_active).length}
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-muted small">Inactive</div>
                  <div className="fs-5 fw-bold text-secondary">
                    {
                      filteredAccounts.filter((a: any) => !a.is_active).length
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}