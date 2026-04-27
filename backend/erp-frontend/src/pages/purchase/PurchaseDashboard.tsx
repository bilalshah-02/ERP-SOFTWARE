// src/pages/purchase/PurchaseDashboard.tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchPurchaseDashboard } from "../../api/purchase";

export default function PurchaseDashboard() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["purchase-dashboard"],
    queryFn: fetchPurchaseDashboard,
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

  const poStats = data?.purchase_orders || { total: 0, draft: 0, confirmed: 0, received: 0, cancelled: 0 };
  const invoiceStats = data?.invoices || { total: 0, draft: 0, posted: 0 };
  const paymentStats = data?.payments || { total: 0, total_amount: 0 };
  const totals = data?.totals || { confirmed_orders_value: 0, invoiced_value: 0 };

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box">
          <h2 className="fw-bold mb-1">Purchase Module Dashboard</h2>
          <div className="text-muted">Overview of purchase orders, invoices, and payments</div>
        </div>
      </div>

      {/* Purchase Orders */}
      <div className="col-12">
        <div className="card-box">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Purchase Orders</h5>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => navigate("/purchase/orders")}
            >
              View All POs
            </button>
          </div>

          <div className="row g-3">
            <div className="col-md-2">
              <div className="card-box bg-light">
                <div className="text-muted fw-semibold small">Total POs</div>
                <div className="fs-4 fw-bold">{poStats.total}</div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card-box bg-light">
                <div className="text-muted fw-semibold small">Draft</div>
                <div className="fs-4 fw-bold text-secondary">{poStats.draft}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card-box bg-light">
                <div className="text-muted fw-semibold small">Confirmed</div>
                <div className="fs-4 fw-bold text-primary">{poStats.confirmed}</div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card-box bg-light">
                <div className="text-muted fw-semibold small">Received</div>
                <div className="fs-4 fw-bold text-success">{poStats.received}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card-box bg-light">
                <div className="text-muted fw-semibold small">Cancelled</div>
                <div className="fs-4 fw-bold text-danger">{poStats.cancelled}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices & Payments */}
      <div className="col-md-6">
        <div className="card-box">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Vendor Invoices</h5>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => navigate("/purchase/invoices")}
            >
              View All
            </button>
          </div>

          <div className="row g-3">
            <div className="col-6">
              <div className="text-muted fw-semibold">Total Invoices</div>
              <div className="fs-3 fw-bold">{invoiceStats.total}</div>
            </div>
            <div className="col-6">
              <div className="text-muted fw-semibold">Total Amount</div>
              <div className="fs-3 fw-bold text-danger">
                {totals.invoiced_value.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>

          <button
            className="btn btn-outline-primary w-100 mt-3"
            onClick={() => navigate("/purchase/invoices/create")}
          >
            + Create Invoice
          </button>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card-box">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Vendor Payments</h5>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => navigate("/purchase/payments")}
            >
              View All
            </button>
          </div>

          <div className="row g-3">
            <div className="col-6">
              <div className="text-muted fw-semibold">Total Payments</div>
              <div className="fs-3 fw-bold">{paymentStats.total}</div>
            </div>
            <div className="col-6">
              <div className="text-muted fw-semibold">Total Paid</div>
              <div className="fs-3 fw-bold text-success">
                {paymentStats.total_amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>

          <button
            className="btn btn-outline-success w-100 mt-3"
            onClick={() => navigate("/purchase/payments/create")}
          >
            + Record Payment
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="col-12">
        <div className="card-box">
          <h5 className="mb-3">Quick Actions</h5>
          <div className="row g-3">
            <div className="col-md-3">
              <button
                className="btn btn-outline-primary w-100"
                onClick={() => navigate("/purchase/orders/create")}
              >
                📄 Create PO
              </button>
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-outline-info w-100"
                onClick={() => navigate("/purchase/receipts/create")}
              >
                📦 Create GRN
              </button>
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-outline-warning w-100"
                onClick={() => navigate("/purchase/invoices/create")}
              >
                📋 Create Invoice
              </button>
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-outline-success w-100"
                onClick={() => navigate("/purchase/payments/create")}
              >
                💰 Record Payment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding Summary */}
      <div className="col-12">
        <div className="card-box bg-danger bg-opacity-10">
          <h5 className="mb-3">Outstanding Payables</h5>
          <div className="row g-3">
            <div className="col-md-4">
              <div className="text-muted">Total Invoiced</div>
              <div className="fs-4 fw-bold text-danger">
                {totals.invoiced_value.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-muted">Total Paid</div>
              <div className="fs-4 fw-bold text-success">
                {paymentStats.total_amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-muted">Outstanding (AP)</div>
              <div className="fs-4 fw-bold text-warning">
                {(totals.invoiced_value - paymentStats.total_amount).toLocaleString(
                  undefined,
                  { minimumFractionDigits: 2 }
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}