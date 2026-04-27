import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { http } from "../../../api/http";

interface AgingInvoice {
  party_code: string;
  name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  invoice_amount: number;
  paid_amount: number;
  balance: number;
  days_overdue: number;
}

interface AgingData {
  invoices: AgingInvoice[];
  aging_summary: {
    current: number;
    days_1_30: number;
    days_31_60: number;
    days_61_90: number;
    over_90: number;
    total_outstanding: number;
  };
}

async function fetchAging(type: string) {
  const res = await http.get("/api/reports/aging/", { params: { type } });
  return res.data as AgingData;
}

export default function AgingReport() {
  const [reportType, setReportType] = useState<"AR" | "AP">("AR");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["aging-report", reportType],
    queryFn: () => fetchAging(reportType),
  });

  const invoices = data?.invoices || [];
  const summary = data?.aging_summary;

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h2 className="fw-bold mb-1">
                {reportType === "AR" ? "Accounts Receivable" : "Accounts Payable"} Aging
              </h2>
              <div className="text-muted">Outstanding invoices by age</div>
            </div>
            <button className="btn btn-primary" onClick={() => refetch()}>
              Refresh
            </button>
          </div>

          <div className="btn-group" role="group">
            <button
              className={`btn ${reportType === "AR" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setReportType("AR")}
            >
              Receivables (AR)
            </button>
            <button
              className={`btn ${reportType === "AP" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setReportType("AP")}
            >
              Payables (AP)
            </button>
          </div>
        </div>
      </div>

      {/* Aging Buckets */}
      {summary && (
        <>
          <div className="col-md-2">
            <div className="card-box">
              <div className="text-muted fw-semibold small">Current</div>
              <div className="fs-5 fw-bold text-success">
                {summary.current.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="col-md-2">
            <div className="card-box">
              <div className="text-muted fw-semibold small">1-30 Days</div>
              <div className="fs-5 fw-bold text-info">
                {summary.days_1_30.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="col-md-2">
            <div className="card-box">
              <div className="text-muted fw-semibold small">31-60 Days</div>
              <div className="fs-5 fw-bold text-warning">
                {summary.days_31_60.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="col-md-2">
            <div className="card-box">
              <div className="text-muted fw-semibold small">61-90 Days</div>
              <div className="fs-5 fw-bold text-orange">
                {summary.days_61_90.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="col-md-2">
            <div className="card-box">
              <div className="text-muted fw-semibold small">Over 90 Days</div>
              <div className="fs-5 fw-bold text-danger">
                {summary.over_90.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="col-md-2">
            <div className="card-box">
              <div className="text-muted fw-semibold small">Total</div>
              <div className="fs-5 fw-bold text-primary">
                {summary.total_outstanding.toLocaleString()}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Invoice Details */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Party</th>
                  <th>Invoice #</th>
                  <th>Invoice Date</th>
                  <th>Due Date</th>
                  <th className="text-end">Amount</th>
                  <th className="text-end">Paid</th>
                  <th className="text-end">Balance</th>
                  <th className="text-center">Days Overdue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">Loading...</td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      No outstanding invoices found
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv, idx) => {
                    let statusColor = "success";
                    let statusText = "Current";
                    
                    if (inv.days_overdue > 90) {
                      statusColor = "danger";
                      statusText = "Critical";
                    } else if (inv.days_overdue > 60) {
                      statusColor = "warning";
                      statusText = "Overdue";
                    } else if (inv.days_overdue > 30) {
                      statusColor = "info";
                      statusText = "Due Soon";
                    } else if (inv.days_overdue > 0) {
                      statusColor = "secondary";
                      statusText = "Recent";
                    }

                    return (
                      <tr key={idx}>
                        <td className="fw-semibold">{inv.name}</td>
                        <td>
                          <code>{inv.invoice_number}</code>
                        </td>
                        <td>{new Date(inv.invoice_date).toLocaleDateString()}</td>
                        <td>{new Date(inv.due_date).toLocaleDateString()}</td>
                        <td className="text-end">
                          {inv.invoice_amount.toLocaleString()}
                        </td>
                        <td className="text-end text-success">
                          {inv.paid_amount.toLocaleString()}
                        </td>
                        <td className="text-end fw-bold">
                          {inv.balance.toLocaleString()}
                        </td>
                        <td className="text-center">
                          <span className={`badge bg-${statusColor}`}>
                            {inv.days_overdue > 0 ? `${inv.days_overdue} days` : "Current"}
                          </span>
                        </td>
                        <td>
                          <span className={`badge bg-${statusColor}`}>
                            {statusText}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}