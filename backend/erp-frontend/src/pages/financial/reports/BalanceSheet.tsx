import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { http } from "../../../api/http";

interface BSAccount {
  account_code: string;
  account_name: string;
  account_type: string;
  balance: number;
}

interface BSData {
  accounts: BSAccount[];
  summary: {
    total_assets: number;
    total_liabilities: number;
    total_equity: number;
    total_liabilities_equity: number;
    balanced: boolean;
  };
}

async function fetchBalanceSheet(dateTo?: string) {
  const params: any = {};
  if (dateTo) params.to = dateTo;
  
  const res = await http.get("/api/reports/balance-sheet/", { params });
  return res.data as BSData;
}

export default function BalanceSheet() {
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["balance-sheet", dateTo],
    queryFn: () => fetchBalanceSheet(dateTo),
  });

  const assets = data?.accounts.filter(a => a.account_type === 'ASSET') || [];
  const liabilities = data?.accounts.filter(a => a.account_type === 'LIABILITY') || [];
  const equity = data?.accounts.filter(a => a.account_type === 'EQUITY') || [];
  const summary = data?.summary;

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h2 className="fw-bold mb-1">Balance Sheet</h2>
              <div className="text-muted">Assets = Liabilities + Equity</div>
            </div>
            <button className="btn btn-primary" onClick={() => refetch()}>
              Refresh
            </button>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">As of Date</label>
              <input
                type="date"
                className="form-control"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Status</label>
              <div className="form-control">
                {summary?.balanced ? (
                  <span className="badge bg-success">✓ Balanced</span>
                ) : (
                  <span className="badge bg-danger">⚠ Not Balanced</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <>
          <div className="col-md-4">
            <div className="card-box">
              <div className="text-muted fw-semibold">Total Assets</div>
              <div className="fs-3 fw-bold text-primary">
                {summary.total_assets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card-box">
              <div className="text-muted fw-semibold">Total Liabilities</div>
              <div className="fs-3 fw-bold text-danger">
                {summary.total_liabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card-box">
              <div className="text-muted fw-semibold">Total Equity</div>
              <div className="fs-3 fw-bold text-success">
                {summary.total_equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Balance Sheet */}
      <div className="col-12">
        <div className="card-box">
          <div className="row">
            {/* LEFT SIDE - ASSETS */}
            <div className="col-md-6">
              <table className="table mb-0">
                <thead className="table-primary">
                  <tr>
                    <th className="fs-5">ASSETS</th>
                    <th className="text-end" style={{ width: 150 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={2} className="text-center py-4">Loading...</td>
                    </tr>
                  ) : assets.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="text-center py-4">No assets</td>
                    </tr>
                  ) : (
                    <>
                      {assets.map((acc) => (
                        <tr key={acc.account_code}>
                          <td>{acc.account_name}</td>
                          <td className="text-end">
                            {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                      <tr className="table-active fw-bold">
                        <td>TOTAL ASSETS</td>
                        <td className="text-end text-primary">
                          {summary?.total_assets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* RIGHT SIDE - LIABILITIES & EQUITY */}
            <div className="col-md-6">
              <table className="table mb-0">
                <thead className="table-danger">
                  <tr>
                    <th className="fs-5">LIABILITIES & EQUITY</th>
                    <th className="text-end" style={{ width: 150 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={2} className="text-center py-4">Loading...</td>
                    </tr>
                  ) : (
                    <>
                      {/* LIABILITIES */}
                      <tr className="table-light">
                        <td colSpan={2} className="fw-semibold">Liabilities</td>
                      </tr>
                      {liabilities.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="text-muted" style={{ paddingLeft: 30 }}>
                            No liabilities
                          </td>
                        </tr>
                      ) : (
                        liabilities.map((acc) => (
                          <tr key={acc.account_code}>
                            <td style={{ paddingLeft: 30 }}>{acc.account_name}</td>
                            <td className="text-end">
                              {Math.abs(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                      <tr className="fw-semibold">
                        <td style={{ paddingLeft: 30 }}>Total Liabilities</td>
                        <td className="text-end text-danger">
                          {summary?.total_liabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>

                      {/* EQUITY */}
                      <tr className="table-light">
                        <td colSpan={2} className="fw-semibold pt-3">Equity</td>
                      </tr>
                      {equity.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="text-muted" style={{ paddingLeft: 30 }}>
                            No equity
                          </td>
                        </tr>
                      ) : (
                        equity.map((acc) => (
                          <tr key={acc.account_code}>
                            <td style={{ paddingLeft: 30 }}>{acc.account_name}</td>
                            <td className="text-end">
                              {Math.abs(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                      <tr className="fw-semibold">
                        <td style={{ paddingLeft: 30 }}>Total Equity</td>
                        <td className="text-end text-success">
                          {summary?.total_equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>

                      {/* TOTAL */}
                      <tr className="table-active fw-bold">
                        <td>TOTAL LIABILITIES & EQUITY</td>
                        <td className="text-end text-primary">
                          {summary?.total_liabilities_equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
    </div>
  );
}