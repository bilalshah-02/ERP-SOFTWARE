// src/pages/sales/SalesOrderDetail.tsx - DIAGNOSTIC VERSION
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "../../api/http";

interface SalesOrderLine {
  so_line_id: number;
  line_no: number;
  item_key: number;
  item_code?: string;
  item_name?: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
}

interface SalesOrder {
  so_id: number;
  so_number: string;
  customer_key: number;
  customer_name: string;
  order_date: string;
  delivery_date?: string;
  status: string;
  remarks?: string;
  lines: SalesOrderLine[];
  created_at: string;
}

export default function SalesOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery<SalesOrder>({
    queryKey: ["sales-order", id],
    queryFn: async () => {
      const res = await http.get(`/api/sales/orders/${id}/`);
      
      // 🔍 DIAGNOSTIC: Log the data
      console.log("=== RAW API RESPONSE ===");
      console.log("Full response:", res.data);
      console.log("Lines:", res.data.lines);
      if (res.data.lines && res.data.lines.length > 0) {
        console.log("First line:", res.data.lines[0]);
        console.log("quantity type:", typeof res.data.lines[0].quantity);
        console.log("quantity value:", res.data.lines[0].quantity);
        console.log("unit_price type:", typeof res.data.lines[0].unit_price);
        console.log("unit_price value:", res.data.lines[0].unit_price);
      }
      console.log("=======================");
      
      return res.data;
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const res = await http.post(`/api/sales/orders/${id}/confirm/`);
      return res.data;
    },
    onSuccess: (data) => {
      alert(`✅ ${data.message}\nSO ${data.so_number} is now ${data.status}`);
      queryClient.invalidateQueries({ queryKey: ["sales-order", id] });
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
    },
    onError: (error: any) => {
      alert(`❌ Error: ${error.response?.data?.error || error.message}`);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await http.post(`/api/sales/orders/${id}/cancel/`);
      return res.data;
    },
    onSuccess: (data) => {
      alert(`✅ ${data.message}\nSO ${data.so_number} has been cancelled`);
      queryClient.invalidateQueries({ queryKey: ["sales-order", id] });
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      navigate("/sales/orders");
    },
    onError: (error: any) => {
      alert(`❌ Error: ${error.response?.data?.error || error.message}`);
    },
  });

  const handleConfirm = () => {
    if (window.confirm("Confirm this Sales Order? This will allow it to be delivered.")) {
      confirmMutation.mutate();
    }
  };

  const handleCancel = () => {
    if (window.confirm("Cancel this Sales Order? This action cannot be undone.")) {
      cancelMutation.mutate();
    }
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

  if (!order) {
    return (
      <div className="alert alert-danger">
        Sales Order not found
      </div>
    );
  }

  // 🔍 SAFE calculation with logging
  const calculateSubtotal = () => {
    try {
      const subtotal = order.lines.reduce((sum, line) => {
        const qty = Number(line.quantity);
        const price = Number(line.unit_price);
        const discount = Number(line.discount_amount || 0);
        const lineTotal = (qty * price) - discount;
        console.log(`Line calc: ${qty} * ${price} - ${discount} = ${lineTotal}`);
        return sum + lineTotal;
      }, 0);
      console.log("Subtotal:", subtotal);
      return subtotal;
    } catch (error) {
      console.error("Error calculating subtotal:", error);
      return 0;
    }
  };

  const subtotal = calculateSubtotal();

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h2 className="fw-bold mb-2">{order.so_number}</h2>
              <div className="text-muted">Sales Order Details</div>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary"
                onClick={() => navigate("/sales/orders")}
              >
                ← Back to List
              </button>
              
              {order.status === "DRAFT" && (
                <>
                  <button
                    className="btn btn-success"
                    onClick={handleConfirm}
                    disabled={confirmMutation.isPending}
                  >
                    {confirmMutation.isPending ? "Confirming..." : "✅ Confirm Order"}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleCancel}
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? "Cancelling..." : "❌ Cancel Order"}
                  </button>
                </>
              )}

              {order.status === "CONFIRMED" && (
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/sales/deliveries/create")}
                >
                  📦 Create Delivery
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="col-12">
        <div className="card-box">
          <div className="d-flex align-items-center gap-3">
            <span className="fw-bold">Status:</span>
            <span
              className={`badge fs-6 bg-${
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

            {order.status === "DRAFT" && (
              <span className="text-muted ms-3">
                ℹ️ Confirm this order to proceed with delivery
              </span>
            )}

            {order.status === "CONFIRMED" && (
              <span className="text-success ms-3">
                ✅ Ready for delivery
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Order Information */}
      <div className="col-md-6">
        <div className="card-box">
          <h5 className="mb-3">Order Information</h5>
          <table className="table table-sm">
            <tbody>
              <tr>
                <td className="fw-semibold" style={{ width: "40%" }}>SO Number:</td>
                <td>{order.so_number}</td>
              </tr>
              <tr>
                <td className="fw-semibold">Customer:</td>
                <td>{order.customer_name}</td>
              </tr>
              <tr>
                <td className="fw-semibold">Order Date:</td>
                <td>{new Date(order.order_date).toLocaleDateString()}</td>
              </tr>
              {order.delivery_date && (
                <tr>
                  <td className="fw-semibold">Delivery Date:</td>
                  <td>{new Date(order.delivery_date).toLocaleDateString()}</td>
                </tr>
              )}
              <tr>
                <td className="fw-semibold">Created:</td>
                <td>{new Date(order.created_at).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          {order.remarks && (
            <div className="mt-3">
              <div className="fw-semibold mb-2">Remarks:</div>
              <div className="text-muted">{order.remarks}</div>
            </div>
          )}
        </div>
      </div>

      {/* Order Summary */}
      <div className="col-md-6">
        <div className="card-box">
          <h5 className="mb-3">Order Summary</h5>
          <div className="d-flex justify-content-between mb-2">
            <span>Line Items:</span>
            <span className="fw-bold">{order.lines.length}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span>Total Quantity:</span>
            <span className="fw-bold">
              {(() => {
                try {
                  const total = order.lines.reduce((sum, line) => sum + Number(line.quantity), 0);
                  return Number(total).toFixed(3);
                } catch {
                  return "0.000";
                }
              })()}
            </span>
          </div>
          <div className="d-flex justify-content-between pt-3 border-top">
            <span className="fw-bold fs-5">Order Total:</span>
            <span className="fw-bold fs-4 text-success">
              {subtotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="col-12">
        <div className="card-box">
          <h5 className="mb-3">Line Items</h5>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Description</th>
                  <th className="text-end">Quantity</th>
                  <th className="text-end">Unit Price</th>
                  <th className="text-end">Discount</th>
                  <th className="text-end">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((line) => {
                  // 🔍 SAFE rendering with Number() conversion
                  const qty = Number(line.quantity);
                  const price = Number(line.unit_price);
                  const discount = Number(line.discount_amount || 0);
                  const lineTotal = (qty * price) - discount;
                  
                  return (
                    <tr key={line.so_line_id}>
                      <td>{line.line_no}</td>
                      <td className="fw-bold">{line.item_code || `Item #${line.item_key}`}</td>
                      <td>{line.item_name || '-'}</td>
                      <td className="text-muted">{line.description || '-'}</td>
                      <td className="text-end">{qty.toFixed(3)}</td>
                      <td className="text-end">{price.toFixed(2)}</td>
                      <td className="text-end">{discount.toFixed(2)}</td>
                      <td className="text-end fw-bold">{lineTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="table-light">
                  <td colSpan={7} className="text-end fw-bold">Total:</td>
                  <td className="text-end fw-bold fs-5">
                    {subtotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Workflow Guide */}
      <div className="col-12">
        <div className={`alert alert-${
          order.status === "DRAFT" ? "warning" :
          order.status === "CONFIRMED" ? "info" :
          order.status === "DELIVERED" ? "success" :
          order.status === "INVOICED" ? "success" : "secondary"
        }`}>
          <strong>Next Steps:</strong>
          {order.status === "DRAFT" && (
            <ul className="mb-0 mt-2">
              <li>Click <strong>"Confirm Order"</strong> to approve this sales order</li>
              <li>Once confirmed, you can create a delivery note</li>
            </ul>
          )}
          {order.status === "CONFIRMED" && (
            <ul className="mb-0 mt-2">
              <li>Click <strong>"Create Delivery"</strong> to ship goods to customer</li>
              <li>Stock will be validated before delivery is created</li>
            </ul>
          )}
          {order.status === "DELIVERED" && (
            <ul className="mb-0 mt-2">
              <li>Goods have been delivered to customer</li>
              <li>Next: Create customer invoice</li>
            </ul>
          )}
          {order.status === "INVOICED" && (
            <ul className="mb-0 mt-2">
              <li>Invoice has been created</li>
              <li>Next: Record customer payment/receipt</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}