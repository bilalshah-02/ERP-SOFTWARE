// src/pages/financial/JournalEntry.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createJournalEntry } from "../../api/financial";
import { http } from "../../api/http";
import FormWrapper from "../../components/FormWrapper";

interface Account {
  account_key: number;
  account_code: string;
  account_name: string;
}

interface JournalLine {
  account_key: number;
  account_code?: string;
  account_name?: string;
  description: string;
  debit: number;
  credit: number;
  cost_center_key?: number;
  project_job_id?: number;
}

export default function JournalEntry() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [journalDate, setJournalDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([
    { account_key: 0, description: "", debit: 0, credit: 0 },
    { account_key: 0, description: "", debit: 0, credit: 0 },
  ]);

  // Fetch accounts
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await http.get("/api/accounts/", {
        params: { is_posting: true, is_active: true },
      });
      return res.data as Account[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: { journal_entry: any; post: boolean }) => {
      return createJournalEntry({
        ...data.journal_entry,
        status: data.post ? "POSTED" : "DRAFT",
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["gl-dashboard"] });
      alert(
        `Journal Entry ${data.status === "POSTED" ? "posted" : "saved as draft"} successfully!\nJournal Number: ${data.journal_number}`
      );
      navigate("/financial/journal-list");
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    },
  });

  // Calculate totals
  const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01;

  // Add line
  const addLine = () => {
    setLines([
      ...lines,
      { account_key: 0, description: "", debit: 0, credit: 0 },
    ]);
  };

  // Remove line
  const removeLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  // Update line
  const updateLine = (index: number, field: keyof JournalLine, value: any) => {
    const newLines = [...lines];
    (newLines[index] as any)[field] = value;

    // If account changed, update account details
    if (field === "account_key") {
      const account = accounts.find((a) => a.account_key === Number(value));
      if (account) {
        newLines[index].account_code = account.account_code;
        newLines[index].account_name = account.account_name;
      }
    }

    setLines(newLines);
  };

  // Handle submit
  const handleSubmit = (post: boolean) => {
    // Validation
    if (!journalDate) {
      alert("Journal date is required!");
      return;
    }

    if (lines.length < 2) {
      alert("At least 2 lines are required!");
      return;
    }

    // Check all lines have accounts
    const invalidLines = lines.filter(
      (line) => !line.account_key || line.account_key === 0
    );
    if (invalidLines.length > 0) {
      alert("All lines must have an account selected!");
      return;
    }

    // Check balance
    if (!isBalanced) {
      alert(
        `Journal entry is not balanced!\nDebit: ${totalDebit.toLocaleString()}\nCredit: ${totalCredit.toLocaleString()}\nDifference: ${difference.toLocaleString()}`
      );
      return;
    }

    // Check at least one debit and one credit
    const hasDebit = lines.some((line) => line.debit > 0);
    const hasCredit = lines.some((line) => line.credit > 0);
    if (!hasDebit || !hasCredit) {
      alert("Journal entry must have at least one debit and one credit!");
      return;
    }

    // Prepare data
    const journalEntry = {
      journal_date: journalDate,
      description: description || "Manual Journal Entry",
      lines: lines
        .filter((line) => line.debit > 0 || line.credit > 0)
        .map((line) => ({
          account_key: line.account_key,
          description: line.description,
          debit: Number(line.debit) || 0,
          credit: Number(line.credit) || 0,
          cost_center_key: line.cost_center_key || undefined,
          project_job_id: line.project_job_id || undefined,
        })),
    };

    createMutation.mutate({ journal_entry: journalEntry, post });
  };

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold mb-1">Journal Entry</h2>
              <div className="text-muted">
                Create manual general ledger entries
              </div>
            </div>
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate("/financial/journal-list")}
            >
              ← Back to List
            </button>
          </div>
        </div>
      </div>

      {/* Balance Alert */}
      {!isBalanced && totalDebit > 0 && totalCredit > 0 && (
        <div className="col-12">
          <div className="alert alert-danger">
            <strong>⚠️ Entry Not Balanced!</strong>
            <div className="mt-2">
              Difference: {difference.toLocaleString()} (Debit:{" "}
              {totalDebit.toLocaleString()}, Credit:{" "}
              {totalCredit.toLocaleString()})
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="col-12">
        <div className="card-box">
          {/* Header Fields */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label">Journal Date*</label>
              <input
                type="date"
                className="form-control"
                value={journalDate}
                onChange={(e) => setJournalDate(e.target.value)}
                required
              />
            </div>
            <div className="col-md-8">
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter journal entry description"
              />
            </div>
          </div>

          {/* Journal Lines */}
          <div className="table-responsive">
            <table className="table table-bordered mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "30%" }}>Account*</th>
                  <th style={{ width: "30%" }}>Description</th>
                  <th style={{ width: "15%" }} className="text-end">
                    Debit
                  </th>
                  <th style={{ width: "15%" }} className="text-end">
                    Credit
                  </th>
                  <th style={{ width: "10%" }} className="text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index}>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={line.account_key}
                        onChange={(e) =>
                          updateLine(index, "account_key", Number(e.target.value))
                        }
                        required
                      >
                        <option value={0}>Select Account</option>
                        {accounts.map((account) => (
                          <option
                            key={account.account_key}
                            value={account.account_key}
                          >
                            {account.account_code} - {account.account_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={line.description}
                        onChange={(e) =>
                          updateLine(index, "description", e.target.value)
                        }
                        placeholder="Line description"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm text-end"
                        value={line.debit || ""}
                        onChange={(e) =>
                          updateLine(index, "debit", e.target.value)
                        }
                        placeholder="0.00"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm text-end"
                        value={line.credit || ""}
                        onChange={(e) =>
                          updateLine(index, "credit", e.target.value)
                        }
                        placeholder="0.00"
                        step="0.01"
                      />
                    </td>
                    <td className="text-center">
                      {lines.length > 2 && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeLine(index)}
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {/* Totals Row */}
                <tr className="table-active fw-bold">
                  <td colSpan={2} className="text-end">
                    TOTALS:
                  </td>
                  <td className="text-end">
                    <span
                      className={
                        isBalanced ? "text-success" : "text-danger"
                      }
                    >
                      {totalDebit.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </td>
                  <td className="text-end">
                    <span
                      className={
                        isBalanced ? "text-success" : "text-danger"
                      }
                    >
                      {totalCredit.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </td>
                  <td className="text-center">
                    {isBalanced ? (
                      <span className="badge bg-success">✓</span>
                    ) : (
                      <span className="badge bg-danger">✗</span>
                    )}
                  </td>
                </tr>

                {/* Difference Row */}
                {!isBalanced && (
                  <tr className="table-warning">
                    <td colSpan={2} className="text-end">
                      DIFFERENCE:
                    </td>
                    <td colSpan={3} className="text-end fw-bold text-danger">
                      {difference.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add Line Button */}
          <button
            className="btn btn-outline-primary mt-3"
            onClick={addLine}
          >
            + Add Line
          </button>

          {/* Action Buttons */}
          <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
            <div>
              {isBalanced ? (
                <span className="badge bg-success fs-6">
                  ✓ Entry Balanced
                </span>
              ) : (
                <span className="badge bg-danger fs-6">
                  ⚠️ Not Balanced (Diff: {difference.toLocaleString()})
                </span>
              )}
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-secondary"
                onClick={() => handleSubmit(false)}
                disabled={createMutation.isPending || !isBalanced}
              >
                Save as Draft
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleSubmit(true)}
                disabled={createMutation.isPending || !isBalanced}
              >
                {createMutation.isPending ? "Posting..." : "Post Entry"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="col-12">
        <div className="card-box">
          <h5 className="fw-bold mb-3">💡 Journal Entry Guide</h5>
          <div className="row">
            <div className="col-md-4">
              <div className="mb-3">
                <strong>📝 What is a Journal Entry?</strong>
                <p className="text-muted small mb-0">
                  A journal entry records financial transactions in the general
                  ledger. Every transaction must balance (Total Debit = Total
                  Credit).
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <strong>💰 Common Examples:</strong>
                <p className="text-muted small mb-0">
                  <strong>Expense:</strong> Dr: Expense, Cr: Bank
                  <br />
                  <strong>Revenue:</strong> Dr: Bank, Cr: Revenue
                  <br />
                  <strong>Asset Purchase:</strong> Dr: Asset, Cr: Bank
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <strong>⚖️ Balance Rule:</strong>
                <p className="text-muted small mb-0">
                  Total debits must equal total credits. The entry cannot be
                  posted until it balances.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}