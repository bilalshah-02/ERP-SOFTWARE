// src/pages/purchase/VendorInvoiceList.tsx - FIXED VERSION
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchVendorInvoices } from "../../api/purchase";

export default function VendorInvoiceList() {
  const navigate = useNavigate();
  const [supplierFilter, setSupplierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ✅ FIX: Handle new response structure
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["vendor-invoices"],
    queryFn: fetchVendorInvoices,
  });

  // ✅ FIX: Extract invoices array
  const invoices = data?.invoices || [];

  const totalAmount = invoices.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box d-flex align-items-center justify-content-between">
          <div>
            <h2 className="fw-bold mb-1">Vendor Invoices</h2>
            <div className="text-muted">Accounts Payable invoices from suppliers</div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/purchase/invoices/create")}
          >
            + Create Invoice
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="col-12">
        <div className="card-box">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="POSTED">Posted</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Supplier ID</label>
              <input
                type="number"
                className="form-control"
                placeholder="Filter by supplier..."
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
              />
            </div>
            <div className="col-md-4 d-flex align-items-end">
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
          <div className="text-muted fw-semibold">Total Invoices</div>
          <div className="fs-3 fw-bold">{invoices.length}</div>
        </div>
      </div>

      <div className="col-md-4">
        <div className="card-box">
          <div className="text-muted fw-semibold">Total Amount</div>
          <div className="fs-3 fw-bold text-danger">
            {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="col-md-4">
        <div className="card-box">
          <div className="text-muted fw-semibold">Posted</div>
          <div className="fs-3 fw-bold text-success">
            {invoices.filter((i: any) => i.status === "POSTED").length}
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
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Supplier</th>
                  <th className="text-end">Amount</th>
                  <th>Status</th>
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
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      No vendor invoices found
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv: any) => (
                    <tr key={inv.invoice_id}>
                      <td>
                        <code className="text-primary">{inv.invoice_number}</code>
                      </td>
                      <td>{new Date(inv.invoice_date).toLocaleDateString()}</td>
                      <td>
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="fw-semibold">
                        {inv.supplier_name || `Supplier #${inv.supplier_key}`}
                      </td>
                      <td className="text-end fw-bold">
                        {(inv.total_amount || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            inv.status === "POSTED"
                              ? "bg-success"
                              : inv.status === "PAID"
                              ? "bg-primary"
                              : "bg-secondary"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => navigate(`/purchase/invoices/${inv.invoice_id}`)}
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
                  <td colSpan={4} className="text-end">
                    TOTAL:
                  </td>
                  <td className="text-end">
                    {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}