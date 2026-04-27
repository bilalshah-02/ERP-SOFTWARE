// src/pages/purchase/VendorInvoiceDetail.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { fetchVendorInvoice, createVendorPayment } from "../../api/purchase";

export default function VendorInvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [referenceNo, setReferenceNo] = useState("");
  const [apAccountKey] = useState(45);    // Accounts Payable
  const [cashAccountKey] = useState(46);  // Cash/Bank

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ["vendor-invoice", id],
    queryFn: () => fetchVendorInvoice(id!),
  });

  const paymentMutation = useMutation({
    mutationFn: createVendorPayment,
    onSuccess: () => {
      alert("Payment recorded and posted to GL successfully!");
      queryClient.invalidateQueries({ queryKey: ["vendor-invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["vendor-invoices"] });
      setShowPaymentForm(false);
    },
    onError: (error: any) => {
      alert("Failed to record payment: " + (error.response?.data?.detail || error.message));
    },
  });

  const handlePayment = () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    paymentMutation.mutate({
      company_key: 1,
      supplier_key: invoice!.supplier_key!,
      payment_date: paymentDate,
      amount: Number(paymentAmount),
      payment_method: paymentMethod,
      reference_no: referenceNo,
      ap_account_key: apAccountKey,
      bank_account_key: cashAccountKey,
      invoice_id: id,
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="alert alert-danger m-4">
        Invoice not found.{" "}
        <button className="btn btn-link p-0" onClick={() => navigate("/purchase/invoices")}>
          Back to list
        </button>
      </div>
    );
  }

  const lines = invoice.lines || [];
  const total = invoice.total_amount || lines.reduce((sum: number, l: any) => sum + Number(l.line_amount || 0), 0);

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box d-flex justify-content-between align-items-center">
          <div>
            <h2 className="fw-bold mb-1">{invoice.invoice_number}</h2>
            <span className={`badge ${invoice.status === "POSTED" ? "bg-success" : invoice.status === "PAID" ? "bg-primary" : "bg-secondary"}`}>
              {invoice.status}
            </span>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" onClick={() => navigate("/purchase/invoices")}>
              ← Back to List
            </button>
            {invoice.status === "POSTED" && (
              <button className="btn btn-success" onClick={() => setShowPaymentForm(!showPaymentForm)}>
                💳 Record Payment
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Info */}
      <div className="col-md-6">
        <div className="card-box h-100">
          <h5 className="fw-bold mb-3">Invoice Details</h5>
          <table className="table table-borderless mb-0">
            <tbody>
              <tr>
                <td className="text-muted">Supplier</td>
                <td className="fw-bold">{invoice.supplier_name || `Supplier #${invoice.supplier_key}`}</td>
              </tr>
              <tr>
                <td className="text-muted">Invoice Date</td>
                <td>{invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : "—"}</td>
              </tr>
              <tr>
                <td className="text-muted">Due Date</td>
                <td className={invoice.due_date && new Date(invoice.due_date) < new Date() ? "text-danger fw-bold" : ""}>
                  {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "—"}
                </td>
              </tr>
              <tr>
                <td className="text-muted">Status</td>
                <td>{invoice.status}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card-box h-100">
          <h5 className="fw-bold mb-3">Summary</h5>
          <table className="table table-borderless mb-0">
            <tbody>
              <tr>
                <td className="text-muted">Total Lines</td>
                <td className="fw-bold">{lines.length}</td>
              </tr>
              <tr>
                <td className="text-muted">Total Amount</td>
                <td className="fw-bold fs-5 text-primary">${Number(total).toFixed(2)}</td>
              </tr>
              <tr>
                <td className="text-muted">GL Entry</td>
                <td className="small text-muted">
                  Dr: COGS (43) / Cr: AP (45)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Form */}
      {showPaymentForm && (
        <div className="col-12">
          <div className="card-box border border-success">
            <h5 className="fw-bold mb-3 text-success">💳 Record Payment</h5>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Payment Date *</label>
                <input type="date" className="form-control" value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Amount *</label>
                <input type="number" className="form-control" value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Max: ${Number(total).toFixed(2)}`} step="0.01" />
              </div>
              <div className="col-md-4">
                <label className="form-label">Payment Method</label>
                <select className="form-select" value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option>Bank Transfer</option>
                  <option>Cash</option>
                  <option>Cheque</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Reference Number</label>
                <input type="text" className="form-control" value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="Transaction reference..." />
              </div>
              <div className="col-md-6">
                <label className="form-label">GL Preview</label>
                <div className="alert alert-info mb-0 py-2">
                  Dr: AP (45) = {paymentAmount || "0"}<br />
                  Cr: Cash/Bank (46) = {paymentAmount || "0"}
                </div>
              </div>
              <div className="col-12 d-flex gap-2 justify-content-end">
                <button className="btn btn-secondary" onClick={() => setShowPaymentForm(false)}>Cancel</button>
                <button className="btn btn-success" onClick={handlePayment}
                  disabled={paymentMutation.isPending}>
                  {paymentMutation.isPending ? "Processing..." : "✓ Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Line Items */}
      <div className="col-12">
        <div className="card-box">
          <h5 className="fw-bold mb-3">Line Items</h5>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Description</th>
                  <th className="text-end">Qty</th>
                  <th className="text-end">Unit Price</th>
                  <th className="text-end">Line Amount</th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-muted py-4">No line items</td></tr>
                ) : (
                  lines.map((line: any, idx: number) => (
                    <tr key={idx}>
                      <td>{line.line_no || idx + 1}</td>
                      <td className="fw-bold">
                        {line.item_code || (line.item_key ? `Item #${line.item_key}` : "—")}
                        {line.item_name && <div className="text-muted small">{line.item_name}</div>}
                      </td>
                      <td>{line.description || "—"}</td>
                      <td className="text-end">{line.quantity || "—"}</td>
                      <td className="text-end">{line.unit_price ? `$${Number(line.unit_price).toFixed(2)}` : "—"}</td>
                      <td className="text-end fw-bold">${Number(line.line_amount).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="table-light">
                  <td colSpan={5} className="text-end fw-bold">Total</td>
                  <td className="text-end fw-bold text-primary fs-6">${Number(total).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}