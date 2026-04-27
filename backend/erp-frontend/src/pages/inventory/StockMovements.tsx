// src/pages/inventory/StockMovements.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { http } from "../../api/http";
import { useNavigate } from "react-router-dom";

export default function StockMovements() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    item_key: 0,
    warehouse_key: 0,
    movement_type: "",
    start_date: "",
    end_date: "",
  });

  // Fetch items for filter
  const { data: items = [] } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const res = await http.get("/api/items/");
      return res.data;
    },
  });

  // Fetch warehouses for filter
  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await http.get("/api/warehouses/");
      return res.data;
    },
  });

  // Fetch movements
  const { data: movementsData, isLoading } = useQuery({
    queryKey: ["stock-movements", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.item_key) params.append("item_key", filters.item_key.toString());
      if (filters.warehouse_key) params.append("warehouse_key", filters.warehouse_key.toString());
      if (filters.movement_type) params.append("movement_type", filters.movement_type);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      
      const res = await http.get(`/api/inventory/movements/?${params.toString()}`);
      return res.data;
    },
  });

  // Ensure movements is always an array
  const movements = Array.isArray(movementsData) ? movementsData : [];

  const clearFilters = () => {
    setFilters({
      item_key: 0,
      warehouse_key: 0,
      movement_type: "",
      start_date: "",
      end_date: "",
    });
  };

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
              <h2 className="fw-bold mb-1">Stock Movements</h2>
              <div className="text-muted">Track all inventory transactions</div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/inventory/adjustments/create")}
            >
              + Add Stock
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="col-12">
        <div className="card-box">
          <h6 className="mb-3">Filters</h6>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label small">Item</label>
              <select
                className="form-select form-select-sm"
                value={filters.item_key}
                onChange={(e) =>
                  setFilters({ ...filters, item_key: Number(e.target.value) })
                }
              >
                <option value="0">All Items</option>
                {items.map((item: any) => (
                  <option key={item.item_key} value={item.item_key}>
                    {item.item_code} - {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label small">Warehouse</label>
              <select
                className="form-select form-select-sm"
                value={filters.warehouse_key}
                onChange={(e) =>
                  setFilters({ ...filters, warehouse_key: Number(e.target.value) })
                }
              >
                <option value="0">All Warehouses</option>
                {warehouses.map((wh: any) => (
                  <option key={wh.warehouse_key} value={wh.warehouse_key}>
                    {wh.code} - {wh.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label small">Movement Type</label>
              <select
                className="form-select form-select-sm"
                value={filters.movement_type}
                onChange={(e) =>
                  setFilters({ ...filters, movement_type: e.target.value })
                }
              >
                <option value="">All Types</option>
                <option value="IN">In</option>
                <option value="OUT">Out</option>
                <option value="ADJUSTMENT">Adjustment</option>
                <option value="TRANSFER">Transfer</option>
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label small">Start Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={filters.start_date}
                onChange={(e) =>
                  setFilters({ ...filters, start_date: e.target.value })
                }
              />
            </div>

            <div className="col-md-2">
              <label className="form-label small">End Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={filters.end_date}
                onChange={(e) =>
                  setFilters({ ...filters, end_date: e.target.value })
                }
              />
            </div>
          </div>

          {(filters.item_key || filters.warehouse_key || filters.movement_type || filters.start_date || filters.end_date) && (
            <div className="mt-3">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Movements Table */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Warehouse</th>
                  <th>Type</th>
                  <th className="text-end">Quantity</th>
                  <th className="text-end">Unit Cost</th>
                  <th className="text-end">Total Cost</th>
                  <th>Source</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center text-muted py-4">
                      No movements found
                    </td>
                  </tr>
                ) : (
                  movements.map((mov: any) => {
                    const quantity = Number(mov.quantity);
                    const isPositive = quantity > 0;

                    return (
                      <tr key={mov.inv_txn_id}>
                        <td>{new Date(mov.tx_date).toLocaleDateString()}</td>
                        <td className="fw-bold">{mov.item_code}</td>
                        <td>{mov.item_name}</td>
                        <td>{mov.warehouse_code || mov.warehouse_name}</td>
                        <td>
                          <span
                            className={`badge bg-${
                              mov.movement_type === "IN" || isPositive
                                ? "success"
                                : mov.movement_type === "OUT" || !isPositive
                                ? "danger"
                                : mov.movement_type === "ADJUSTMENT"
                                ? "warning"
                                : "info"
                            }`}
                          >
                            {mov.movement_type}
                          </span>
                        </td>
                        <td className={`text-end ${isPositive ? "text-success" : "text-danger"}`}>
                          {isPositive ? "+" : ""}
                          {quantity.toFixed(3)}
                        </td>
                        <td className="text-end">
                          {Number(mov.unit_cost || 0).toFixed(2)}
                        </td>
                        <td className="text-end fw-bold">
                          {Math.abs(Number(mov.total_cost || 0)).toFixed(2)}
                        </td>
                        <td>
                          <span className="badge bg-secondary">
                            {mov.source_doc_type || "N/A"}
                          </span>
                        </td>
                        <td className="text-muted small">
                          {mov.source_doc_id || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {movements.length > 0 && (
            <div className="mt-3 pt-3 border-top">
              <div className="row text-center">
                <div className="col-md-4">
                  <div className="text-muted small">Total Movements</div>
                  <div className="fs-5 fw-bold">{movements.length}</div>
                </div>
                <div className="col-md-4">
                  <div className="text-muted small">Stock In</div>
                  <div className="fs-5 fw-bold text-success">
                    +
                    {movements
                      .filter((m: any) => Number(m.quantity) > 0)
                      .reduce((sum: number, m: any) => sum + Number(m.quantity), 0)
                      .toFixed(3)}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-muted small">Stock Out</div>
                  <div className="fs-5 fw-bold text-danger">
                    {movements
                      .filter((m: any) => Number(m.quantity) < 0)
                      .reduce((sum: number, m: any) => sum + Number(m.quantity), 0)
                      .toFixed(3)}
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