// src/pages/sales/SalesDashboard.tsx - FIXED VERSION
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchSalesDashboard } from "../../api/sales";

export default function SalesDashboard() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["sales-dashboard"],
    queryFn: fetchSalesDashboard,
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

  const soStats = data?.sales_orders || { total: 0, by_status: {} };
  const invoiceStats = data?.invoices || { total: 0, total_amount: 0 };
  const receiptStats = data?.receipts || { total: 0, total_amount: 0 };

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box">
          <h2 className="fw-bold mb-1">Sales Module Dashboard</h2>
          <div className="text-muted">Overview of sales orders, invoices, and receipts</div>
        </div>
      </div>

      {/* Sales Orders */}
      <div className="col-12">
        <div className="card-box">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Sales Orders</h5>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => navigate("/sales/orders")}
            >
              View All SOs
            </button>
          </div>

          <div className="row g-3">
            <div className="col-md-3">
              <div className="card-box bg-light">
                <div className="text-muted fw-semibold small">Total SOs</div>
                <div className="fs-4 fw-bold">{soStats.total}</div>
              </div>
            </div>

            {Object.entries(soStats.by_status || {}).map(([status, count]) => (
              <div key={status} className="col-md-3">
                <div className="card-box bg-light">
                  <div className="text-muted fw-semibold small">{status}</div>
                  <div className="fs-4 fw-bold">
                    {count as number}
                  </div>
                </div>
              </div>
            ))}

            {Object.keys(soStats.by_status || {}).length === 0 && (
              <div className="col-12">
                <div className="text-muted text-center py-3">No sales orders yet</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="col-md-6">
        <div className="card-box">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Customer Invoices</h5>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => navigate("/sales/invoices")}
            >
              View All
            </button>
          </div>

          <div className="row g-3">
            <div className="col-6">
              <div className="text-muted fw-semibold">Total Invoices</div>
              <div className="fs-3 fw-bold">{invoiceStats.total || 0}</div>
            </div>
            <div className="col-6">
              <div className="text-muted fw-semibold">Total Amount</div>
              <div className="fs-3 fw-bold text-success">
                {(invoiceStats.total_amount || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>

          <button
            className="btn btn-outline-primary w-100 mt-3"
            onClick={() => navigate("/sales/invoices/create")}
          >
            + Create Invoice
          </button>
        </div>
      </div>

      {/* Receipts */}
      <div className="col-md-6">
        <div className="card-box">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Customer Receipts</h5>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => navigate("/sales/receipts")}
            >
              View All
            </button>
          </div>

          <div className="row g-3">
            <div className="col-6">
              <div className="text-muted fw-semibold">Total Receipts</div>
              <div className="fs-3 fw-bold">{receiptStats.total || 0}</div>
            </div>
            <div className="col-6">
              <div className="text-muted fw-semibold">Total Received</div>
              <div className="fs-3 fw-bold text-success">
                {(receiptStats.total_amount || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>

          <button
            className="btn btn-outline-success w-100 mt-3"
            onClick={() => navigate("/sales/receipts/create")}
          >
            + Record Receipt
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
                onClick={() => navigate("/sales/orders/create")}
              >
                📄 Create SO
              </button>
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-outline-info w-100"
                onClick={() => navigate("/sales/deliveries/create")}
              >
                📦 Create Delivery
              </button>
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-outline-warning w-100"
                onClick={() => navigate("/sales/invoices/create")}
              >
                📋 Create Invoice
              </button>
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-outline-success w-100"
                onClick={() => navigate("/sales/receipts/create")}
              >
                💰 Record Receipt
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding Summary */}
      <div className="col-12">
        <div className="card-box bg-success bg-opacity-10">
          <h5 className="mb-3">Outstanding Balance</h5>
          <div className="row g-3">
            <div className="col-md-4">
              <div className="text-muted">Total Invoiced</div>
              <div className="fs-4 fw-bold text-success">
                {(invoiceStats.total_amount || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-muted">Total Received</div>
              <div className="fs-4 fw-bold text-primary">
                {(receiptStats.total_amount || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-muted">Outstanding (AR)</div>
              <div className="fs-4 fw-bold text-warning">
                {((invoiceStats.total_amount || 0) - (receiptStats.total_amount || 0)).toLocaleString(
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