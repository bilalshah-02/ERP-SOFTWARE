import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { http } from "../../api/http";

interface BatchCostSummary {
  prod_batch_key: number;
  batch_number: string;
  material_cost: number;
  labor_cost: number;
  equipment_cost: number;
  subcontract_cost: number;
  overhead_cost: number;
  total_cost: number;
}

async function fetchBatchCosts() {
  const res = await http.get("/api/costing/batches/");
  return res.data as BatchCostSummary[];
}

export default function BatchCosting() {
  const [search, setSearch] = useState("");

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ["batch-costing"],
    queryFn: fetchBatchCosts,
  });

  const filtered = batches.filter((b) =>
    b.batch_number?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCost = filtered.reduce((sum, b) => sum + (b.total_cost || 0), 0);
  const totalMaterial = filtered.reduce((sum, b) => sum + (b.material_cost || 0), 0);
  const totalLabor = filtered.reduce((sum, b) => sum + (b.labor_cost || 0), 0);

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box d-flex align-items-center justify-content-between">
          <div>
            <h2 className="fw-bold mb-1">Batch Cost Summary</h2>
            <div className="text-muted">Production batch costs breakdown</div>
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
            placeholder="Search by batch number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="col-md-3">
        <div className="card-box">
          <div className="text-muted fw-semibold">Total Batches</div>
          <div className="fs-3 fw-bold">{filtered.length}</div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card-box">
          <div className="text-muted fw-semibold">Total Cost</div>
          <div className="fs-3 fw-bold">{totalCost.toLocaleString()}</div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card-box">
          <div className="text-muted fw-semibold">Material Cost</div>
          <div className="fs-3 fw-bold text-primary">{totalMaterial.toLocaleString()}</div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card-box">
          <div className="text-muted fw-semibold">Labor Cost</div>
          <div className="fs-3 fw-bold text-success">{totalLabor.toLocaleString()}</div>
        </div>
      </div>

      {/* Table */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Batch #</th>
                  <th className="text-end">Material</th>
                  <th className="text-end">Labor</th>
                  <th className="text-end">Equipment</th>
                  <th className="text-end">Subcontract</th>
                  <th className="text-end">Overhead</th>
                  <th className="text-end fw-bold">Total Cost</th>
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
                      No batch cost data found
                    </td>
                  </tr>
                ) : (
                  filtered.map((batch) => (
                    <tr key={batch.prod_batch_key}>
                      <td className="fw-semibold">{batch.batch_number}</td>
                      <td className="text-end">{(batch.material_cost || 0).toLocaleString()}</td>
                      <td className="text-end">{(batch.labor_cost || 0).toLocaleString()}</td>
                      <td className="text-end">{(batch.equipment_cost || 0).toLocaleString()}</td>
                      <td className="text-end">{(batch.subcontract_cost || 0).toLocaleString()}</td>
                      <td className="text-end">{(batch.overhead_cost || 0).toLocaleString()}</td>
                      <td className="text-end fw-bold">
                        {(batch.total_cost || 0).toLocaleString()}
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