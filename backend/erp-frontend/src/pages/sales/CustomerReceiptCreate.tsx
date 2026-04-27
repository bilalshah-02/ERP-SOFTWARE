// src/pages/sales/CustomerReceiptCreate.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createCustomerReceipt } from "../../api/sales";
import { fetchCustomers, type Customer } from "../../api/customers";

export default function CustomerReceiptCreate() {
  const navigate = useNavigate();

  const [companyKey] = useState(1); // TODO: Get from auth/context
  const [customerKey, setCustomerKey] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");
  const [cashAccountKey, setCashAccountKey] = useState("110"); // Default Cash/Bank account
  const [arAccountKey, setArAccountKey] = useState("120"); // Default AR account

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: () => fetchCustomers(),
  });

  const mutation = useMutation({
    mutationFn: createCustomerReceipt,
    onSuccess: (data) => {
      alert(`Customer Receipt recorded successfully! Amount: ${data.amount}`);
      navigate("/sales/receipts");
    },
    onError: (error: any) => {
      alert("Failed to record receipt: " + (error.response?.data?.error || error.message));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerKey) {
      alert("Please select a customer");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    mutation.mutate({
      company_key: companyKey,
      customer_key: Number(customerKey),
      payment_date: paymentDate,
      amount: Number(amount),
      payment_method: paymentMethod,
      reference_no: referenceNo,
      notes,
      cash_account_key: Number(cashAccountKey),
      ar_account_key: Number(arAccountKey),
    });
  };

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box d-flex align-items-center justify-content-between">
          <div>
            <h2 className="fw-bold mb-1">Record Customer Receipt</h2>
            <div className="text-muted">Record customer payment</div>
          </div>
          <button className="btn btn-outline-secondary" onClick={() => navigate("/sales/receipts")}>
            ← Back to List
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="col-12">
        <form onSubmit={handleSubmit}>
          <div className="card-box">
            <h5 className="mb-3">Receipt Details</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Customer *</label>
                <select
                  className="form-select"
                  value={customerKey}
                  onChange={(e) => setCustomerKey(e.target.value)}
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.party_key} value={c.party_key}>
                      {c.name} ({c.party_code})
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
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Payment Method *</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CHECK">Check</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="ONLINE">Online Payment</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">Reference Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g., CHK-12345, TXN-67890"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Notes</label>
                <input
                  type="text"
                  className="form-control"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                />
              </div>

              {/* GL Accounts */}
              <div className="col-12">
                <h6 className="mt-3">GL Accounts (Auto-posting)</h6>
              </div>

              <div className="col-md-6">
                <label className="form-label">Cash/Bank Account (Debit) *</label>
                <input
                  type="number"
                  className="form-control"
                  value={cashAccountKey}
                  onChange={(e) => setCashAccountKey(e.target.value)}
                  required
                />
                <small className="text-muted">Cash/Bank account will be debited (increased)</small>
              </div>

              <div className="col-md-6">
                <label className="form-label">AR Account (Credit) *</label>
                <input
                  type="number"
                  className="form-control"
                  value={arAccountKey}
                  onChange={(e) => setArAccountKey(e.target.value)}
                  required
                />
                <small className="text-muted">Accounts Receivable will be credited (decreased)</small>
              </div>
            </div>

            {/* Amount Preview */}
            {amount && Number(amount) > 0 && (
              <div className="mt-4">
                <div className="card bg-success bg-opacity-10 p-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="text-muted">Receipt Amount</div>
                      <div className="fs-4 fw-bold text-success">
                        {Number(amount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="text-muted small">Payment Method</div>
                      <div className="badge bg-primary fs-6">{paymentMethod}</div>
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
                onClick={() => navigate("/sales/receipts")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-success"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Recording..." : "💰 Record Receipt"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Info */}
      <div className="col-12">
        <div className="alert alert-info">
          <strong>ℹ️ GL Posting:</strong> Recording this receipt will automatically post a journal entry:
          <br />• Debit: Cash/Bank Account (increases cash)
          <br />• Credit: Accounts Receivable (decreases AR)
        </div>
      </div>
    </div>
  );
}