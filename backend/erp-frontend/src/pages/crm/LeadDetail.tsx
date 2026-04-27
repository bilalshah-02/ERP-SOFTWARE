// src/pages/crm/LeadDetail.tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { fetchLead, fetchLeadActivities } from "../../api/crm";

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: lead, isLoading: leadLoading } = useQuery({
    queryKey: ["lead", id],
    queryFn: () => fetchLead(Number(id)),
    enabled: !!id,
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ["lead-activities", id],
    queryFn: () => fetchLeadActivities(Number(id)),
    enabled: !!id,
  });

  if (leadLoading || activitiesLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="card-box text-center py-5">
        <h5>Lead not found</h5>
        <button className="btn btn-primary mt-3" onClick={() => navigate("/crm/leads")}>
          Back to Leads
        </button>
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
              <h2 className="fw-bold mb-1">{lead.lead_name}</h2>
              <div className="text-muted">{lead.lead_code}</div>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-primary"
                onClick={() => navigate(`/crm/leads/${id}/edit`)}
              >
                Edit Lead
              </button>
              {!lead.customer_party_key && (
                <button
                  className="btn btn-success"
                  onClick={() => navigate(`/crm/leads/${id}/convert`)}
                >
                  Convert to Customer
                </button>
              )}
              <button
                className="btn btn-outline-secondary"
                onClick={() => navigate("/crm/leads")}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Information */}
      <div className="col-md-6">
        <div className="card-box">
          <h5 className="fw-bold mb-3">Lead Information</h5>
          <table className="table table-sm">
            <tbody>
              <tr>
                <th style={{ width: "40%" }}>Lead Code</th>
                <td>{lead.lead_code}</td>
              </tr>
              <tr>
                <th>Lead Name</th>
                <td className="fw-semibold">{lead.lead_name}</td>
              </tr>
              <tr>
                <th>Contact Person</th>
                <td>{lead.contact_person || "—"}</td>
              </tr>
              <tr>
                <th>Email</th>
                <td>{lead.email || "—"}</td>
              </tr>
              <tr>
                <th>Phone</th>
                <td>{lead.phone || "—"}</td>
              </tr>
              <tr>
                <th>Source</th>
                <td>{lead.source || "—"}</td>
              </tr>
              <tr>
                <th>Status</th>
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
              </tr>
              <tr>
                <th>Estimated Value</th>
                <td>
                  {lead.estimated_value
                    ? `${lead.currency_code || ""} ${lead.estimated_value.toLocaleString()}`
                    : "—"}
                </td>
              </tr>
              <tr>
                <th>Created At</th>
                <td>
                  {lead.created_at
                    ? new Date(lead.created_at).toLocaleString()
                    : "—"}
                </td>
              </tr>
              {lead.customer_party_key && (
                <tr>
                  <th>Converted to Customer</th>
                  <td className="text-success fw-semibold">
                    ✓ {lead.customer_name || `Customer #${lead.customer_party_key}`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="col-md-6">
        <div className="card-box">
          <h5 className="fw-bold mb-3">Activity Summary</h5>
          <div className="row text-center mb-3">
            <div className="col-4">
              <div className="text-muted small">Total</div>
              <div className="fs-4 fw-bold">{activities.length}</div>
            </div>
            <div className="col-4">
              <div className="text-muted small">Completed</div>
              <div className="fs-4 fw-bold text-success">
                {activities.filter((a: any) => a.completed_at).length}
              </div>
            </div>
            <div className="col-4">
              <div className="text-muted small">Pending</div>
              <div className="fs-4 fw-bold text-warning">
                {activities.filter((a: any) => !a.completed_at).length}
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary w-100"
            onClick={() =>
              navigate("/crm/activities/create", { state: { leadId: id } })
            }
          >
            + Add Activity
          </button>
        </div>
      </div>

      {/* Activities */}
      <div className="col-12">
        <div className="card-box">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">Activities</h5>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Subject</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      No activities yet. Add your first activity!
                    </td>
                  </tr>
                ) : (
                  activities.map((activity: any) => (
                    <tr key={activity.activity_id}>
                      <td>
                        <span className="badge bg-secondary">
                          {activity.activity_type}
                        </span>
                      </td>
                      <td className="fw-semibold">{activity.subject}</td>
                      <td>
                        {activity.due_at
                          ? new Date(activity.due_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        {activity.completed_at ? (
                          <span className="badge bg-success">Completed</span>
                        ) : (
                          <span className="badge bg-warning">Pending</span>
                        )}
                      </td>
                      <td>
                        {new Date(activity.created_at!).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}