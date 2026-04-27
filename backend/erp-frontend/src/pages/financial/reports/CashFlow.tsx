import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { http } from "../../../api/http";

interface CashFlowAccount {
  account_name: string;
  cash_in: number;
  cash_out: number;
  net_cash_flow: number;
}

interface CashFlowData {
  accounts: CashFlowAccount[];
  summary: {
    total_cash_in: number;
    total_cash_out: number;
    net_cash_flow: number;
  };
}

async function fetchCashFlow(dateFrom?: string, dateTo?: string) {
  const params: any = {};
  if (dateFrom) params.from = dateFrom;
  if (dateTo) params.to = dateTo;
  
  const res = await http.get("/api/reports/cash-flow/", { params });
  return res.data as CashFlowData;
}

export default function CashFlow() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["cash-flow", dateFrom, dateTo],
    queryFn: () => fetchCashFlow(dateFrom, dateTo),
  });

  const accounts = data?.accounts || [];
  const summary = data?.summary;

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h2 className="fw-bold mb-1">Cash Flow Statement</h2>
              <div className="text-muted">Track cash and bank account movements</div>
            </div>
            <button className="btn btn-primary" onClick={() => refetch()}>
              Refresh
            </button>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Date From</label>
              <input
                type="date"
                className="form-control"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Date To</label>
              <input
                type="date"
                className="form-control"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <>
          <div className="col-md-4">
            <div className="card-box">
              <div className="text-muted fw-semibold">Total Cash In</div>
              <div className="fs-3 fw-bold text-success">
                {summary.total_cash_in.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card-box">
              <div className="text-muted fw-semibold">Total Cash Out</div>
              <div className="fs-3 fw-bold text-danger">
                {summary.total_cash_out.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card-box">
              <div className="text-muted fw-semibold">Net Cash Flow</div>
              <div className={`fs-3 fw-bold ${summary.net_cash_flow >= 0 ? 'text-primary' : 'text-danger'}`}>
                {summary.net_cash_flow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Cash Flow Table */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Account</th>
                  <th className="text-end">Cash In</th>
                  <th className="text-end">Cash Out</th>
                  <th className="text-end fw-bold">Net Flow</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">Loading...</td>
                  </tr>
                ) : accounts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      No cash/bank account movements found
                    </td>
                  </tr>
                ) : (
                  <>
                    {accounts.map((acc, idx) => (
                      <tr key={idx}>
                        <td className="fw-semibold">{acc.account_name}</td>
                        <td className="text-end text-success">
                          {acc.cash_in.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="text-end text-danger">
                          {acc.cash_out.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`text-end fw-bold ${acc.net_cash_flow >= 0 ? 'text-primary' : 'text-danger'}`}>
                          {acc.net_cash_flow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    <tr className="table-active fw-bold">
                      <td>TOTAL</td>
                      <td className="text-end text-success">
                        {summary?.total_cash_in.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-end text-danger">
                        {summary?.total_cash_out.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`text-end ${summary && summary.net_cash_flow >= 0 ? 'text-primary' : 'text-danger'}`}>
                        {summary?.net_cash_flow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="col-12">
        <div className="alert alert-info mb-0">
          <strong>Note:</strong> This is a simplified cash flow statement showing movements in cash/bank accounts only. 
          For a complete cash flow statement with operating/investing/financing activities, additional categorization is needed.
        </div>
      </div>
    </div>
  );
}