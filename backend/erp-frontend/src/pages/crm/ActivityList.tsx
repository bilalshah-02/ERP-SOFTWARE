// src/pages/crm/ActivityList.tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchActivities } from "../../api/crm";
import { useState } from "react";

export default function ActivityList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities", typeFilter, statusFilter],
    queryFn: () =>
      fetchActivities({
        activity_type: typeFilter || undefined,
        completed: statusFilter === "completed" ? true : statusFilter === "pending" ? false : undefined,
      }),
  });

  // Filter activities based on search
  const filteredActivities = activities.filter((activity: any) =>
    activity.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.party_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <h2 className="fw-bold mb-1">Activities</h2>
              <div className="text-muted">Manage your sales activities</div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/crm/activities/create")}
            >
              + Add Activity
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
                placeholder="Search by subject, lead, or party..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="CALL">Call</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">Meeting</option>
                <option value="TASK">Task</option>
                <option value="NOTE">Note</option>
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Activities Table */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Subject</th>
                  <th>Lead</th>
                  <th>Party</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      {searchTerm || typeFilter || statusFilter
                        ? "No activities match your filters"
                        : "No activities yet. Add your first activity!"}
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((activity: any) => (
                    <tr key={activity.activity_id}>
                      <td>
                        <span
                          className={`badge bg-${
                            activity.activity_type === "CALL"
                              ? "primary"
                              : activity.activity_type === "EMAIL"
                              ? "info"
                              : activity.activity_type === "MEETING"
                              ? "warning"
                              : activity.activity_type === "TASK"
                              ? "secondary"
                              : "dark"
                          }`}
                        >
                          {activity.activity_type}
                        </span>
                      </td>
                      <td className="fw-semibold">{activity.subject}</td>
                      <td>
                        {activity.lead_name ? (
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/crm/leads/${activity.lead_id}`);
                            }}
                            className="text-decoration-none"
                          >
                            {activity.lead_name}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{activity.party_name || "—"}</td>
                      <td>
                        {activity.due_at
                          ? new Date(activity.due_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        {activity.completed_at ? (
                          <span className="badge bg-success">
                            Completed
                            <br />
                            <small>
                              {new Date(activity.completed_at).toLocaleDateString()}
                            </small>
                          </span>
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

          {/* Summary */}
          {filteredActivities.length > 0 && (
            <div className="mt-3 pt-3 border-top">
              <div className="row text-center">
                <div className="col-md-2">
                  <div className="text-muted small">Total</div>
                  <div className="fs-5 fw-bold">{filteredActivities.length}</div>
                </div>
                <div className="col-md-2">
                  <div className="text-muted small">Calls</div>
                  <div className="fs-5 fw-bold text-primary">
                    {
                      filteredActivities.filter((a: any) => a.activity_type === "CALL")
                        .length
                    }
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="text-muted small">Emails</div>
                  <div className="fs-5 fw-bold text-info">
                    {
                      filteredActivities.filter((a: any) => a.activity_type === "EMAIL")
                        .length
                    }
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="text-muted small">Meetings</div>
                  <div className="fs-5 fw-bold text-warning">
                    {
                      filteredActivities.filter(
                        (a: any) => a.activity_type === "MEETING"
                      ).length
                    }
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="text-muted small">Completed</div>
                  <div className="fs-5 fw-bold text-success">
                    {filteredActivities.filter((a: any) => a.completed_at).length}
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="text-muted small">Pending</div>
                  <div className="fs-5 fw-bold text-danger">
                    {filteredActivities.filter((a: any) => !a.completed_at).length}
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