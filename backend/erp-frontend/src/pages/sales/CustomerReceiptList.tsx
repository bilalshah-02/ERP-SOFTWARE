// src/pages/sales/CustomerReceiptList.tsx - FIXED VERSION
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchCustomerReceipts } from "../../api/sales";
import { useState } from "react";

export default function CustomerReceiptList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ FIX: Handle new response structure
  const { data, isLoading } = useQuery({
    queryKey: ["customer-receipts"],
    queryFn: fetchCustomerReceipts,
  });

  // ✅ FIX: Extract receipts array
  const receipts = data?.receipts || [];

  // Filter receipts based on search
  const filteredReceipts = receipts.filter((receipt: any) =>
    receipt.reference_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
              <h2 className="fw-bold mb-1">Customer Receipts</h2>
              <div className="text-muted">Manage customer payments</div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/sales/receipts/create")}
            >
              + Record Receipt
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
            placeholder="Search by reference number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Receipts Table */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Reference No</th>
                  <th>Customer</th>
                  <th>Payment Date</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      {searchTerm ? "No receipts match your search" : "No receipts yet. Record your first payment!"}
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((receipt: any, index: number) => (
                    <tr key={receipt.payment_id || index}>
                      <td className="fw-bold">{receipt.reference_no || 'N/A'}</td>
                      <td>{receipt.customer_name || `Customer #${receipt.customer_key}`}</td>
                      <td>
                        {receipt.payment_date 
                          ? new Date(receipt.payment_date).toLocaleDateString()
                          : 'N/A'
                        }
                      </td>
                      <td className="fw-bold text-success">
                        {(receipt.amount || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td>
                        <span className="badge bg-primary">
                          {receipt.payment_method || 'N/A'}
                        </span>
                      </td>
                      <td className="text-muted small">{receipt.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {filteredReceipts.length > 0 && (
            <div className="mt-3 pt-3 border-top">
              <div className="row text-center">
                <div className="col-md-4">
                  <div className="text-muted small">Total Receipts</div>
                  <div className="fs-5 fw-bold">{filteredReceipts.length}</div>
                </div>
                <div className="col-md-4">
                  <div className="text-muted small">Total Amount</div>
                  <div className="fs-5 fw-bold text-success">
                    {filteredReceipts
                      .reduce((sum: number, r: any) => sum + (r.amount || 0), 0)
                      .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-muted small">This Month</div>
                  <div className="fs-5 fw-bold">
                    {filteredReceipts.filter((r: any) => {
                      if (!r.payment_date) return false;
                      const paymentDate = new Date(r.payment_date);
                      const now = new Date();
                      return paymentDate.getMonth() === now.getMonth() &&
                             paymentDate.getFullYear() === now.getFullYear();
                    }).length}
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