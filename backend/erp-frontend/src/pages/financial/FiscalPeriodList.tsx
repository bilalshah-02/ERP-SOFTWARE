// src/pages/financial/FiscalPeriodList.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPeriods,
  createPeriod,
  closePeriod,
  reopenPeriod,
  type FiscalPeriod,
} from "../../api/financial";
import FormWrapper from "../../components/FormWrapper";

export default function FiscalPeriodList() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FiscalPeriod>({
    period_code: "",
    start_date: "",
    end_date: "",
    is_closed: false,
  });

  const queryClient = useQueryClient();

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ["periods"],
    queryFn: () => fetchPeriods(),
  });

  const createMutation = useMutation({
    mutationFn: createPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periods"] });
      setShowForm(false);
      resetForm();
      alert("Period created successfully!");
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Error creating period");
    },
  });

  const closeMutation = useMutation({
    mutationFn: closePeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periods"] });
      alert("Period closed successfully!");
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Error closing period");
    },
  });

  const reopenMutation = useMutation({
    mutationFn: reopenPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periods"] });
      alert("Period reopened successfully!");
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Error reopening period");
    },
  });

  const resetForm = () => {
    setFormData({
      period_code: "",
      start_date: "",
      end_date: "",
      is_closed: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClosePeriod = (id: number, periodCode: string) => {
    if (
      window.confirm(
        `Close Period ${periodCode}? This will prevent further transactions in this period.`
      )
    ) {
      closeMutation.mutate(id);
    }
  };

  const handleReopenPeriod = (id: number, periodCode: string) => {
    if (
      window.confirm(
        `Reopen Period ${periodCode}? This will allow transactions again.`
      )
    ) {
      reopenMutation.mutate(id);
    }
  };

  if (showForm) {
    return (
      <FormWrapper
        title="Create Fiscal Period"
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false);
          resetForm();
        }}
        isLoading={createMutation.isPending}
      >
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label">Period Code*</label>
            <input
              type="text"
              className="form-control"
              name="period_code"
              value={formData.period_code}
              onChange={handleChange}
              required
              placeholder="2025-01"
            />
            <small className="text-muted">
              Example: 2025-01 for January 2025
            </small>
          </div>

          <div className="col-md-6">
            <label className="form-label">Start Date*</label>
            <input
              type="date"
              className="form-control"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">End Date*</label>
            <input
              type="date"
              className="form-control"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-12">
            <div className="alert alert-info">
              <strong>💡 Tip:</strong> Fiscal periods help organize your
              accounting by time frame. Periods can be closed to prevent changes
              to historical data.
            </div>
          </div>
        </div>
      </FormWrapper>
    );
  }

  return (
    <div className="row g-4">
      <div className="col-12">
        <div className="card-box d-flex align-items-center justify-content-between">
          <div>
            <h2 className="fw-bold mb-1">Fiscal Periods</h2>
            <div className="text-muted">Manage accounting periods</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Create Period
          </button>
        </div>
      </div>

      {/* Periods Table */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Period Code</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Duration (Days)</th>
                  <th style={{ width: 200 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center">
                      Loading...
                    </td>
                  </tr>
                ) : periods.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center">
                      No periods found. Create your first period!
                    </td>
                  </tr>
                ) : (
                  periods.map((period: FiscalPeriod) => {
                    // Calculate duration
                    const startDate = new Date(period.start_date);
                    const endDate = new Date(period.end_date);
                    const durationDays = Math.ceil(
                      (endDate.getTime() - startDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                    );

                    return (
                      <tr key={period.period_key}>
                        <td className="fw-bold">{period.period_code}</td>
                        <td>
                          {new Date(period.start_date).toLocaleDateString()}
                        </td>
                        <td>
                          {new Date(period.end_date).toLocaleDateString()}
                        </td>
                        <td>
                          {period.is_closed ? (
                            <span className="badge bg-danger">Closed</span>
                          ) : (
                            <span className="badge bg-success">Open</span>
                          )}
                        </td>
                        <td>{durationDays} days</td>
                        <td>
                          {period.is_closed ? (
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() =>
                                handleReopenPeriod(
                                  period.period_key!,
                                  period.period_code
                                )
                              }
                              disabled={reopenMutation.isPending}
                            >
                              Reopen
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                handleClosePeriod(
                                  period.period_key!,
                                  period.period_code
                                )
                              }
                              disabled={closeMutation.isPending}
                            >
                              Close Period
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {periods.length > 0 && (
            <div className="mt-3 pt-3 border-top">
              <div className="row text-center">
                <div className="col-md-4">
                  <div className="text-muted small">Total Periods</div>
                  <div className="fs-5 fw-bold">{periods.length}</div>
                </div>
                <div className="col-md-4">
                  <div className="text-muted small">Open Periods</div>
                  <div className="fs-5 fw-bold text-success">
                    {periods.filter((p: any) => !p.is_closed).length}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-muted small">Closed Periods</div>
                  <div className="fs-5 fw-bold text-danger">
                    {periods.filter((p: any) => p.is_closed).length}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="col-12">
        <div className="card-box">
          <h5 className="fw-bold mb-3">About Fiscal Periods</h5>
          <div className="row">
            <div className="col-md-4">
              <div className="d-flex align-items-start mb-3">
                <div className="text-primary me-3" style={{ fontSize: "24px" }}>
                  📅
                </div>
                <div>
                  <strong>Period Organization</strong>
                  <div className="text-muted small">
                    Group transactions by time periods (monthly, quarterly, etc.)
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-start mb-3">
                <div className="text-primary me-3" style={{ fontSize: "24px" }}>
                  🔒
                </div>
                <div>
                  <strong>Period Closure</strong>
                  <div className="text-muted small">
                    Close periods to lock historical data and prevent changes
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-start mb-3">
                <div className="text-primary me-3" style={{ fontSize: "24px" }}>
                  📊
                </div>
                <div>
                  <strong>Financial Reporting</strong>
                  <div className="text-muted small">
                    Generate reports for specific periods (monthly, quarterly, annual)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}