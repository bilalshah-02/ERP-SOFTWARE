// src/pages/production/LaborEntry.tsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { addLabor, fetchProductionBatch } from "../../api/production";
import { Card, CardHeader, CardBody } from "../../components/ui/Cards";
import Input from "../../components/ui/Input";
import  Button  from "../../components/ui/Button";

export default function LaborEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const batchId = parseInt(id || "0");

  const [formData, setFormData] = useState({
    labor_hours: "",
    hourly_rate: "",
    worker_name: "",
    labor_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Fetch batch details
  const { data: batch, isLoading: batchLoading } = useQuery({
    queryKey: ["productionBatch", batchId],
    queryFn: () => fetchProductionBatch(batchId),
    enabled: batchId > 0,
  });

  // Calculate labor cost
  const laborCost = parseFloat(formData.labor_hours || "0") * parseFloat(formData.hourly_rate || "0");

  // Mutation for adding labor
  const mutation = useMutation({
    mutationFn: addLabor,
    onSuccess: () => {
      alert("✅ Labor recorded successfully!");
      navigate(`/production/batches/${batchId}`);
    },
    onError: (error: any) => {
      alert(`❌ Error: ${error.response?.data?.error || error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.labor_hours || parseFloat(formData.labor_hours) <= 0) {
      alert("Labor hours must be greater than 0");
      return;
    }

    if (!formData.hourly_rate || parseFloat(formData.hourly_rate) <= 0) {
      alert("Hourly rate must be greater than 0");
      return;
    }

    mutation.mutate({
      prod_batch_key: batchId,
      labor_hours: parseFloat(formData.labor_hours),
      hourly_rate: parseFloat(formData.hourly_rate),
      labor_date: formData.labor_date,
      worker_name: formData.worker_name,
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
        <h2>Record Labor</h2>
        <p className="text-muted">
          Batch: {batch?.batch_number || `#${batchId}`} - {batch?.product_name || "Unknown Product"}
        </p>
      </div>

      <Card>
        <CardHeader title="Labor Entry" />
        <CardBody>
          <form onSubmit={handleSubmit}>
            {/* Worker Name */}
            <div className="mb-3">
              <label className="form-label">Worker Name</label>
              <Input
                type="text"
                value={formData.worker_name}
                onChange={(e) => setFormData({ ...formData, worker_name: e.target.value })}
                placeholder="e.g., John Doe"
              />
            </div>

            {/* Labor Hours */}
            <div className="mb-3">
              <label className="form-label">
                Labor Hours <span className="text-danger">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.labor_hours}
                onChange={(e) => setFormData({ ...formData, labor_hours: e.target.value })}
                placeholder="e.g., 8.5"
                required
              />
            </div>

            {/* Hourly Rate */}
            <div className="mb-3">
              <label className="form-label">
                Hourly Rate ($) <span className="text-danger">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                placeholder="e.g., 25.00"
                required
              />
            </div>

            {/* Labor Date */}
            <div className="mb-3">
              <label className="form-label">
                Labor Date <span className="text-danger">*</span>
              </label>
              <Input
                type="date"
                value={formData.labor_date}
                onChange={(e) => setFormData({ ...formData, labor_date: e.target.value })}
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
                placeholder="Optional notes about this labor entry"
              />
            </div>

            {/* Cost Calculation Preview */}
            {laborCost > 0 && (
              <div className="alert alert-info">
                <h6 className="mb-2">Cost Calculation</h6>
                <div className="fs-3 fw-bold text-primary">
                  ${laborCost.toFixed(2)}
                </div>
                <p className="text-muted mb-0 mt-1">
                  {formData.labor_hours} hours × ${formData.hourly_rate}/hr
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="d-flex gap-2">
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="btn btn-primary"
              >
                {mutation.isPending ? "Recording..." : "Record Labor"}
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