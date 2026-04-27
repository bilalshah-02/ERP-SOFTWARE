// src/pages/purchase/VendorPaymentList.tsx - FIXED VERSION
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchVendorPayments } from "../../api/purchase";

export default function VendorPaymentList() {
  const navigate = useNavigate();
  const [supplierFilter, setSupplierFilter] = useState("");

  // ✅ FIX: Handle new response structure
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["vendor-payments"],
    queryFn: fetchVendorPayments,
  });

  // ✅ FIX: Extract payments array
  const payments = data?.payments || [];

  const totalAmount = payments.reduce((sum: number, pmt: any) => sum + (pmt.amount || 0), 0);

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box d-flex align-items-center justify-content-between">
          <div>
            <h2 className="fw-bold mb-1">Vendor Payments</h2>
            <div className="text-muted">Payments made to suppliers</div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/purchase/payments/create")}
          >
            + Make Payment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="col-12">
        <div className="card-box">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Supplier ID</label>
              <input
                type="number"
                className="form-control"
                placeholder="Filter by supplier..."
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
              />
            </div>
            <div className="col-md-6 d-flex align-items-end">
              <button className="btn btn-secondary w-100" onClick={() => refetch()}>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="col-md-4">
        <div className="card-box">
          <div className="text-muted fw-semibold">Total Payments</div>
          <div className="fs-3 fw-bold">{payments.length}</div>
        </div>
      </div>

      <div className="col-md-4">
        <div className="card-box">
          <div className="text-muted fw-semibold">Total Amount Paid</div>
          <div className="fs-3 fw-bold text-success">
            {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="col-md-4">
        <div className="card-box">
          <div className="text-muted fw-semibold">Average Payment</div>
          <div className="fs-3 fw-bold text-info">
            {payments.length > 0
              ? (totalAmount / payments.length).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })
              : "0.00"}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Payment ID</th>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th className="text-end">Amount</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      No vendor payments found
                    </td>
                  </tr>
                ) : (
                  payments.map((pmt: any) => (
                    <tr key={pmt.payment_id}>
                      <td>
                        <code className="text-primary">#{pmt.payment_id}</code>
                      </td>
                      <td>{new Date(pmt.payment_date).toLocaleDateString()}</td>
                      <td className="fw-semibold">
                        {pmt.supplier_name || `Supplier #${pmt.supplier_key}`}
                      </td>
                      <td>
                        <span className="badge bg-secondary">{pmt.payment_method || "—"}</span>
                      </td>
                      <td>{pmt.reference_no || "—"}</td>
                      <td className="text-end fw-bold">
                        {(pmt.amount || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => navigate(`/purchase/payments/${pmt.payment_id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="table-active fw-bold">
                  <td colSpan={5} className="text-end">
                    TOTAL PAID:
                  </td>
                  <td className="text-end">
                    {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}