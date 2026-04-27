// src/pages/inventory/StockBalanceReport.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { http } from "../../api/http";
import { useNavigate } from "react-router-dom";

export default function StockBalanceReport() {
  const navigate = useNavigate();
  const [warehouseFilter, setWarehouseFilter] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch warehouses for filter
  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await http.get("/api/warehouses/");
      return res.data;
    },
  });

  // Fetch stock balance
  const { data: stockData = [], isLoading } = useQuery({
    queryKey: ["stock-balance", warehouseFilter],
    queryFn: async () => {
      const params = warehouseFilter ? `?warehouse_key=${warehouseFilter}` : "";
      const res = await http.get(`/api/inventory/balance/${params}`);
      return res.data;
    },
  });

  // Filter by search term
  const filteredStock = stockData.filter((item: any) =>
    item.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const totalItems = filteredStock.length;
  const totalQuantity = filteredStock.reduce(
    (sum: number, item: any) => sum + Number(item.quantity_on_hand || 0),
    0
  );
  const totalValue = filteredStock.reduce(
    (sum: number, item: any) => sum + Number(item.total_value || 0),
    0
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
              <h2 className="fw-bold mb-1">Stock Balance Report</h2>
              <div className="text-muted">Current inventory levels by item</div>
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

      {/* Summary Cards */}
      <div className="col-md-4">
        <div className="card-box bg-primary text-white">
          <div className="small opacity-75">Total Items</div>
          <div className="fs-3 fw-bold">{totalItems}</div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card-box bg-success text-white">
          <div className="small opacity-75">Total Quantity</div>
          <div className="fs-3 fw-bold">{totalQuantity.toFixed(3)}</div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card-box bg-info text-white">
          <div className="small opacity-75">Total Value</div>
          <div className="fs-3 fw-bold">
            {totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="col-12">
        <div className="card-box">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Warehouse</label>
              <select
                className="form-select"
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(Number(e.target.value))}
              >
                <option value="0">All Warehouses</option>
                {warehouses.map((wh: any) => (
                  <option key={wh.warehouse_key} value={wh.warehouse_key}>
                    {wh.code} - {wh.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by item code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stock Balance Table */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Warehouse</th>
                  <th className="text-end">Quantity On Hand</th>
                  <th className="text-end">Avg. Cost</th>
                  <th className="text-end">Total Value</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      {searchTerm || warehouseFilter
                        ? "No stock found matching your filters"
                        : "No stock in inventory. Add stock to get started!"}
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((item: any, index: number) => {
                    const quantity = Number(item.quantity_on_hand || 0);
                    const avgCost = Number(item.average_cost || 0);
                    const totalValue = Number(item.total_value || 0);

                    return (
                      <tr key={index}>
                        <td className="fw-bold">{item.item_code}</td>
                        <td>{item.item_name}</td>
                        <td>{item.warehouse_name || item.warehouse_code}</td>
                        <td className="text-end">
                          {quantity.toFixed(3)}
                        </td>
                        <td className="text-end">{avgCost.toFixed(2)}</td>
                        <td className="text-end fw-bold">
                          {totalValue.toFixed(2)}
                        </td>
                        <td className="text-center">
                          {quantity > 10 ? (
                            <span className="badge bg-success">In Stock</span>
                          ) : quantity > 0 ? (
                            <span className="badge bg-warning">Low Stock</span>
                          ) : (
                            <span className="badge bg-danger">Out of Stock</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredStock.length > 0 && (
                <tfoot className="table-light">
                  <tr>
                    <th colSpan={3}>Total:</th>
                    <th className="text-end">{totalQuantity.toFixed(3)}</th>
                    <th></th>
                    <th className="text-end">{totalValue.toFixed(2)}</th>
                    <th></th>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}