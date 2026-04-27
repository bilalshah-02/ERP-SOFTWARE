// src/pages/production/OverheadAllocation.tsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { addOverhead, fetchProductionBatch, fetchBatchCostSummary } from "../../api/production";
import { Card, CardHeader, CardBody } from "../../components/ui/Cards";
import Input from "../../components/ui/Input";
import  Button  from "../../components/ui/Button";

export default function OverheadAllocation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const batchId = parseInt(id || "0");

  const [formData, setFormData] = useState({
    overhead_method: "PERCENTAGE" as "PERCENTAGE" | "UNIT" | "FIXED",
    overhead_rate: "",
    allocation_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Fetch batch details
  const { data: batch, isLoading: batchLoading } = useQuery({
    queryKey: ["productionBatch", batchId],
    queryFn: () => fetchProductionBatch(batchId),
    enabled: batchId > 0,
  });

  // Fetch cost summary for calculation
  const { data: costSummary } = useQuery({
    queryKey: ["batchCostSummary", batchId],
    queryFn: () => fetchBatchCostSummary(batchId),
    enabled: batchId > 0,
  });

  // Calculate overhead amount based on method
  const calculateOverhead = (): number => {
    const rate = parseFloat(formData.overhead_rate || "0");
    if (rate <= 0) return 0;

    switch (formData.overhead_method) {
      case "PERCENTAGE": {
        const laborCost = costSummary?.cost_breakdown?.labor?.amount || 0;
        return (laborCost * rate) / 100;
      }
      case "UNIT": {
        const plannedQty = parseFloat(String(batch?.planned_quantity || 0));
        return rate * plannedQty;
      }
      case "FIXED":
        return rate;
      default:
        return 0;
    }
  };

  const overheadAmount = calculateOverhead();

  // Get calculation explanation
  const getCalculationText = (): string => {
    const rate = formData.overhead_rate;
    switch (formData.overhead_method) {
      case "PERCENTAGE": {
        const laborCost = costSummary?.cost_breakdown?.labor?.amount || 0;
        return `${rate}% of labor cost ($${laborCost.toFixed(2)})`;
      }
      case "UNIT": {
        const qty = batch?.planned_quantity || 0;
        return `$${rate} per unit × ${qty} units`;
      }
      case "FIXED":
        return `Fixed amount: $${rate}`;
      default:
        return "";
    }
  };

  // Mutation for adding overhead
  const mutation = useMutation({
    mutationFn: addOverhead,
    onSuccess: () => {
      alert("✅ Overhead allocated successfully!");
      navigate(`/production/batches/${batchId}`);
    },
    onError: (error: any) => {
      alert(`❌ Error: ${error.response?.data?.error || error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.overhead_rate || parseFloat(formData.overhead_rate) <= 0) {
      alert("Overhead rate must be greater than 0");
      return;
    }

    if (formData.overhead_method === "PERCENTAGE" && parseFloat(formData.overhead_rate) > 500) {
      if (!confirm("Overhead percentage is very high (>500%). Continue?")) {
        return;
      }
    }

    mutation.mutate({
      prod_batch_key: batchId,
      overhead_method: formData.overhead_method,
      overhead_rate: parseFloat(formData.overhead_rate),
      allocation_date: formData.allocation_date,
      notes: formData.notes,
    });
  };

  if (batchLoading) {
    return (
      <div className="container-fluid">
        <Card>
          <CardBody>
            <p>Loading batch details...</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="mb-4">
        <h2>Allocate Overhead</h2>
        <p className="text-muted">
          Batch: {batch?.batch_number || `#${batchId}`} - {batch?.product_name || "Unknown Product"}
        </p>
      </div>

      <Card>
        <CardHeader title="Overhead Allocation" />
        <CardBody>
          <form onSubmit={handleSubmit}>
            {/* Overhead Method */}
            <div className="mb-3">
              <label className="form-label">
                Allocation Method <span className="text-danger">*</span>
              </label>
              <select
                className="form-select"
                value={formData.overhead_method}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    overhead_method: e.target.value as "PERCENTAGE" | "UNIT" | "FIXED",
                  })
                }
                required
              >
                <option value="PERCENTAGE">Percentage of Labor Cost</option>
                <option value="UNIT">Per Unit Produced</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </div>

            {/* Overhead Rate */}
            <div className="mb-3">
              <label className="form-label">
                {formData.overhead_method === "PERCENTAGE"
                  ? "Overhead Percentage"
                  : formData.overhead_method === "UNIT"
                  ? "Overhead per Unit ($)"
                  : "Fixed Overhead Amount ($)"}{" "}
                <span className="text-danger">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.overhead_rate}
                onChange={(e) => setFormData({ ...formData, overhead_rate: e.target.value })}
                placeholder={
                  formData.overhead_method === "PERCENTAGE"
                    ? "e.g., 40 (for 40%)"
                    : "e.g., 5.00"
                }
                required
              />
              {formData.overhead_method === "PERCENTAGE" && (
                <small className="form-text text-muted">
                  Labor cost: ${(costSummary?.cost_breakdown?.labor?.amount || 0).toFixed(2)}
                </small>
              )}
              {formData.overhead_method === "UNIT" && (
                <small className="form-text text-muted">
                  Planned quantity: {batch?.planned_quantity || 0} units
                </small>
              )}
            </div>

            {/* Allocation Date */}
            <div className="mb-3">
              <label className="form-label">
                Allocation Date <span className="text-danger">*</span>
              </label>
              <Input
                type="date"
                value={formData.allocation_date}
                onChange={(e) => setFormData({ ...formData, allocation_date: e.target.value })}
                required
              />
            </div>

            {/* Notes */}
            <div className="mb-3">
              <label className="form-label">Notes</label>
              <textarea
                className="form-control"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes about this overhead allocation"
              />
            </div>

            {/* Overhead Calculation Preview */}
            {overheadAmount > 0 && (
              <div className="alert alert-success">
                <h6 className="mb-2">Overhead Calculation</h6>
                <div className="fs-3 fw-bold text-success">
                  ${overheadAmount.toFixed(2)}
                </div>
                <p className="text-muted mb-0 mt-1">{getCalculationText()}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="d-flex gap-2">
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="btn btn-success"
              >
                {mutation.isPending ? "Allocating..." : "Allocate Overhead"}
              </Button>
              <Button
                type="button"
                onClick={() => navigate(`/production/batches/${batchId}`)}
                className="btn btn-secondary"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}