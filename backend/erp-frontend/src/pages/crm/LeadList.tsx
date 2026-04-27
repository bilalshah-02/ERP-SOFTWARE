// src/pages/crm/LeadList.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchLeads, deleteLead } from "../../api/crm";
import { useState } from "react";

export default function LeadList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads", statusFilter, sourceFilter],
    queryFn: () =>
      fetchLeads({
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      alert("Lead deleted successfully!");
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    },
  });

  const handleDelete = (id: number, leadCode: string) => {
    if (window.confirm(`Delete Lead ${leadCode}?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Filter leads based on search
  const filteredLeads = leads.filter((lead: any) =>
    lead.lead_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get unique statuses and sources
  const uniqueStatuses = [...new Set(leads.map((l: any) => l.status).filter(Boolean))];
  const uniqueSources = [...new Set(leads.map((l: any) => l.source).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold mb-1">Leads</h2>
              <div className="text-muted">Manage your sales leads</div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/crm/leads/create")}
            >
              + Create Lead
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="col-12">
        <div className="card-box">
          <div className="row g-3">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Search by lead code, name, contact, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="">All Sources</option>
                {uniqueSources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Lead Code</th>
                  <th>Lead Name</th>
                  <th>Contact Person</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Est. Value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-muted py-4">
                      {searchTerm || statusFilter || sourceFilter
                        ? "No leads match your filters"
                        : "No leads yet. Create your first lead!"}
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead: any) => (
                    <tr key={lead.lead_id}>
                      <td className="fw-bold">{lead.lead_code}</td>
                      <td>{lead.lead_name}</td>
                      <td>{lead.contact_person || "—"}</td>
                      <td>{lead.email || "—"}</td>
                      <td>{lead.phone || "—"}</td>
                      <td>{lead.source || "—"}</td>
                      <td>
                        <span
                          className={`badge bg-${
                            lead.status === "NEW"
                              ? "primary"
                              : lead.status === "CONTACTED"
                              ? "info"
                              : lead.status === "QUALIFIED"
                              ? "warning"
                              : lead.status === "NEGOTIATING"
                              ? "secondary"
                              : lead.status === "WON"
                              ? "success"
                              : lead.status === "LOST"
                              ? "danger"
                              : "secondary"
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td>
                        {lead.estimated_value
                          ? `${lead.currency_code || ""} ${lead.estimated_value.toLocaleString()}`
                          : "—"}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => navigate(`/crm/leads/${lead.lead_id}`)}
                          >
                            View
                          </button>
                          {!lead.customer_party_key && (
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() =>
                                navigate(`/crm/leads/${lead.lead_id}/convert`)
                              }
                            >
                              Convert
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              handleDelete(lead.lead_id!, lead.lead_code!)
                            }
                            disabled={deleteMutation.isPending}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {filteredLeads.length > 0 && (
            <div className="mt-3 pt-3 border-top">
              <div className="row text-center">
                <div className="col-md-2">
                  <div className="text-muted small">Total Leads</div>
                  <div className="fs-5 fw-bold">{filteredLeads.length}</div>
                </div>
                <div className="col-md-2">
                  <div className="text-muted small">New</div>
                  <div className="fs-5 fw-bold text-primary">
                    {filteredLeads.filter((l: any) => l.status === "NEW").length}
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="text-muted small">Contacted</div>
                  <div className="fs-5 fw-bold text-info">
                    {filteredLeads.filter((l: any) => l.status === "CONTACTED").length}
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="text-muted small">Qualified</div>
                  <div className="fs-5 fw-bold text-warning">
                    {filteredLeads.filter((l: any) => l.status === "QUALIFIED").length}
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="text-muted small">Won</div>
                  <div className="fs-5 fw-bold text-success">
                    {filteredLeads.filter((l: any) => l.status === "WON").length}
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="text-muted small">Lost</div>
                  <div className="fs-5 fw-bold text-danger">
                    {filteredLeads.filter((l: any) => l.status === "LOST").length}
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