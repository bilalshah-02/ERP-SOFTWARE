// src/pages/purchase/PurchaseOrderList.tsx - WORKING VERSION
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchPurchaseOrders, deletePurchaseOrder } from "../../api/purchase";
import { useState } from "react";

export default function PurchaseOrderList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ FIX: Handle new response structure
  const { data, isLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: fetchPurchaseOrders,
  });

  // ✅ FIX: Extract orders array
  const orders = data?.orders || [];

  const deleteMutation = useMutation({
    mutationFn: deletePurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      alert("Purchase Order deleted successfully!");
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    },
  });

  const handleDelete = (id: number, poNumber: string) => {
    if (window.confirm(`Delete Purchase Order ${poNumber}?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Filter orders based on search
  const filteredOrders = orders.filter((order: any) =>
    order.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
              <h2 className="fw-bold mb-1">Purchase Orders</h2>
              <div className="text-muted">Manage supplier purchase orders</div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/purchase/orders/create")}
            >
              + Create Purchase Order
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
            placeholder="Search by PO number or supplier name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Order Date</th>
                  <th>Expected Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      {searchTerm ? "No purchase orders match your search" : "No purchase orders yet. Create your first PO!"}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order: any) => (
                    <tr key={order.po_id}>
                      <td className="fw-bold">{order.po_number}</td>
                      <td>{order.supplier_name || `Supplier #${order.supplier_key}`}</td>
                      <td>{new Date(order.order_date).toLocaleDateString()}</td>
                      <td>
                        {order.expected_date 
                          ? new Date(order.expected_date).toLocaleDateString()
                          : '-'
                        }
                      </td>
                      <td>
                        <span
                          className={`badge bg-${
                            order.status === "DRAFT"
                              ? "secondary"
                              : order.status === "CONFIRMED"
                              ? "primary"
                              : order.status === "RECEIVED"
                              ? "success"
                              : order.status === "CANCELLED"
                              ? "danger"
                              : "warning"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => navigate(`/purchase/orders/${order.po_id}`)}
                          >
                            View
                          </button>
                          {order.status === "DRAFT" && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(order.po_id!, order.po_number!)}
                              disabled={deleteMutation.isPending}
                            >
                              Delete
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
          {filteredOrders.length > 0 && (
            <div className="mt-3 pt-3 border-top">
              <div className="row text-center">
                <div className="col-md-2">
                  <div className="text-muted small">Total Orders</div>
                  <div className="fs-5 fw-bold">{filteredOrders.length}</div>
                </div>
                <div className="col-md-2">
                  <div className="text-muted small">Draft</div>
                  <div className="fs-5 fw-bold">
                    {filteredOrders.filter((o: any) => o.status === "DRAFT").length}
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-muted small">Confirmed</div>
                  <div className="fs-5 fw-bold text-primary">
                    {filteredOrders.filter((o: any) => o.status === "CONFIRMED").length}
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="text-muted small">Received</div>
                  <div className="fs-5 fw-bold text-success">
                    {filteredOrders.filter((o: any) => o.status === "RECEIVED").length}
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-muted small">Cancelled</div>
                  <div className="fs-5 fw-bold text-danger">
                    {filteredOrders.filter((o: any) => o.status === "CANCELLED").length}
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