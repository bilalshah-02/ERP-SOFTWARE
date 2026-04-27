import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { http } from "../../api/http";

interface ProcessCost {
  cost_center_key: number;
  cost_center_code: string;
  cost_center_name: string;
  total_debit: number;
  total_credit: number;
  net_cost: number;
}

async function fetchProcessCosts(dateFrom?: string, dateTo?: string) {
  const params: any = {};
  if (dateFrom) params.from = dateFrom;
  if (dateTo) params.to = dateTo;
  
  const res = await http.get("/api/costing/process/", { params });
  return res.data as ProcessCost[];
}

export default function ProcessCosting() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  const { data: processes = [], isLoading, refetch } = useQuery({
    queryKey: ["process-costing", dateFrom, dateTo],
    queryFn: () => fetchProcessCosts(dateFrom, dateTo),
  });

  const filtered = processes.filter((p) =>
    p.cost_center_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.cost_center_code?.toLowerCase().includes(search.toLowerCase())
  );

  const totalNetCost = filtered.reduce((sum, p) => sum + (p.net_cost || 0), 0);

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box d-flex align-items-center justify-content-between">
          <div>
            <h2 className="fw-bold mb-1">Process Cost Summary</h2>
            <div className="text-muted">Costs by process cost centers</div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => refetch()}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="col-12">
        <div className="card-box">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search process..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Date From</label>
              <input
                type="date"
                className="form-control"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="col-md-4">
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

      {/* Stats */}
      <div className="col-md-4">
        <div className="card-box">
          <div className="text-muted fw-semibold">Total Processes</div>
          <div className="fs-3 fw-bold">{filtered.length}</div>
        </div>
      </div>

      <div className="col-md-4">
        <div className="card-box">
          <div className="text-muted fw-semibold">Total Debit</div>
          <div className="fs-3 fw-bold text-danger">
            {filtered.reduce((sum, p) => sum + (p.total_debit || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="col-md-4">
        <div className="card-box">
          <div className="text-muted fw-semibold">Net Cost</div>
          <div className="fs-3 fw-bold text-primary">
            {totalNetCost.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Process Name</th>
                  <th className="text-end">Total Debit</th>
                  <th className="text-end">Total Credit</th>
                  <th className="text-end fw-bold">Net Cost</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center">Loading...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center">
                      No process cost data found
                    </td>
                  </tr>
                ) : (
                  filtered.map((process) => (
                    <tr key={process.cost_center_key}>
                      <td>
                        <span className="badge bg-secondary">
                          {process.cost_center_code}
                        </span>
                      </td>
                      <td className="fw-semibold">{process.cost_center_name}</td>
                      <td className="text-end text-danger">
                        {(process.total_debit || 0).toLocaleString()}
                      </td>
                      <td className="text-end text-success">
                        {(process.total_credit || 0).toLocaleString()}
                      </td>
                      <td className="text-end fw-bold">
                        {(process.net_cost || 0).toLocaleString()}
                      </td>
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