// src/pages/sales/CustomerInvoiceList.tsx - FIXED VERSION
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchCustomerInvoices } from "../../api/sales";
import { useState } from "react";

export default function CustomerInvoiceList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ FIX: Handle new response structure
  const { data, isLoading } = useQuery({
    queryKey: ["customer-invoices"],
    queryFn: fetchCustomerInvoices,
  });

  // ✅ FIX: Extract invoices array
  const invoices = data?.invoices || [];

  // Filter invoices based on search
  const filteredInvoices = invoices.filter((invoice: any) =>
    invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
              <h2 className="fw-bold mb-1">Customer Invoices</h2>
              <div className="text-muted">Manage customer invoices</div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/sales/invoices/create")}
            >
              + Create Invoice
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
            placeholder="Search by invoice number or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Customer</th>
                  <th>Invoice Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      {searchTerm ? "No invoices match your search" : "No invoices yet. Create your first invoice!"}
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice: any) => (
                    <tr key={invoice.invoice_id}>
                      <td className="fw-bold">{invoice.invoice_number}</td>
                      <td>{invoice.customer_name || 'N/A'}</td>
                      <td>{invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'N/A'}</td>
                      <td>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</td>
                      <td className="fw-bold text-success">
                        {(invoice.total_amount || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td>
                        <span className={`badge bg-${invoice.status === 'POSTED' ? 'success' : 'secondary'}`}>
                          {invoice.status || 'DRAFT'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {filteredInvoices.length > 0 && (
            <div className="mt-3 pt-3 border-top">
              <div className="row text-center">
                <div className="col-md-4">
                  <div className="text-muted small">Total Invoices</div>
                  <div className="fs-5 fw-bold">{filteredInvoices.length}</div>
                </div>
                <div className="col-md-4">
                  <div className="text-muted small">Total Amount</div>
                  <div className="fs-5 fw-bold text-success">
                    {filteredInvoices
                      .reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0)
                      .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-muted small">Posted</div>
                  <div className="fs-5 fw-bold">
                    {filteredInvoices.filter((i: any) => i.status === 'POSTED').length}
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