// src/pages/crm/LeadPipeline.tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchPipeline } from "../../api/crm";

export default function LeadPipeline() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["lead-pipeline"],
    queryFn: fetchPipeline,
  });

  const pipeline = data?.pipeline || [];

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
              <h2 className="fw-bold mb-1">Sales Pipeline</h2>
              <div className="text-muted">Track leads through your sales process</div>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-primary"
                onClick={() => navigate("/crm/leads/create")}
              >
                + Create Lead
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => navigate("/crm/leads")}
              >
                List View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Kanban */}
      <div className="col-12">
        <div className="row g-3" style={{ overflowX: "auto" }}>
          {pipeline.length === 0 ? (
            <div className="col-12">
              <div className="card-box text-center py-5">
                <h5 className="text-muted">No leads in pipeline</h5>
                <button
                  className="btn btn-primary mt-3"
                  onClick={() => navigate("/crm/leads/create")}
                >
                  Create your first lead
                </button>
              </div>
            </div>
          ) : (
            pipeline.map((stage: any) => (
              <div
                key={stage.stage}
                className="col-md-4 col-lg-3"
                style={{ minWidth: "280px" }}
              >
                <div className="card-box h-100">
                  {/* Stage Header */}
                  <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                    <div>
                      <h6 className="fw-bold mb-0">{stage.stage}</h6>
                      <small className="text-muted">
                        {stage.count} lead{stage.count !== 1 ? "s" : ""}
                      </small>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-success">
                        {stage.total_value.toLocaleString()}
                      </div>
                      <small className="text-muted">Total Value</small>
                    </div>
                  </div>

                  {/* Lead Cards */}
                  <div
                    style={{
                      maxHeight: "600px",
                      overflowY: "auto",
                    }}
                  >
                    {stage.leads.map((lead: any) => (
                      <div
                        key={lead.lead_id}
                        className="card mb-2"
                        style={{
                          border: "1px solid #dee2e6",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onClick={() => navigate(`/crm/leads/${lead.lead_id}`)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow =
                            "0 2px 8px rgba(0,0,0,0.1)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = "none";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <div className="card-body p-3">
                          <h6 className="fw-bold mb-2 text-truncate">
                            {lead.lead_name}
                          </h6>
                          <div className="small text-muted mb-2 text-truncate">
                            {lead.lead_code}
                          </div>
                          {lead.estimated_value && (
                            <div className="fw-bold text-success">
                              {lead.estimated_value.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {stage.leads.length === 0 && (
                      <div className="text-center text-muted py-3">
                        <small>No leads in this stage</small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pipeline Summary */}
      {pipeline.length > 0 && (
        <div className="col-12">
          <div className="card-box">
            <h5 className="fw-bold mb-3">Pipeline Summary</h5>
            <div className="row text-center">
              {pipeline.map((stage: any) => (
                <div key={stage.stage} className="col-md-2">
                  <div className="text-muted small">{stage.stage}</div>
                  <div className="fs-5 fw-bold">{stage.count}</div>
                  <div className="small text-success">
                    {stage.total_value.toLocaleString()}
                  </div>
                </div>
              ))}
              <div className="col-md-2">
                <div className="text-muted small">TOTAL</div>
                <div className="fs-5 fw-bold">
                  {pipeline.reduce((sum: number, s: any) => sum + s.count, 0)}
                </div>
                <div className="small text-success fw-bold">
                  {pipeline
                    .reduce((sum: number, s: any) => sum + s.total_value, 0)
                    .toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}