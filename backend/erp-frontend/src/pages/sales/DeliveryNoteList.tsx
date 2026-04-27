// src/pages/sales/DeliveryNoteList.tsx - FIXED VERSION
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchDeliveryNotes } from "../../api/sales";
import { useState } from "react";

export default function DeliveryNoteList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ FIX: Handle the correct API response structure
  const { data, isLoading } = useQuery({
    queryKey: ["delivery-notes"],
    queryFn: fetchDeliveryNotes,
  });

  // ✅ FIX: Extract deliveries array from response
  const deliveries = data?.deliveries || [];

  // Filter deliveries based on search
  const filteredDeliveries = deliveries.filter((delivery: any) =>
    delivery.dn_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delivery.so_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delivery.warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
              <h2 className="fw-bold mb-1">Delivery Notes</h2>
              <div className="text-muted">View all customer deliveries</div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/sales/deliveries/create")}
            >
              + Create Delivery
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
            placeholder="Search by DN number, SO number, or warehouse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>DN Number</th>
                  <th>SO Number</th>
                  <th>Delivery Date</th>
                  <th>Warehouse</th>
                  <th>Status</th>
                  <th>Total Items</th>
                  <th>Total Quantity</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      {searchTerm ? "No deliveries match your search" : "No deliveries yet. Create your first delivery!"}
                    </td>
                  </tr>
                ) : (
                  filteredDeliveries.map((delivery: any) => (
                    <tr key={delivery.dn_id}>
                      <td className="fw-bold">{delivery.dn_number}</td>
                      <td>{delivery.so_number || 'N/A'}</td>
                      <td>{new Date(delivery.delivery_date).toLocaleDateString()}</td>
                      <td>{delivery.warehouse_name || `Warehouse #${delivery.warehouse_key}`}</td>
                      <td>
                        <span className="badge bg-success">
                          {delivery.status || 'POSTED'}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-info">
                          {delivery.total_items || 0} items
                        </span>
                      </td>
                      <td className="fw-bold">
                        {delivery.total_quantity?.toLocaleString(undefined, {
                          minimumFractionDigits: 3,
                        }) || '0.000'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {filteredDeliveries.length > 0 && (
            <div className="mt-3 pt-3 border-top">
              <div className="row text-center">
                <div className="col-md-3">
                  <div className="text-muted small">Total Deliveries</div>
                  <div className="fs-5 fw-bold">{filteredDeliveries.length}</div>
                </div>
                <div className="col-md-3">
                  <div className="text-muted small">Total Items Delivered</div>
                  <div className="fs-5 fw-bold">
                    {filteredDeliveries.reduce((sum: number, d: any) => sum + (d.total_items || 0), 0)}
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-muted small">Total Quantity</div>
                  <div className="fs-5 fw-bold text-info">
                    {filteredDeliveries
                      .reduce((sum: number, d: any) => sum + (d.total_quantity || 0), 0)
                      .toLocaleString(undefined, { minimumFractionDigits: 3 })}
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-muted small">This Month</div>
                  <div className="fs-5 fw-bold">
                    {filteredDeliveries.filter((d: any) => {
                      const deliveryDate = new Date(d.delivery_date);
                      const now = new Date();
                      return deliveryDate.getMonth() === now.getMonth() &&
                             deliveryDate.getFullYear() === now.getFullYear();
                    }).length}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="col-12">
        <div className="alert alert-info">
          <strong>ℹ️ Note:</strong> All deliveries use real FIFO costing. Stock is automatically reduced when deliveries are created.
        </div>
      </div>
    </div>
  );
}