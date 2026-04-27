// src/pages/production/ProductionDashboard.tsx - REDESIGNED
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchProductionDashboard } from "../../api/production";

export default function ProductionDashboard() {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["production-dashboard"],
    queryFn: fetchProductionDashboard,
  });

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-2 text-muted">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <strong>Error loading dashboard:</strong> {(error as Error).message}
      </div>
    );
  }

  const bomStats = data?.boms || { total: 0, active: 0, inactive: 0 };
  const batchStats = data?.batches || { total: 0, draft: 0, in_progress: 0, completed: 0 };

  return (
    <div className="container-fluid py-4">
      <div className="row g-4">
        {/* Header */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title mb-1">🏭 Production Module</h2>
              <p className="text-muted mb-0">Manufacturing management and tracking</p>
            </div>
          </div>
        </div>

        {/* BOM Statistics */}
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">📋 Product Recipes (BOMs)</h5>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => navigate("/production/boms/view")}
                >
                  View All
                </button>
              </div>

              <div className="row g-3">
                <div className="col-4">
                  <div className="text-center p-3 bg-light rounded">
                    <div className="fs-2 fw-bold text-primary">{bomStats.total}</div>
                    <div className="small text-muted">Total</div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="text-center p-3 bg-light rounded">
                    <div className="fs-2 fw-bold text-success">{bomStats.active}</div>
                    <div className="small text-muted">Active</div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="text-center p-3 bg-light rounded">
                    <div className="fs-2 fw-bold text-secondary">{bomStats.inactive}</div>
                    <div className="small text-muted">Inactive</div>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-outline-primary w-100 mt-3"
                onClick={() => navigate("/inventory/items/create")}
              >
                + Create Product with Recipe
              </button>
            </div>
          </div>
        </div>

        {/* Production Batch Statistics */}
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">🏭 Production Orders</h5>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => navigate("/production/batches")}
                >
                  View All
                </button>
              </div>

              <div className="row g-3">
                <div className="col-3">
                  <div className="text-center p-3 bg-light rounded">
                    <div className="fs-2 fw-bold text-primary">{batchStats.total}</div>
                    <div className="small text-muted">Total</div>
                  </div>
                </div>
                <div className="col-3">
                  <div className="text-center p-3 bg-light rounded">
                    <div className="fs-2 fw-bold text-secondary">{batchStats.draft}</div>
                    <div className="small text-muted">Draft</div>
                  </div>
                </div>
                <div className="col-3">
                  <div className="text-center p-3 bg-light rounded">
                    <div className="fs-2 fw-bold text-warning">{batchStats.in_progress}</div>
                    <div className="small text-muted">In Progress</div>
                  </div>
                </div>
                <div className="col-3">
                  <div className="text-center p-3 bg-light rounded">
                    <div className="fs-2 fw-bold text-success">{batchStats.completed}</div>
                    <div className="small text-muted">Completed</div>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-success w-100 mt-3"
                onClick={() => navigate("/production/batches/create")}
              >
                + Create Production Order
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">⚡ Quick Actions</h5>
              <div className="row g-3">
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-primary w-100 py-3"
                    onClick={() => navigate("/inventory/items/create")}
                  >
                    <div className="fs-3 mb-2">📦</div>
                    <div className="fw-semibold">Create Product</div>
                    <small className="text-muted d-block">Add recipe inline</small>
                  </button>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-info w-100 py-3"
                    onClick={() => navigate("/production/batches/create")}
                  >
                    <div className="fs-3 mb-2">🏭</div>
                    <div className="fw-semibold">Start Production</div>
                    <small className="text-muted d-block">Create batch</small>
                  </button>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-warning w-100 py-3"
                    onClick={() => navigate("/production/material-issue")}
                  >
                    <div className="fs-3 mb-2">📤</div>
                    <div className="fw-semibold">Issue Materials</div>
                    <small className="text-muted d-block">Send to WIP</small>
                  </button>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-success w-100 py-3"
                    onClick={() => navigate("/production/completion")}
                  >
                    <div className="fs-3 mb-2">✅</div>
                    <div className="fw-semibold">Complete Production</div>
                    <small className="text-muted d-block">Receive goods</small>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Guide */}
        <div className="col-12">
          <div className="card shadow-sm bg-light">
            <div className="card-body">
              <h5 className="card-title mb-3">📊 Production Workflow</h5>
              <div className="row">
                <div className="col-md-3 text-center">
                  <div className="fs-1 mb-2">1️⃣</div>
                  <div className="fw-bold">Create Product</div>
                  <small className="text-muted">Add recipe with raw materials</small>
                </div>
                <div className="col-md-3 text-center">
                  <div className="fs-1 mb-2">2️⃣</div>
                  <div className="fw-bold">Start Production</div>
                  <small className="text-muted">Create batch (DRAFT status)</small>
                </div>
                <div className="col-md-3 text-center">
                  <div className="fs-1 mb-2">3️⃣</div>
                  <div className="fw-bold">Issue Materials</div>
                  <small className="text-muted">Consume inventory (IN_PROGRESS)</small>
                </div>
                <div className="col-md-3 text-center">
                  <div className="fs-1 mb-2">4️⃣</div>
                  <div className="fw-bold">Complete</div>
                  <small className="text-muted">Receive finished goods (COMPLETED)</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}