// src/pages/production/BOMList.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchBOMs, deactivateBOM, activateBOM } from "../../api/production";
import { useState } from "react";

export default function BOMList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Handle new response structure
  const { data, isLoading } = useQuery({
    queryKey: ["boms"],
    queryFn: fetchBOMs,
  });

  // ✅ Extract BOMs array
  const boms = data || [];  // ✅ data is already the array!

  const deactivateMutation = useMutation({
    mutationFn: deactivateBOM,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boms"] });
      alert("BOM deactivated successfully!");
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    },
  });

  const activateMutation = useMutation({
    mutationFn: activateBOM,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boms"] });
      alert("BOM activated successfully!");
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    },
  });

  // Filter BOMs
  const filteredBOMs = boms.filter((bom: any) =>
    bom.bom_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bom.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
              <h2 className="fw-bold mb-1">Bill of Materials (BOM)</h2>
              <div className="text-muted">Product recipes and formulas</div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/production/boms/create")}
            >
              + Create BOM
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="col-12">
        <div className="card-box">
          <input
            type="text"
            className="form-control"
            placeholder="Search by BOM code or product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* BOMs Table */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>BOM Code</th>
                  <th>Product</th>
                  <th>Quantity Produced</th>
                  <th>Components</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBOMs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      {searchTerm ? "No BOMs match your search" : "No BOMs yet. Create your first BOM!"}
                    </td>
                  </tr>
                ) : (
                  filteredBOMs.map((bom: any) => (
                     <tr key={bom.bom_id || bom.bom_key}>
                      <td className="fw-bold">{bom.bom_code}</td>
                      <td>{bom.product_name || `Product #${bom.product_key}`}</td>
                      <td>{bom.quantity_produced}</td>
                      <td>{bom.lines?.length || 0} items</td>
                      <td>
                        <span
                          className={`badge bg-${
                            bom.is_active ? "success" : "secondary"
                          }`}
                        >
                          {bom.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-primary"
                           onClick={() => navigate(`/production/boms/${(bom as any).bom_id || (bom as any).bom_key}`)}
                          >
                            View
                          </button>
                          {bom.is_active ? (
                            <button
                              className="btn btn-sm btn-outline-warning"
                              onClick={() => deactivateMutation.mutate(bom.bom_id || bom.bom_key!)}
                              disabled={deactivateMutation.isPending}
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => activateMutation.mutate(bom.bom_id || bom.bom_key!)}
                              disabled={activateMutation.isPending}
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {filteredBOMs.length > 0 && (
            <div className="mt-3 pt-3 border-top">
              <div className="row text-center">
                <div className="col-md-4">
                  <div className="text-muted small">Total BOMs</div>
                  <div className="fs-5 fw-bold">{filteredBOMs.length}</div>
                </div>
                <div className="col-md-4">
                  <div className="text-muted small">Active</div>
                  <div className="fs-5 fw-bold text-success">
                    {filteredBOMs.filter((b: any) => b.is_active).length}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-muted small">Inactive</div>
                  <div className="fs-5 fw-bold text-secondary">
                    {filteredBOMs.filter((b: any) => !b.is_active).length}
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