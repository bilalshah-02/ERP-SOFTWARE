// src/pages/production/BOMView.tsx - VIEW ALL GENERATED BOMS
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchBOMs } from "../../api/production";
import { useState } from "react";

export default function BOMView() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["boms"],
    queryFn: fetchBOMs,
  });

  const boms = data || [];  // ✅ data is already the array!

  // Filter BOMs
  const filteredBOMs = boms.filter((bom: any) =>
    bom.bom_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bom.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separate auto-generated (recipes) from manual BOMs
  const recipeBOMs = filteredBOMs.filter((bom: any) => 
    bom.bom_code?.includes("-RECIPE")
  );
  const manualBOMs = filteredBOMs.filter((bom: any) => 
    !bom.bom_code?.includes("-RECIPE")
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
              <h2 className="fw-bold mb-1">📋 Bill of Materials (All BOMs)</h2>
              <div className="text-muted">View all BOMs including auto-generated recipes</div>
            </div>
            <button className="btn btn-outline-secondary" onClick={() => navigate("/")}>
              ← Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="col-12">
        <div className="alert alert-info">
          <strong>ℹ️ About BOMs:</strong>
          <ul className="mb-0 mt-2">
            <li><strong>Recipe BOMs:</strong> Auto-generated when you create manufactured products (code ends with -RECIPE)</li>
            <li><strong>Manual BOMs:</strong> Created manually (not recommended - use recipes instead!)</li>
            <li><strong>Active Status:</strong> Green = currently used in production, Gray = inactive</li>
          </ul>
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

      {/* Summary Cards */}
      <div className="col-md-3">
        <div className="card-box bg-primary text-white">
          <div className="small opacity-75">Total BOMs</div>
          <div className="fs-3 fw-bold">{filteredBOMs.length}</div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card-box bg-success text-white">
          <div className="small opacity-75">Recipe BOMs (Auto)</div>
          <div className="fs-3 fw-bold">{recipeBOMs.length}</div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card-box bg-warning text-white">
          <div className="small opacity-75">Manual BOMs</div>
          <div className="fs-3 fw-bold">{manualBOMs.length}</div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card-box bg-info text-white">
          <div className="small opacity-75">Active BOMs</div>
          <div className="fs-3 fw-bold">
            {filteredBOMs.filter((b: any) => b.is_active).length}
          </div>
        </div>
      </div>

      {/* Recipe BOMs Table */}
      <div className="col-12">
        <div className="card-box">
          <h5 className="mb-3">📋 Recipe BOMs (Auto-Generated from Products)</h5>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>BOM Code</th>
                  <th>Product</th>
                  <th>Qty Produced</th>
                  <th>Components</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recipeBOMs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      No recipe BOMs yet. Create manufactured products to generate recipes automatically!
                    </td>
                  </tr>
                ) : (
                  recipeBOMs.map((bom: any) => (
                    <tr key={bom.bom_id}>
                      <td className="fw-bold">
                        {bom.bom_code}
                        <span className="badge bg-success ms-2" title="Auto-generated from recipe">
                          AUTO
                        </span>
                      </td>
                      <td>{bom.product_name || `Product #${bom.product_key}`}</td>
                      <td>{bom.quantity_produced}</td>
                      <td>
                        <span className="badge bg-primary">
                          {bom.lines?.length || 0} items
                        </span>
                      </td>
                      <td>
                        <span className={`badge bg-${bom.is_active ? "success" : "secondary"}`}>
                          {bom.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="text-muted small">
                        {bom.created_at ? new Date(bom.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navigate(`/production/boms/${bom.bom_id}`)}
                            title="View Details"
                          >
                            👁️ View
                          </button>
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => {
                              const productId = bom.product_key || bom.parent_item_key;
                              if (productId) {
                                navigate(`/inventory/items/${productId}/recipe`);
                              }
                            }}
                            title="View Recipe"
                          >
                            📋 Recipe
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual BOMs Table */}
      {manualBOMs.length > 0 && (
        <div className="col-12">
          <div className="card-box">
            <h5 className="mb-3">🔧 Manual BOMs (Created Manually)</h5>
            <div className="alert alert-warning">
              <strong>⚠️ Note:</strong> These BOMs were created manually. Consider converting them to recipes for better management!
            </div>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>BOM Code</th>
                    <th>Product</th>
                    <th>Qty Produced</th>
                    <th>Components</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {manualBOMs.map((bom: any) => (
                    <tr key={bom.bom_id}>
                      <td className="fw-bold">{bom.bom_code}</td>
                      <td>{bom.product_name || `Product #${bom.product_key}`}</td>
                      <td>{bom.quantity_produced}</td>
                      <td>{bom.lines?.length || 0} items</td>
                      <td>
                        <span className={`badge bg-${bom.is_active ? "success" : "secondary"}`}>
                          {bom.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => navigate(`/production/boms/${bom.bom_id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Help */}
      <div className="col-12">
        <div className="card-box bg-light">
          <h6 className="fw-bold mb-2">💡 Understanding BOMs:</h6>
          <div className="row">
            <div className="col-md-6">
              <h6 className="text-success">✅ Recipe BOMs (Recommended)</h6>
              <ul className="small">
                <li>Auto-generated when creating manufactured products</li>
                <li>BOM code ends with "-RECIPE"</li>
                <li>Easier to manage through product recipes</li>
                <li>Automatically used in production orders</li>
              </ul>
            </div>
            <div className="col-md-6">
              <h6 className="text-warning">⚠️ Manual BOMs (Legacy)</h6>
              <ul className="small">
                <li>Created manually through BOM creation page</li>
                <li>Custom BOM codes</li>
                <li>More complex to manage</li>
                <li>Requires manual selection in production</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}