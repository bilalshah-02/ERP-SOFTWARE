// src/pages/purchase/VendorPaymentCreate.tsx - FIXED VERSION
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createVendorPayment } from "../../api/purchase";
import { fetchVendors, type Vendor } from "../../api/vendors";

export default function VendorPaymentCreate() {
  const navigate = useNavigate();

  const [companyKey] = useState(1);
  const [supplierKey, setSupplierKey] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [referenceNo, setReferenceNo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [apAccountKey, setApAccountKey] = useState("45"); // Default AP account
  const [cashAccountKey, setCashAccountKey] = useState("46"); // ✅ FIXED: Changed to cash_account_key
  const [invoiceId, setInvoiceId] = useState("");

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["vendors"],
    queryFn: () => fetchVendors(),
  });

  const mutation = useMutation({
    mutationFn: createVendorPayment,
    onSuccess: (data) => {
      alert(`Payment #${data.payment_id || 'created'} and posted to GL!`);
      navigate("/purchase/payments");
    },
    onError: (error: any) => {
      alert("Failed to create payment: " + (error.response?.data?.error || error.message));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierKey || !amount || !apAccountKey || !cashAccountKey) {
      alert("Please fill all required fields");
      return;
    }

    if (Number(amount) <= 0) {
      alert("Amount must be greater than 0");
      return;
    }

    mutation.mutate({
      company_key: companyKey,
      supplier_key: Number(supplierKey),
      payment_date: paymentDate,
      amount: Number(amount),
      payment_method: paymentMethod,
      reference_no: referenceNo,
      remarks,
      ap_account_key: Number(apAccountKey),
      cash_account_key: Number(cashAccountKey), // ✅ FIXED: Correct field name
      invoice_id: invoiceId || undefined,
    });
  };

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box d-flex align-items-center justify-content-between">
          <div>
            <h2 className="fw-bold mb-1">Make Vendor Payment</h2>
            <div className="text-muted">Pay supplier with automatic GL posting</div>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate("/purchase/payments")}
          >
            ← Back to List
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="col-12">
        <form onSubmit={handleSubmit}>
          <div className="card-box">
            <h5 className="mb-3">Payment Details</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Supplier *</label>
                <select
                  className="form-select"
                  value={supplierKey}
                  onChange={(e) => setSupplierKey(e.target.value)}
                  required
                >
                  <option value="">Select Supplier</option>
                  {vendors.map((v) => (
                    <option key={v.party_key} value={v.party_key}>
                      {v.name} ({v.party_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">Payment Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Amount *</label>
                <input
                  type="number"
                  className="form-control"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHECK">Check</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">Reference Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="Transaction reference..."
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  Invoice ID <small className="text-muted">(Optional)</small>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  placeholder="UUID of invoice to allocate..."
                />
              </div>

              <div className="col-12">
                <label className="form-label">Remarks</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Payment notes..."
                />
              </div>
            </div>

            <hr className="my-4" />

            <h5 className="mb-3">GL Accounts</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">
                  Accounts Payable Account * 
                  <small className="text-muted"> (Debit)</small>
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={apAccountKey}
                  onChange={(e) => setApAccountKey(e.target.value)}
                  placeholder="Account Key"
                  required
                />
                <small className="text-muted">Account 4: Accounts Payable (will be debited)</small>
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  Cash/Bank Account * 
                  <small className="text-muted"> (Credit)</small>
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={cashAccountKey}
                  onChange={(e) => setCashAccountKey(e.target.value)}
                  placeholder="Account Key"
                  required
                />
                <small className="text-muted">Account 1: Cash (will be credited)</small>
              </div>
            </div>

            <div className="alert alert-info mt-3">
              <strong>GL Entry Preview:</strong>
              <br />
              Dr: Accounts Payable (Account {apAccountKey}) = {amount || "0.00"}
              <br />
              Cr: Cash/Bank (Account {cashAccountKey}) = {amount || "0.00"}
            </div>

            {/* Actions */}
            <div className="d-flex gap-2 justify-content-end mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/purchase/payments")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Processing..." : "Make Payment"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}