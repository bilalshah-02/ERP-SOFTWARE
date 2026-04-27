import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { http } from "../../../api/http";

interface TrialBalanceRow {
  account_key: number;
  account_code: string;
  account_name: string;
  account_type: string;
  total_debit: number;
  total_credit: number;
  balance: number;
}

async function fetchTrialBalance(dateFrom?: string, dateTo?: string) {
  const params: any = {};
  if (dateFrom) params.from = dateFrom;
  if (dateTo) params.to = dateTo;
  
  const res = await http.get("/api/reports/trial-balance/", { params });
  return res.data as TrialBalanceRow[];
}

export default function TrialBalance() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: accounts = [], isLoading, refetch } = useQuery({
    queryKey: ["trial-balance", dateFrom, dateTo],
    queryFn: () => fetchTrialBalance(dateFrom, dateTo),
  });

  const totalDebit = accounts.reduce((sum, a) => sum + (a.total_debit || 0), 0);
  const totalCredit = accounts.reduce((sum, a) => sum + (a.total_credit || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h2 className="fw-bold mb-1">Trial Balance</h2>
              <div className="text-muted">All accounts with debit/credit balances</div>
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

      {/* Summary */}
      <div className="col-md-4">
        <div className="card-box">
          <div className="text-muted fw-semibold">Total Debit</div>
          <div className="fs-3 fw-bold text-danger">
            {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="col-md-4">
        <div className="card-box">
          <div className="text-muted fw-semibold">Total Credit</div>
          <div className="fs-3 fw-bold text-success">
            {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="col-md-4">
        <div className="card-box">
          <div className="text-muted fw-semibold">Difference</div>
          <div className={`fs-3 fw-bold ${difference < 0.01 ? 'text-success' : 'text-danger'}`}>
            {difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          {difference < 0.01 && (
            <small className="text-success">✓ Balanced</small>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Account Code</th>
                  <th>Account Name</th>
                  <th>Type</th>
                  <th className="text-end">Debit</th>
                  <th className="text-end">Credit</th>
                  <th className="text-end">Balance</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">Loading...</td>
                  </tr>
                ) : accounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      No data found. Post some journal entries first.
                    </td>
                  </tr>
                ) : (
                  <>
                    {accounts.map((acc) => (
                      <tr key={acc.account_key}>
                        <td>
                          <code className="text-primary">{acc.account_code}</code>
                        </td>
                        <td className="fw-semibold">{acc.account_name}</td>
                        <td>
                          <span className="badge bg-secondary">{acc.account_type}</span>
                        </td>
                        <td className="text-end">
                          {acc.total_debit > 0
                            ? acc.total_debit.toLocaleString(undefined, { minimumFractionDigits: 2 })
                            : "—"}
                        </td>
                        <td className="text-end">
                          {acc.total_credit > 0
                            ? acc.total_credit.toLocaleString(undefined, { minimumFractionDigits: 2 })
                            : "—"}
                        </td>
                        <td className="text-end fw-bold">
                          {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    <tr className="table-active fw-bold">
                      <td colSpan={3} className="text-end">TOTAL:</td>
                      <td className="text-end text-danger">
                        {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-end text-success">
                        {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-end">
                        {difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}