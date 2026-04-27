// src/pages/crm/CrmDashboard.tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchCrmDashboard } from "../../api/crm";

export default function CrmDashboard() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["crm-dashboard"],
    queryFn: fetchCrmDashboard,
  });

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const leads = data?.leads || {
    total: 0,
    by_status: {},
    total_value: 0,
    avg_value: 0,
    conversion_rate: 0,
    converted_count: 0,
  };
  const activities = data?.activities || {
    total: 0,
    completed: 0,
    pending: 0,
    by_type: {},
  };
  const recentLeads = data?.recent_leads || [];

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold mb-1">CRM Dashboard</h2>
              <div className="text-muted">Customer relationship management overview</div>
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

      {/* Lead Statistics */}
      <div className="col-12">
        <div className="card-box">
          <h5 className="fw-bold mb-3">Lead Statistics</h5>
          <div className="row text-center">
            <div className="col-md-2">
              <div className="text-muted small">Total Leads</div>
              <div className="fs-4 fw-bold text-primary">{leads.total}</div>
            </div>
            <div className="col-md-2">
              <div className="text-muted small">Total Value</div>
              <div className="fs-4 fw-bold text-success">
                {leads.total_value.toLocaleString()}
              </div>
            </div>
            <div className="col-md-2">
              <div className="text-muted small">Avg Value</div>
              <div className="fs-4 fw-bold">
                {(leads.avg_value || 0).toLocaleString()}
              </div>
            </div>
            <div className="col-md-2">
              <div className="text-muted small">Converted</div>
              <div className="fs-4 fw-bold text-info">
                {leads.converted_count || 0}
              </div>
            </div>
            <div className="col-md-2">
              <div className="text-muted small">Conversion Rate</div>
              <div className="fs-4 fw-bold text-warning">
                {(leads.conversion_rate || 0).toFixed(1)}%
              </div>
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-outline-primary btn-sm mt-2"
                onClick={() => navigate("/crm/pipeline")}
              >
                View Pipeline
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Status Breakdown */}
      <div className="col-md-6">
        <div className="card-box">
          <h5 className="fw-bold mb-3">Leads by Status</h5>
          <div className="table-responsive">
            <table className="table table-sm mb-0">
              <tbody>
                {Object.entries(leads.by_status || {}).map(([status, count]) => (
                  <tr key={status}>
                    <td className="fw-semibold">{status}</td>
                    <td className="text-end">
                      <span className="badge bg-primary">{count as number}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {Object.keys(leads.by_status || {}).length === 0 && (
            <div className="text-center text-muted py-3">No leads yet</div>
          )}
        </div>
      </div>

      {/* Activity Statistics */}
      <div className="col-md-6">
        <div className="card-box">
          <h5 className="fw-bold mb-3">Activity Statistics</h5>
          <div className="row text-center mb-3">
            <div className="col-4">
              <div className="text-muted small">Total</div>
              <div className="fs-5 fw-bold">{activities.total || 0}</div>
            </div>
            <div className="col-4">
              <div className="text-muted small">Completed</div>
              <div className="fs-5 fw-bold text-success">
                {activities.completed || 0}
              </div>
            </div>
            <div className="col-4">
              <div className="text-muted small">Pending</div>
              <div className="fs-5 fw-bold text-warning">
                {activities.pending || 0}
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-sm mb-0">
              <thead className="table-light">
                <tr>
                  <th>Type</th>
                  <th className="text-end">Count</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(activities.by_type || {}).map(([type, count]) => (
                  <tr key={type}>
                    <td className="fw-semibold">{type}</td>
                    <td className="text-end">{count as number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="col-12">
        <div className="card-box">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">Recent Leads</h5>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => navigate("/crm/leads")}
            >
              View All
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Lead Code</th>
                  <th>Lead Name</th>
                  <th>Contact Person</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      No leads yet. Create your first lead!
                    </td>
                  </tr>
                ) : (
                  recentLeads.map((lead) => (
                    <tr key={lead.lead_id}>
                      <td className="fw-bold">{lead.lead_code}</td>
                      <td>{lead.lead_name}</td>
                      <td>{lead.contact_person || "—"}</td>
                      <td>{lead.email || "—"}</td>
                      <td>{lead.phone || "—"}</td>
                      <td>
                        <span
                          className={`badge bg-${
                            lead.status === "NEW"
                              ? "primary"
                              : lead.status === "CONTACTED"
                              ? "info"
                              : lead.status === "QUALIFIED"
                              ? "warning"
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
                          ? lead.estimated_value.toLocaleString()
                          : "—"}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => navigate(`/crm/leads/${lead.lead_id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="col-12">
        <div className="card-box">
          <h5 className="fw-bold mb-3">Quick Actions</h5>
          <div className="row">
            <div className="col-md-3">
              <button
                className="btn btn-outline-primary w-100"
                onClick={() => navigate("/crm/leads/create")}
              >
                📝 Create Lead
              </button>
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-outline-primary w-100"
                onClick={() => navigate("/crm/activities/create")}
              >
                📅 Add Activity
              </button>
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-outline-primary w-100"
                onClick={() => navigate("/crm/leads")}
              >
                📋 View All Leads
              </button>
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-outline-primary w-100"
                onClick={() => navigate("/crm/activities")}
              >
                ✅ View Activities
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}