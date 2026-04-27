// src/pages/financial/GlDashboard.tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchGlDashboard } from "../../api/financial";

export default function GlDashboard() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["gl-dashboard"],
    queryFn: () => fetchGlDashboard(),
  });

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const journalStats = data?.journal_statistics || {
    total_journals: 0,
    by_status: {},
    current_period: null,
    total_debit: 0,
    total_credit: 0,
    out_of_balance: 0,
    total_lines: 0,
  };

  const chartOfAccounts = data?.chart_of_accounts || {
    total_accounts: 0,
    by_type: {},
    active: 0,
    inactive: 0,
    posting: 0,
    non_posting: 0,
  };

  const accountActivity = data?.account_activity || {
    accounts_with_recent_activity: 0,
    total_accounts: 0,
    activity_rate: 0,
    top_active_accounts: [],
  };

  const periodSummary = data?.period_summary || {
    total_periods: 0,
    open_periods: 0,
    closed_periods: 0,
    recent_periods: [],
  };

  const recentJournals = data?.recent_journals || [];

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold mb-1">General Ledger Dashboard</h2>
              <div className="text-muted">Financial accounting overview</div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/financial/journal-entry")}
            >
              + Create Journal Entry
            </button>
          </div>
        </div>
      </div>

      {/* GL Balance Alert */}
      {journalStats.out_of_balance > 0.01 && (
        <div className="col-12">
          <div className="alert alert-danger">
            <strong>⚠️ Books Out of Balance!</strong>
            <div className="mt-2">
              Difference: {journalStats.out_of_balance.toLocaleString()} PKR
            </div>
          </div>
        </div>
      )}

      {/* Journal Statistics */}
      <div className="col-12">
        <div className="card-box">
          <h5 className="fw-bold mb-3">Journal Entry Statistics</h5>
          <div className="row text-center">
            <div className="col-md-2">
              <div className="text-muted small">Total Journals</div>
              <div className="fs-4 fw-bold">{journalStats.total_journals}</div>
            </div>
            <div className="col-md-2">
              <div className="text-muted small">Total Debit</div>
              <div className="fs-4 fw-bold text-success">
                {journalStats.total_debit.toLocaleString()}
              </div>
            </div>
            <div className="col-md-2">
              <div className="text-muted small">Total Credit</div>
              <div className="fs-4 fw-bold text-info">
                {journalStats.total_credit.toLocaleString()}
              </div>
            </div>
            <div className="col-md-2">
              <div className="text-muted small">Total Lines</div>
              <div className="fs-4 fw-bold">{journalStats.total_lines}</div>
            </div>
            <div className="col-md-2">
              <div className="text-muted small">Balance</div>
              <div
                className={`fs-4 fw-bold ${
                  journalStats.out_of_balance < 0.01
                    ? "text-success"
                    : "text-danger"
                }`}
              >
                {journalStats.out_of_balance < 0.01 ? "✓ Balanced" : "❌ Out"}
              </div>
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-outline-primary btn-sm mt-2"
                onClick={() => navigate("/financial/journal-list")}
              >
                View All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Journal Status Breakdown & Chart of Accounts */}
      <div className="col-md-6">
        <div className="card-box">
          <h5 className="fw-bold mb-3">Journals by Status</h5>
          <div className="table-responsive">
            <table className="table table-sm mb-0">
              <tbody>
                {Object.entries(journalStats.by_status).map(([status, count]) => (
                  <tr key={status}>
                    <td className="fw-semibold">{status}</td>
                    <td className="text-end">
                      <span className="badge bg-primary">{count as number}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {Object.keys(journalStats.by_status).length === 0 && (
            <div className="text-center text-muted py-3">No journals yet</div>
          )}
        </div>
      </div>

      <div className="col-md-6">
        <div className="card-box">
          <h5 className="fw-bold mb-3">Chart of Accounts</h5>
          <div className="row text-center mb-3">
            <div className="col-6">
              <div className="text-muted small">Total Accounts</div>
              <div className="fs-5 fw-bold">{chartOfAccounts.total_accounts}</div>
            </div>
            <div className="col-6">
              <div className="text-muted small">Posting Accounts</div>
              <div className="fs-5 fw-bold text-primary">
                {chartOfAccounts.posting}
              </div>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-sm mb-0">
              <tbody>
                {Object.entries(chartOfAccounts.by_type).map(([type, count]) => (
                  <tr key={type}>
                    <td className="fw-semibold">{type}</td>
                    <td className="text-end">{count as number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="btn btn-outline-primary w-100 mt-3"
            onClick={() => navigate("/financial/chart-of-accounts")}
          >
            Manage Accounts
          </button>
        </div>
      </div>

      {/* Account Activity */}
      <div className="col-12">
        <div className="card-box">
          <h5 className="fw-bold mb-3">Account Activity (Last 30 Days)</h5>
          <div className="row text-center mb-3">
            <div className="col-md-4">
              <div className="text-muted small">Active Accounts</div>
              <div className="fs-5 fw-bold">
                {accountActivity.accounts_with_recent_activity}
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-muted small">Total Accounts</div>
              <div className="fs-5 fw-bold">{accountActivity.total_accounts}</div>
            </div>
            <div className="col-md-4">
              <div className="text-muted small">Activity Rate</div>
              <div className="fs-5 fw-bold text-info">
                {accountActivity.activity_rate.toFixed(1)}%
              </div>
            </div>
          </div>

          {accountActivity.top_active_accounts.length > 0 && (
            <>
              <h6 className="fw-bold mt-4 mb-3">Top Active Accounts</h6>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Account Name</th>
                      <th className="text-end">Transactions</th>
                      <th className="text-end">Total Debit</th>
                      <th className="text-end">Total Credit</th>
                      <th className="text-end">Net Movement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountActivity.top_active_accounts.map((account) => (
                      <tr key={account.account_key}>
                        <td className="fw-bold">{account.account_code}</td>
                        <td>{account.account_name}</td>
                        <td className="text-end">{account.transaction_count}</td>
                        <td className="text-end">
                          {account.total_debit.toLocaleString()}
                        </td>
                        <td className="text-end">
                          {account.total_credit.toLocaleString()}
                        </td>
                        <td
                          className={`text-end fw-bold ${
                            account.net_movement >= 0
                              ? "text-success"
                              : "text-danger"
                          }`}
                        >
                          {account.net_movement.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Period Summary & Recent Journals */}
      <div className="col-md-6">
        <div className="card-box">
          <h5 className="fw-bold mb-3">Fiscal Periods</h5>
          <div className="row text-center mb-3">
            <div className="col-4">
              <div className="text-muted small">Total</div>
              <div className="fs-5 fw-bold">{periodSummary.total_periods}</div>
            </div>
            <div className="col-4">
              <div className="text-muted small">Open</div>
              <div className="fs-5 fw-bold text-success">
                {periodSummary.open_periods || 0}
              </div>
            </div>
            <div className="col-4">
              <div className="text-muted small">Closed</div>
              <div className="fs-5 fw-bold text-secondary">
                {periodSummary.closed_periods || 0}
              </div>
            </div>
          </div>
          <button
            className="btn btn-outline-primary w-100"
            onClick={() => navigate("/financial/periods")}
          >
            Manage Periods
          </button>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card-box">
          <h5 className="fw-bold mb-3">Quick Actions</h5>
          <div className="d-grid gap-2">
            <button
              className="btn btn-outline-primary"
              onClick={() => navigate("/financial/journal-entry")}
            >
              📝 Create Journal Entry
            </button>
            <button
              className="btn btn-outline-primary"
              onClick={() => navigate("/financial/reports/trial-balance")}
            >
              📊 Trial Balance
            </button>
            <button
              className="btn btn-outline-primary"
              onClick={() => navigate("/financial/reports/profit-loss")}
            >
              💰 P&L Statement
            </button>
          </div>
        </div>
      </div>

      {/* Recent Journal Entries */}
      <div className="col-12">
        <div className="card-box">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">Recent Journal Entries</h5>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => navigate("/financial/journal-list")}
            >
              View All
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Journal Number</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th className="text-end">Total Debit</th>
                  <th className="text-end">Total Credit</th>
                  <th className="text-end">Lines</th>
                </tr>
              </thead>
              <tbody>
                {recentJournals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      No journal entries yet. Create your first entry!
                    </td>
                  </tr>
                ) : (
                  recentJournals.map((journal) => (
                    <tr key={journal.gl_id}>
                      <td className="fw-bold">{journal.journal_number}</td>
                      <td>
                        {new Date(journal.journal_date).toLocaleDateString()}
                      </td>
                      <td>{journal.description || "—"}</td>
                      <td>
                        <span
                          className={`badge bg-${
                            journal.status === "POSTED"
                              ? "success"
                              : journal.status === "DRAFT"
                              ? "secondary"
                              : "warning"
                          }`}
                        >
                          {journal.status}
                        </span>
                      </td>
                      <td className="text-end">
                        {journal.total_debit.toLocaleString()}
                      </td>
                      <td className="text-end">
                        {journal.total_credit.toLocaleString()}
                      </td>
                      <td className="text-end">{journal.line_count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}