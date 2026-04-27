import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { http } from "../../../api/http";

interface PLAccount {
  account_code: string;
  account_name: string;
  account_type: string;
  amount: number;
}

interface PLData {
  accounts: PLAccount[];
  summary: {
    revenue: number;
    cogs: number;
    gross_profit: number;
    expenses: number;
    net_profit: number;
    profit_margin: number;
  };
}

async function fetchProfitLoss(dateFrom?: string, dateTo?: string) {
  const params: any = {};
  if (dateFrom) params.from = dateFrom;
  if (dateTo) params.to = dateTo;
  
  const res = await http.get("/api/reports/profit-loss/", { params });
  return res.data as PLData;
}

export default function ProfitLoss() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["profit-loss", dateFrom, dateTo],
    queryFn: () => fetchProfitLoss(dateFrom, dateTo),
  });

  const revenue = data?.accounts.filter(a => a.account_type === 'REVENUE') || [];
  const cogs = data?.accounts.filter(a => a.account_type === 'COGS') || [];
  const expenses = data?.accounts.filter(a => a.account_type === 'EXPENSE') || [];
  const summary = data?.summary;

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h2 className="fw-bold mb-1">Profit & Loss Statement</h2>
              <div className="text-muted">Income statement showing profitability</div>
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
          <div className="col-md-3">
            <div className="card-box">
              <div className="text-muted fw-semibold">Revenue</div>
              <div className="fs-3 fw-bold text-success">
                {summary.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card-box">
              <div className="text-muted fw-semibold">Gross Profit</div>
              <div className="fs-3 fw-bold text-info">
                {summary.gross_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card-box">
              <div className="text-muted fw-semibold">Net Profit</div>
              <div className={`fs-3 fw-bold ${summary.net_profit >= 0 ? 'text-primary' : 'text-danger'}`}>
                {summary.net_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card-box">
              <div className="text-muted fw-semibold">Profit Margin</div>
              <div className={`fs-3 fw-bold ${summary.profit_margin >= 0 ? 'text-success' : 'text-danger'}`}>
                {summary.profit_margin.toFixed(1)}%
              </div>
            </div>
          </div>
        </>
      )}

      {/* Detailed P&L */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table mb-0">
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-4">Loading...</td>
                  </tr>
                ) : !summary ? (
                  <tr>
                    <td colSpan={3} className="text-center py-4">
                      No data found. Post some journal entries first.
                    </td>
                  </tr>
                ) : (
                  <>
                    {/* REVENUE */}
                    <tr className="table-active">
                      <td colSpan={3} className="fw-bold fs-5">REVENUE</td>
                    </tr>
                    {revenue.map((acc) => (
                      <tr key={acc.account_code}>
                        <td style={{ paddingLeft: 30 }}>{acc.account_name}</td>
                        <td className="text-end" style={{ width: 200 }}>
                          {acc.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ width: 50 }}></td>
                      </tr>
                    ))}
                    <tr className="fw-bold">
                      <td>Total Revenue</td>
                      <td className="text-end text-success">
                        {summary.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td></td>
                    </tr>

                    {/* COGS */}
                    <tr className="table-active">
                      <td colSpan={3} className="fw-bold fs-5 pt-3">COST OF GOODS SOLD</td>
                    </tr>
                    {cogs.map((acc) => (
                      <tr key={acc.account_code}>
                        <td style={{ paddingLeft: 30 }}>{acc.account_name}</td>
                        <td className="text-end">
                          ({Math.abs(acc.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                        </td>
                        <td></td>
                      </tr>
                    ))}
                    <tr className="fw-bold">
                      <td>Total COGS</td>
                      <td className="text-end text-danger">
                        ({summary.cogs.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                      </td>
                      <td></td>
                    </tr>

                    {/* GROSS PROFIT */}
                    <tr className="table-primary fw-bold">
                      <td>GROSS PROFIT</td>
                      <td className="text-end"></td>
                      <td className="text-end">
                        {summary.gross_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* EXPENSES */}
                    <tr className="table-active">
                      <td colSpan={3} className="fw-bold fs-5 pt-3">OPERATING EXPENSES</td>
                    </tr>
                    {expenses.map((acc) => (
                      <tr key={acc.account_code}>
                        <td style={{ paddingLeft: 30 }}>{acc.account_name}</td>
                        <td className="text-end">
                          ({Math.abs(acc.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                        </td>
                        <td></td>
                      </tr>
                    ))}
                    <tr className="fw-bold">
                      <td>Total Expenses</td>
                      <td className="text-end text-danger">
                        ({summary.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                      </td>
                      <td></td>
                    </tr>

                    {/* NET PROFIT */}
                    <tr className="table-success fw-bold fs-5">
                      <td>NET PROFIT</td>
                      <td className="text-end"></td>
                      <td className={`text-end ${summary.net_profit >= 0 ? 'text-primary' : 'text-danger'}`}>
                        {summary.net_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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