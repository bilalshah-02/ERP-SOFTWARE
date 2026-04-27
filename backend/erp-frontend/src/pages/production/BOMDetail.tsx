// src/pages/production/BOMDetail.tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { fetchBOM } from "../../api/production";
import { formatQuantity } from '../../utils/production';
export default function BOMDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data: bom, isLoading } = useQuery({
    queryKey: ["bom", id],
    queryFn: () => fetchBOM(Number(id)),
    enabled: !!id,
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

  if (!bom) {
    return (
      <div className="alert alert-danger">BOM not found</div>
    );
  }

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box d-flex align-items-center justify-content-between">
          <div>
            <h2 className="fw-bold mb-1">BOM: {bom.bom_code}</h2>
            <div className="text-muted">Bill of Materials Details</div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" onClick={() => navigate("/production/boms")}>
              ← Back to List
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/production/batches/create?bom_id=${bom.bom_id}`)}
            >
              Start Production
            </button>
          </div>
        </div>
      </div>

      {/* BOM Info */}
      <div className="col-md-6">
        <div className="card-box">
          <h5 className="mb-3">BOM Information</h5>
          <table className="table table-sm">
            <tbody>
              <tr>
                <th style={{ width: "40%" }}>BOM Code:</th>
                <td>{bom.bom_code}</td>
              </tr>
              <tr>
                <th>Product:</th>
                <td>{bom.product_name || `Product #${bom.product_key}`}</td>
              </tr>
              <tr>
                <th>Quantity Produced:</th>
                <td className="fw-bold">{bom.quantity_produced}</td>
              </tr>
              <tr>
                <th>Status:</th>
                <td>
                  <span className={`badge bg-${bom.is_active ? 'success' : 'secondary'}`}>
                    {bom.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
              <tr>
                <th>Created:</th>
                <td>{bom.created_at ? new Date(bom.created_at).toLocaleDateString() : 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Components */}
      <div className="col-12">
        <div className="card-box">
          <h5 className="mb-3">Components Required</h5>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Item Code</th>
                  <th className="text-end">Quantity Required</th>
                  <th>UOM</th>
                </tr>
              </thead>
              <tbody>
                {bom.lines && bom.lines.length > 0 ? (
                  bom.lines.map((line: any, index: number) => (
                    <tr key={index}>
                      <td className="fw-semibold">{line.item_name || `Item #${line.item_key}`}</td>
                      <td>{line.item_code || 'N/A'}</td>
                      <td className="text-end fw-bold">{formatQuantity(line.quantity, 3)}</td>
                      <td>{line.uom || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      No components defined
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {bom.lines && bom.lines.length > 0 && (
            <div className="alert alert-info mt-3">
              <strong>Production Formula:</strong> To produce {bom.quantity_produced} unit(s) of {bom.product_name}, you need:
              <ul className="mb-0 mt-2">
                {bom.lines.map((line: any, idx: number) => (
                  <li key={idx}>
                    {formatQuantity(line.quantity, 3)} {line.uom || 'units'} of {line.item_name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}