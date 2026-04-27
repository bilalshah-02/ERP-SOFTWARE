// src/pages/financial/JournalEntryList.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchJournalEntries, deleteJournalEntry } from "../../api/financial";
import { useState } from "react";

export default function JournalEntryList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: journals = [], isLoading } = useQuery({
    queryKey: ["journal-entries", statusFilter],
    queryFn: () =>
      fetchJournalEntries({
        status: statusFilter || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJournalEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      alert("Journal entry deleted successfully!");
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    },
  });

  const handleDelete = (id: number, journalNumber: string) => {
    if (window.confirm(`Delete Journal Entry ${journalNumber}?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Filter journals based on search
  const filteredJournals = journals.filter((journal: any) =>
    journal.journal_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    journal.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get unique statuses
  const uniqueStatuses = [...new Set(journals.map((j: any) => j.status).filter(Boolean))];

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
              <h2 className="fw-bold mb-1">Journal Entries</h2>
              <div className="text-muted">Manage general ledger entries</div>
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

      {/* Search & Filters */}
      <div className="col-12">
        <div className="card-box">
          <div className="row g-3">
            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="Search by journal number or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Journal Entries Table */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Journal Number</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th className="text-end">Total Debit</th>
                  <th className="text-end">Total Credit</th>
                  <th className="text-end">Line Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJournals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      {searchTerm || statusFilter
                        ? "No journal entries match your filters"
                        : "No journal entries yet. Create your first entry!"}
                    </td>
                  </tr>
                ) : (
                  filteredJournals.map((journal: any) => {
                    // Calculate totals from lines
                    const totalDebit =
                      journal.lines?.reduce(
                        (sum: number, line: any) => sum + (Number(line.debit) || 0),
                        0
                      ) || 0;
                    const totalCredit =
                      journal.lines?.reduce(
                        (sum: number, line: any) => sum + (Number(line.credit) || 0),
                        0
                      ) || 0;

                    return (
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
                        <td className="text-end">{totalDebit.toLocaleString()}</td>
                        <td className="text-end">{totalCredit.toLocaleString()}</td>
                        <td className="text-end">{journal.lines?.length || 0}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() =>
                                navigate(`/financial/journal-entries/${journal.gl_id}`)
                              }
                            >
                              View
                            </button>
                            {journal.status === "DRAFT" && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() =>
                                  handleDelete(journal.gl_id!, journal.journal_number!)
                                }
                                disabled={deleteMutation.isPending}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {filteredJournals.length > 0 && (
            <div className="mt-3 pt-3 border-top">
              <div className="row text-center">
                <div className="col-md-3">
                  <div className="text-muted small">Total Journals</div>
                  <div className="fs-5 fw-bold">{filteredJournals.length}</div>
                </div>
                <div className="col-md-3">
                  <div className="text-muted small">Draft</div>
                  <div className="fs-5 fw-bold text-secondary">
                    {
                      filteredJournals.filter((j: any) => j.status === "DRAFT")
                        .length
                    }
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-muted small">Posted</div>
                  <div className="fs-5 fw-bold text-success">
                    {
                      filteredJournals.filter((j: any) => j.status === "POSTED")
                        .length
                    }
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-muted small">Balanced</div>
                  <div className="fs-5 fw-bold text-info">
                    {filteredJournals.length}
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