// src/pages/production/ProductionBatchList.tsx - REDESIGNED
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchProductionBatches } from "../../api/production";
import { formatQuantity } from '../../utils/production';
import { useState } from "react";

export default function ProductionBatchList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: batches = [], isLoading, error } = useQuery({
    queryKey: ["production-batches"],
    queryFn: fetchProductionBatches,
  });

  // Apply filters
  const filteredBatches = batches.filter((batch) => {
    const matchesSearch = 
      batch.batch_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.bom_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || batch.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-2 text-muted">Loading batches...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <strong>Error loading batches:</strong> {(error as Error).message}
      </div>
    );
  }

  const stats = {
    total: batches.length,
    draft: batches.filter(b => b.status === 'DRAFT').length,
    in_progress: batches.filter(b => b.status === 'IN_PROGRESS').length,
    completed: batches.filter(b => b.status === 'COMPLETED').length,
  };

  return (
    <div className="container-fluid py-4">
      <div className="row g-4">
        {/* Header */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="card-title mb-1">🏭 Production Orders</h2>
                  <p className="text-muted mb-0">Manage manufacturing batches</p>
                </div>
                <button
                  className="btn btn-success"
                  onClick={() => navigate("/production/batches/create")}
                >
                  + Create Production Order
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="🔍 Search by batch number, product, or BOM..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Statuses ({stats.total})</option>
                    <option value="DRAFT">Draft ({stats.draft})</option>
                    <option value="IN_PROGRESS">In Progress ({stats.in_progress})</option>
                    <option value="COMPLETED">Completed ({stats.completed})</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Batches Table */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              {filteredBatches.length === 0 ? (
                <div className="text-center py-5">
                  <div className="fs-1 mb-3">📦</div>
                  <h5 className="text-muted">
                    {searchTerm || statusFilter !== "ALL" 
                      ? "No batches match your filters" 
                      : "No production batches yet"}
                  </h5>
                  {!searchTerm && statusFilter === "ALL" && (
                    <button
                      className="btn btn-primary mt-3"
                      onClick={() => navigate("/production/batches/create")}
                    >
                      Create Your First Production Order
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Batch Number</th>
                        <th>Product</th>
                        <th>BOM</th>
                        <th className="text-end">Planned Qty</th>
                        <th className="text-end">Actual Qty</th>
                        <th>Start Date</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBatches.map((batch) => (
                        <tr key={batch.batch_id}>
                          <td>
                            <strong>{batch.batch_number}</strong>
                          </td>
                          <td>{batch.product_name}</td>
                          <td>
                            <span className="badge bg-secondary">{batch.bom_code}</span>
                          </td>
                          <td className="text-end">
                            {formatQuantity(batch.planned_quantity, 2)}
                          </td>
                          <td className="text-end">
                            {batch.actual_quantity 
  ? formatQuantity(batch.actual_quantity, 2)
  : '-'}
                          </td>
                          <td>
                            {batch.start_date
                              ? new Date(batch.start_date).toLocaleDateString()
                              : '-'}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                batch.status === "DRAFT"
                                  ? "bg-secondary"
                                  : batch.status === "IN_PROGRESS"
                                  ? "bg-warning text-dark"
                                  : batch.status === "COMPLETED"
                                  ? "bg-success"
                                  : "bg-info"
                              }`}
                            >
                              {batch.status}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => navigate(`/production/batches/${batch.batch_id}`)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Summary */}
              {filteredBatches.length > 0 && (
                <div className="border-top pt-3 mt-3">
                  <div className="row text-center">
                    <div className="col-md-3">
                      <div className="fs-4 fw-bold text-primary">{stats.total}</div>
                      <div className="small text-muted">Total Batches</div>
                    </div>
                    <div className="col-md-3">
                      <div className="fs-4 fw-bold text-secondary">{stats.draft}</div>
                      <div className="small text-muted">Draft</div>
                    </div>
                    <div className="col-md-3">
                      <div className="fs-4 fw-bold text-warning">{stats.in_progress}</div>
                      <div className="small text-muted">In Progress</div>
                    </div>
                    <div className="col-md-3">
                      <div className="fs-4 fw-bold text-success">{stats.completed}</div>
                      <div className="small text-muted">Completed</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="col-12">
          <div className="card shadow-sm bg-light">
            <div className="card-body">
              <h6 className="mb-2">💡 <strong>Quick Guide:</strong></h6>
              <div className="row">
                <div className="col-md-4">
                  <strong>DRAFT:</strong> Batch created, ready for material issue
                </div>
                <div className="col-md-4">
                  <strong>IN_PROGRESS:</strong> Materials issued, production ongoing
                </div>
                <div className="col-md-4">
                  <strong>COMPLETED:</strong> Finished goods received
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}