// src/pages/inventory/InventoryDashboard.tsx
import { useQuery } from "@tanstack/react-query";
import { http } from "../../api/http";
import { useNavigate } from "react-router-dom";

export default function InventoryDashboard() {
  const navigate = useNavigate();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["inventory-dashboard"],
    queryFn: async () => {
      const res = await http.get("/api/inventory/dashboard/");
      return res.data;
    },
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

  const stats = dashboard || {};

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box">
          <h2 className="fw-bold mb-1">Inventory Dashboard</h2>
          <div className="text-muted">
            Overview of your inventory and stock movements
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="col-md-3">
        <div className="card-box bg-primary text-white">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="small opacity-75 mb-1">Total Items</div>
              <div className="fs-3 fw-bold">
                {stats.total_items || 0}
              </div>
            </div>
            <div className="fs-1 opacity-50">📦</div>
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card-box bg-success text-white">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="small opacity-75 mb-1">Items In Stock</div>
              <div className="fs-3 fw-bold">
                {stats.items_in_stock || 0}
              </div>
            </div>
            <div className="fs-1 opacity-50">✅</div>
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card-box bg-warning text-white">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="small opacity-75 mb-1">Low Stock Items</div>
              <div className="fs-3 fw-bold">
                {stats.low_stock_items || 0}
              </div>
            </div>
            <div className="fs-1 opacity-50">⚠️</div>
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card-box bg-danger text-white">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="small opacity-75 mb-1">Out of Stock</div>
              <div className="fs-3 fw-bold">
                {stats.out_of_stock_items || 0}
              </div>
            </div>
            <div className="fs-1 opacity-50">❌</div>
          </div>
        </div>
      </div>

      {/* Inventory Value */}
      <div className="col-md-6">
        <div className="card-box">
          <h5 className="mb-3">Inventory Value</h5>
          <div className="row">
            <div className="col-6">
              <div className="text-muted small">Total Value</div>
              <div className="fs-4 fw-bold text-primary">
                {Number(stats.total_value || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="col-6">
              <div className="text-muted small">Total Quantity</div>
              <div className="fs-4 fw-bold text-success">
                {Number(stats.total_quantity || 0).toFixed(3)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Movements Summary */}
      <div className="col-md-6">
        <div className="card-box">
          <h5 className="mb-3">Today's Activity</h5>
          <div className="row">
            <div className="col-4">
              <div className="text-muted small">Stock In</div>
              <div className="fs-5 fw-bold text-success">
                +{stats.today_stock_in || 0}
              </div>
            </div>
            <div className="col-4">
              <div className="text-muted small">Stock Out</div>
              <div className="fs-5 fw-bold text-danger">
                -{stats.today_stock_out || 0}
              </div>
            </div>
            <div className="col-4">
              <div className="text-muted small">Movements</div>
              <div className="fs-5 fw-bold">
                {stats.today_movements || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="col-12">
        <div className="card-box">
          <h5 className="mb-3">Quick Actions</h5>
          <div className="row g-3">
            <div className="col-md-3">
              <button
                className="btn btn-primary w-100"
                onClick={() => navigate("/inventory/adjustments/create")}
              >
                <div className="fs-4">➕</div>
                <div>Add Stock</div>
              </button>
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-info w-100"
                onClick={() => navigate("/inventory/balance")}
              >
                <div className="fs-4">📊</div>
                <div>Stock Balance</div>
              </button>
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-success w-100"
                onClick={() => navigate("/inventory/movements")}
              >
                <div className="fs-4">📋</div>
                <div>View Movements</div>
              </button>
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-warning w-100"
                onClick={() => navigate("/inventory/transfers/create")}
              >
                <div className="fs-4">🔄</div>
                <div>Transfer Stock</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats.low_stock_items && stats.low_stock_items > 0 && (
        <div className="col-12">
          <div className="alert alert-warning">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>⚠️ Low Stock Alert!</strong>
                <div className="mt-1">
                  {stats.low_stock_items} item(s) are running low on stock.
                </div>
              </div>
              <button
                className="btn btn-warning"
                onClick={() => navigate("/inventory/balance")}
              >
                View Items
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Movements */}
      <div className="col-12">
        <div className="card-box">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Recent Movements</h5>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => navigate("/inventory/movements")}
            >
              View All →
            </button>
          </div>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Type</th>
                  <th className="text-end">Quantity</th>
                  <th>Warehouse</th>
                </tr>
              </thead>
              <tbody>
                {!stats.recent_movements || stats.recent_movements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-3">
                      No recent movements
                    </td>
                  </tr>
                ) : (
                  stats.recent_movements.slice(0, 5).map((mov: any, index: number) => (
                    <tr key={index}>
                      <td>{new Date(mov.tx_date).toLocaleDateString()}</td>
                      <td>{mov.item_code}</td>
                      <td>
                        <span
                          className={`badge bg-${
                            mov.movement_type === "IN"
                              ? "success"
                              : mov.movement_type === "OUT"
                              ? "danger"
                              : mov.movement_type === "ADJUSTMENT"
                              ? "warning"
                              : "info"
                          }`}
                        >
                          {mov.movement_type}
                        </span>
                      </td>
                      <td className="text-end">
                        {Number(mov.quantity) > 0 ? "+" : ""}
                        {Number(mov.quantity).toFixed(3)}
                      </td>
                      <td>{mov.warehouse_code}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}