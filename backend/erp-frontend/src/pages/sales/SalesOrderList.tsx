// src/pages/sales/SalesOrderList.tsx - FIXED VERSION
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchSalesOrders, deleteSalesOrder } from "../../api/sales";
import { useState } from "react";

export default function SalesOrderList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ FIX: Handle new response structure
  const { data, isLoading } = useQuery({
    queryKey: ["sales-orders"],
    queryFn: fetchSalesOrders,
  });

  // ✅ FIX: Extract orders array
  const orders = data?.orders || [];

  const deleteMutation = useMutation({
    mutationFn: deleteSalesOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      alert("Sales Order deleted successfully!");
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    },
  });

  const handleDelete = (id: number, soNumber: string) => {
    if (window.confirm(`Delete Sales Order ${soNumber}?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Filter orders based on search
  const filteredOrders = orders.filter((order: any) =>
    order.so_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
              <h2 className="fw-bold mb-1">Sales Orders</h2>
              <div className="text-muted">Manage customer sales orders</div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/sales/orders/create")}
            >
              + Create Sales Order
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
            placeholder="Search by SO number or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>SO Number</th>
                  <th>Customer</th>
                  <th>Order Date</th>
                  <th>Delivery Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      {searchTerm ? "No sales orders match your search" : "No sales orders yet. Create your first SO!"}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order: any) => (
                    <tr key={order.so_id}>
                      <td className="fw-bold">{order.so_number}</td>
                      <td>{order.customer_name || `Customer #${order.customer_key}`}</td>
                      <td>{new Date(order.order_date).toLocaleDateString()}</td>
                      <td>
                        {order.delivery_date 
                          ? new Date(order.delivery_date).toLocaleDateString()
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
                              : order.status === "DELIVERED"
                              ? "info"
                              : order.status === "INVOICED"
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
                            onClick={() => navigate(`/sales/orders/${order.so_id}`)}
                          >
                            View
                          </button>
                          {order.status === "DRAFT" && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(order.so_id!, order.so_number!)}
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
                <div className="col-md-2">
                  <div className="text-muted small">Confirmed</div>
                  <div className="fs-5 fw-bold text-primary">
                    {filteredOrders.filter((o: any) => o.status === "CONFIRMED").length}
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="text-muted small">Delivered</div>
                  <div className="fs-5 fw-bold text-info">
                    {filteredOrders.filter((o: any) => o.status === "DELIVERED").length}
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="text-muted small">Invoiced</div>
                  <div className="fs-5 fw-bold text-success">
                    {filteredOrders.filter((o: any) => o.status === "INVOICED").length}
                  </div>
                </div>
                <div className="col-md-2">
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