import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { http } from "../../api/http";

interface ProjectProfitability {
  project_job_id: number;
  project_code: string;
  name: string;
  company_key: number;
  customer_key: number | null;
  cost_center_key: number | null;
  revenue: number;
  cost: number;
  profit: number;
}

async function fetchProjectProfitability() {
  const res = await http.get("/api/costing/projects/");
  return res.data as ProjectProfitability[];
}

export default function ProjectCosting() {
  const [search, setSearch] = useState("");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["project-profitability"],
    queryFn: fetchProjectProfitability,
  });

  const filtered = projects.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.project_code?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = filtered.reduce((sum, p) => sum + (p.revenue || 0), 0);
  const totalCost = filtered.reduce((sum, p) => sum + (p.cost || 0), 0);
  const totalProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box d-flex align-items-center justify-content-between">
          <div>
            <h2 className="fw-bold mb-1">Project Profitability</h2>
            <div className="text-muted">Job costing and profit analysis</div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="col-12">
        <div className="card-box">
          <input
            type="text"
            className="form-control"
            placeholder="Search by project name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="col-md-3">
        <div className="card-box">
          <div className="text-muted fw-semibold">Total Projects</div>
          <div className="fs-3 fw-bold">{filtered.length}</div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card-box">
          <div className="text-muted fw-semibold">Total Revenue</div>
          <div className="fs-3 fw-bold text-success">
            {totalRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card-box">
          <div className="text-muted fw-semibold">Total Cost</div>
          <div className="fs-3 fw-bold text-danger">
            {totalCost.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card-box">
          <div className="text-muted fw-semibold">Total Profit</div>
          <div className={`fs-3 fw-bold ${totalProfit >= 0 ? 'text-primary' : 'text-danger'}`}>
            {totalProfit.toLocaleString()}
          </div>
          <small className="text-muted">Margin: {profitMargin}%</small>
        </div>
      </div>

      {/* Table */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Project Code</th>
                  <th>Project Name</th>
                  <th className="text-end">Revenue</th>
                  <th className="text-end">Cost</th>
                  <th className="text-end">Profit</th>
                  <th className="text-end">Margin %</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center">Loading...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center">
                      No project data found
                    </td>
                  </tr>
                ) : (
                  filtered.map((project) => {
                    const profit = (project.revenue || 0) - (project.cost || 0);
                    const margin = project.revenue > 0
                      ? ((profit / project.revenue) * 100).toFixed(1)
                      : "0.0";
                    
                    return (
                      <tr key={project.project_job_id}>
                        <td>
                          <span className="badge bg-primary">
                            {project.project_code}
                          </span>
                        </td>
                        <td className="fw-semibold">{project.name}</td>
                        <td className="text-end text-success">
                          {(project.revenue || 0).toLocaleString()}
                        </td>
                        <td className="text-end text-danger">
                          {(project.cost || 0).toLocaleString()}
                        </td>
                        <td className={`text-end fw-bold ${profit >= 0 ? 'text-primary' : 'text-danger'}`}>
                          {profit.toLocaleString()}
                        </td>
                        <td className="text-end">
                          <span className={`badge ${parseFloat(margin) >= 0 ? 'bg-success' : 'bg-danger'}`}>
                            {margin}%
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${profit >= 0 ? 'bg-success' : 'bg-warning'}`}>
                            {profit >= 0 ? 'Profitable' : 'Loss'}
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