// src/pages/purchase/PurchaseOrderDetail.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { fetchPurchaseOrder, approvePurchaseOrder } from "../../api/purchase";

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: po, isLoading, error } = useQuery({
    queryKey: ["purchase-order", id],
    queryFn: () => fetchPurchaseOrder(Number(id)),
  });

  const approveMutation = useMutation({
    mutationFn: () => approvePurchaseOrder(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      alert("Purchase Order approved successfully!");
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="alert alert-danger">
        Purchase Order not found.{" "}
        <button className="btn btn-link p-0" onClick={() => navigate("/purchase/orders")}>
          Back to list
        </button>
      </div>
    );
  }

  const lines = po.lines || [];
  const total = lines.reduce((sum: number, line: any) => {
    return sum + (line.quantity * line.unit_price - (line.discount_amount || 0));
  }, 0);

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold mb-1">{po.po_number}</h2>
              <span
                className={`badge bg-${
                  po.status === "DRAFT" ? "secondary"
                  : po.status === "CONFIRMED" ? "primary"
                  : po.status === "POSTED" ? "success"
                  : po.status === "CANCELLED" ? "danger"
                  : "warning"
                }`}
              >
                {po.status}
              </span>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary"
                onClick={() => navigate("/purchase/orders")}
              >
                ← Back to List
              </button>
              {(po.status === "DRAFT") && (
                <button
                  className="btn btn-success"
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? "Approving..." : "✓ Approve PO"}
                </button>
              )}
              {(po.status === "CONFIRMED" || po.status === "POSTED") && (
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/purchase/receipts")}
                >
                  Create GRN
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PO Info */}
      <div className="col-md-6">
        <div className="card-box h-100">
          <h5 className="fw-bold mb-3">Order Details</h5>
          <table className="table table-borderless">
            <tbody>
              <tr>
                <td className="text-muted">Supplier</td>
                <td className="fw-bold">{po.supplier_name || `Supplier #${po.supplier_key}`}</td>
              </tr>
              <tr>
                <td className="text-muted">Order Date</td>
                <td>{po.order_date ? new Date(po.order_date).toLocaleDateString() : "-"}</td>
              </tr>
              <tr>
                <td className="text-muted">Expected Date</td>
                <td>{po.expected_date ? new Date(po.expected_date).toLocaleDateString() : "-"}</td>
              </tr>
              <tr>
                <td className="text-muted">Status</td>
                <td>{po.status}</td>
              </tr>
              {po.remarks && (
                <tr>
                  <td className="text-muted">Remarks</td>
                  <td>{po.remarks}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card-box h-100">
          <h5 className="fw-bold mb-3">Summary</h5>
          <table className="table table-borderless">
            <tbody>
              <tr>
                <td className="text-muted">Total Lines</td>
                <td className="fw-bold">{lines.length}</td>
              </tr>
              <tr>
                <td className="text-muted">Total Amount</td>
                <td className="fw-bold fs-5 text-primary">
                  {total.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Line Items */}
      <div className="col-12">
        <div className="card-box">
          <h5 className="fw-bold mb-3">Line Items</h5>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Description</th>
                  <th className="text-end">Quantity</th>
                  <th className="text-end">Unit Price</th>
                  <th className="text-end">Discount</th>
                  <th className="text-end">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      No line items found
                    </td>
                  </tr>
                ) : (
                  lines.map((line: any, idx: number) => {
                    const lineTotal = line.quantity * line.unit_price - (line.discount_amount || 0);
                    return (
                      <tr key={line.po_line_id || idx}>
                        <td>{line.line_no || idx + 1}</td>
                        <td className="fw-bold">
                          {line.item_code || `Item #${line.item_key}`}
                          {line.item_name && (
                            <div className="text-muted small">{line.item_name}</div>
                          )}
                        </td>
                        <td>{line.description || "-"}</td>
                        <td className="text-end">{line.quantity}</td>
                        <td className="text-end">${Number(line.unit_price).toFixed(2)}</td>
                        <td className="text-end">
                          {line.discount_amount ? `$${Number(line.discount_amount).toFixed(2)}` : "-"}
                        </td>
                        <td className="text-end fw-bold">${lineTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="table-light">
                  <td colSpan={6} className="text-end fw-bold">Total</td>
                  <td className="text-end fw-bold text-primary fs-6">
                    ${total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}