// src/pages/sales/CustomerInvoiceCreate.tsx - FIXED VERSION
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createCustomerInvoice, fetchSalesOrders } from "../../api/sales";

export default function CustomerInvoiceCreate() {
  const navigate = useNavigate();

  const [soId, setSoId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [arAccountKey, setArAccountKey] = useState("44"); // Account 2: AR
  const [revenueAccountKey, setRevenueAccountKey] = useState("51"); // Account 6: Revenue

  // ✅ FIX: Handle new response structure
  const { data, isLoading } = useQuery({  // ← Add isLoading here!
  queryKey: ["sales-orders"],
  queryFn: fetchSalesOrders,
});

const orders = data?.orders || [];

  // Filter delivered orders only (ready to invoice)
  const deliveredOrders = orders.filter((o: any) => o.status === "DELIVERED");

  // Get selected order details
  const selectedOrder = orders.find((o: any) => o.so_id === Number(soId));

  const mutation = useMutation({
    mutationFn: createCustomerInvoice,
    onSuccess: (data) => {
      alert(`Customer Invoice ${data.invoice_number || 'created'} successfully!`);
      navigate("/sales/invoices");
    },
    onError: (error: any) => {
      alert("Failed to create invoice: " + (error.response?.data?.error || error.message));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!soId) {
      alert("Please select a Sales Order");
      return;
    }

    if (!invoiceNumber) {
      alert("Please enter invoice number");
      return;
    }

    if (!selectedOrder?.lines || selectedOrder.lines.length === 0) {
      alert("Selected order has no line items");
      return;
    }

    // Create invoice lines from SO lines
    const lines = selectedOrder.lines.map((line: any) => ({
      so_line_id: line.so_line_id,
      quantity: line.quantity,
    }));

    mutation.mutate({
      so_id: Number(soId),
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      due_date: dueDate,
      ar_account_key: Number(arAccountKey),
      revenue_account_key: Number(revenueAccountKey),
      lines,
    });
  };

  // Calculate order totals
  const calculateOrderTotal = () => {
    if (!selectedOrder?.lines) return { subtotal: 0, tax: 0, total: 0 };
    
    const subtotal = selectedOrder.lines.reduce((sum: number, line: any) => {
      return sum + (line.quantity * line.unit_price - (line.discount_amount || 0));
    }, 0);

    const tax = 0;
    const total = subtotal + tax;

    return { subtotal, tax, total };
  };

  const totals = calculateOrderTotal();

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
        <div className="card-box d-flex align-items-center justify-content-between">
          <div>
            <h2 className="fw-bold mb-1">Create Customer Invoice</h2>
            <div className="text-muted">Invoice delivered sales orders</div>
          </div>
          <button className="btn btn-outline-secondary" onClick={() => navigate("/sales/invoices")}>
            ← Back to List
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="col-12">
        <form onSubmit={handleSubmit}>
          <div className="card-box">
            <h5 className="mb-3">Invoice Details</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Sales Order *</label>
                <select
                  className="form-select"
                  value={soId}
                  onChange={(e) => setSoId(e.target.value)}
                  required
                >
                  <option value="">Select Delivered Sales Order</option>
                  {deliveredOrders.map((order: any) => (
                    <option key={order.so_id} value={order.so_id}>
                      {order.so_number} - {order.customer_name}
                    </option>
                  ))}
                </select>
                {deliveredOrders.length === 0 && (
                  <small className="text-muted">
                    No delivered orders available. Create and deliver an SO first.
                  </small>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label">Invoice Number *</label>
                <input
                  type="text"
                  className="form-control"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g., INV-2025-001"
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Invoice Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Due Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>

              {/* GL Accounts */}
              <div className="col-12">
                <h6 className="mt-3">GL Accounts (Auto-posting)</h6>
              </div>

              <div className="col-md-6">
                <label className="form-label">AR Account (Debit) *</label>
                <input
                  type="number"
                  className="form-control"
                  value={arAccountKey}
                  onChange={(e) => setArAccountKey(e.target.value)}
                  required
                />
                <small className="text-muted">Account 2: Accounts Receivable (1200) - will be debited</small>
              </div>

              <div className="col-md-6">
                <label className="form-label">Revenue Account (Credit) *</label>
                <input
                  type="number"
                  className="form-control"
                  value={revenueAccountKey}
                  onChange={(e) => setRevenueAccountKey(e.target.value)}
                  required
                />
                <small className="text-muted">Account 6: Sales Revenue (4000) - will be credited</small>
              </div>
            </div>

            {/* Order Preview */}
            {selectedOrder && (
              <div className="mt-4">
                <h6>Order Preview</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Discount</th>
                        <th>Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.lines?.map((line: any, index: number) => {
                        const lineTotal = (line.quantity * line.unit_price) - (line.discount_amount || 0);
                        return (
                          <tr key={index}>
                            <td>{line.item_code || `Item #${line.item_key}`}</td>
                            <td>{line.quantity}</td>
                            <td>{line.unit_price.toFixed(2)}</td>
                            <td>{(line.discount_amount || 0).toFixed(2)}</td>
                            <td className="fw-bold">{lineTotal.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="row">
                  <div className="col-md-8"></div>
                  <div className="col-md-4">
                    <div className="card bg-light p-3">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Subtotal:</span>
                        <span>{totals.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Tax:</span>
                        <span>{totals.tax.toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between border-top pt-2">
                        <strong>Grand Total:</strong>
                        <strong className="fs-4 text-success">{totals.total.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate("/sales/invoices")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={mutation.isPending || !selectedOrder}
              >
                {mutation.isPending ? "Creating..." : "Create Invoice"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Info */}
      <div className="col-12">
        <div className="alert alert-info">
          <strong>ℹ️ GL Posting:</strong> Creating this invoice will automatically post a journal entry:
          <br />• Debit: Accounts Receivable (increases AR)
          <br />• Credit: Sales Revenue (increases revenue)
        </div>
      </div>
    </div>
  );
}