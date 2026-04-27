// src/pages/production/BatchCostBreakdown.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchBatchCostSummary, fetchProductionBatch } from "../../api/production";
import { Card, CardHeader, CardBody } from "../../components/ui/Cards";
import  Button  from "../../components/ui/Button";

export default function BatchCostBreakdown() {
  const { id } = useParams();
  const navigate = useNavigate();
  const batchId = parseInt(id || "0");

  // Fetch batch details
  const { data: batch, isLoading: batchLoading } = useQuery({
    queryKey: ["productionBatch", batchId],
    queryFn: () => fetchProductionBatch(batchId),
    enabled: batchId > 0,
  });

  // Fetch cost summary
  const { data: costSummary, isLoading: costLoading, error } = useQuery({
    queryKey: ["batchCostSummary", batchId],
    queryFn: () => fetchBatchCostSummary(batchId),
    enabled: batchId > 0,
  });

  if (batchLoading || costLoading) {
    return (
      <div className="container-fluid">
        <Card>
          <CardBody>
            <p>Loading cost breakdown...</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <Card>
          <CardHeader title="Error" />
          <CardBody>
            <p className="text-red-600">
              Error loading cost breakdown: {(error as any).message}
            </p>
            <Button
              onClick={() => navigate(`/production/batches/${batchId}`)}
              className="mt-4"
            >
              Back to Batch
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const breakdown = costSummary?.cost_breakdown || {};
  const materialCost = breakdown.material?.amount || 0;
  const laborCost = breakdown.labor?.amount || 0;
  const overheadCost = breakdown.overhead?.amount || 0;
  const totalCost = costSummary?.total_cost || materialCost + laborCost + overheadCost;
  const unitCost = costSummary?.unit_cost || 0;
  const quantity = costSummary?.planned_qty || batch?.planned_quantity || 0;

  // Calculate percentages
  const materialPercent = totalCost > 0 ? (materialCost / totalCost) * 100 : 0;
  const laborPercent = totalCost > 0 ? (laborCost / totalCost) * 100 : 0;
  const overheadPercent = totalCost > 0 ? (overheadCost / totalCost) * 100 : 0;

  const costingComplete = costSummary?.costing_complete || false;

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Cost Breakdown</h2>
          <p className="text-muted mb-0">
            Batch: {batch?.batch_number || costSummary?.batch_number || `#${batchId}`}
          </p>
          <p className="text-muted mb-0">
            Status: {batch?.status || costSummary?.status || "Unknown"}
          </p>
        </div>
        <Button
          onClick={() => navigate(`/production/batches/${batchId}`)}
        >
          Back to Batch
        </Button>
      </div>

      {/* Costing Status Alert */}
      {!costingComplete && (
        <div className="alert alert-warning mb-4">
          <strong>⚠️ Incomplete Costing:</strong> Some cost components are missing. 
          Add labor and overhead for complete product costing.
        </div>
      )}

      {/* Cost Summary Card */}
      <div className="row">
        {/* Left: Cost Breakdown */}
        <div className="col-md-6">
          <Card>
            <CardHeader title="Cost Components" />
            <CardBody>
              {/* Material */}
              <div className="mb-3 pb-3 border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">Material Cost</h6>
                    <small className="text-muted">
                      {materialPercent.toFixed(1)}% of total cost
                      {breakdown.material?.entries && ` (${breakdown.material.entries} entries)`}
                    </small>
                  </div>
                  <div className="fs-4 fw-bold text-primary">
                    ${materialCost.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Labor */}
              <div className="mb-3 pb-3 border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">Labor Cost</h6>
                    <small className="text-muted">
                      {laborPercent.toFixed(1)}% of total cost
                      {breakdown.labor?.entries && ` (${breakdown.labor.entries} entries)`}
                    </small>
                  </div>
                  <div className="fs-4 fw-bold text-success">
                    ${laborCost.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Overhead */}
              <div className="mb-3 pb-3 border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">Overhead Cost</h6>
                    <small className="text-muted">
                      {overheadPercent.toFixed(1)}% of total cost
                      {breakdown.overhead?.entries && ` (${breakdown.overhead.entries} entries)`}
                    </small>
                  </div>
                  <div className="fs-4 fw-bold text-warning">
                    ${overheadCost.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Total Cost</h5>
                  <div className="fs-3 fw-bold text-dark">
                    ${totalCost.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right: Unit Cost & Metrics */}
        <div className="col-md-6">
          <Card>
            <CardHeader title="Production Metrics" />
            <CardBody>
              {/* Quantity */}
              <div className="mb-4">
                <small className="text-muted">Planned Quantity</small>
                <div className="fs-3 fw-bold">{quantity} <small className="text-muted">units</small></div>
              </div>

              {/* Unit Cost */}
              <div className="mb-4">
                <small className="text-muted">Unit Cost</small>
                <div className="fs-2 fw-bold text-primary">
                  ${unitCost.toFixed(2)} <small className="text-muted fs-6">per unit</small>
                </div>
              </div>

              {/* Cost per Component */}
              <div className="mb-4">
                <h6 className="mb-3">Cost per Unit:</h6>
                <ul className="list-unstyled mb-0">
                  <li className="mb-2">
                    <strong>Material:</strong> ${quantity > 0 ? (materialCost / quantity).toFixed(2) : "0.00"}
                  </li>
                  <li className="mb-2">
                    <strong>Labor:</strong> ${quantity > 0 ? (laborCost / quantity).toFixed(2) : "0.00"}
                  </li>
                  <li className="mb-2">
                    <strong>Overhead:</strong> ${quantity > 0 ? (overheadCost / quantity).toFixed(2) : "0.00"}
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="d-grid gap-2">
                <Button
                  onClick={() => navigate(`/production/batches/${batchId}/labor`)}
                  className="btn-primary"
                >
                  Add Labor
                </Button>
                <Button
                  onClick={() => navigate(`/production/batches/${batchId}/overhead`)}
                  className="btn-success"
                >
                  Add Overhead
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}