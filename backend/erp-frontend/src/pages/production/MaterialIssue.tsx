// src/pages/production/MaterialIssue.tsx - REDESIGNED (COMPLETE)
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { issueMaterials, fetchProductionBatch, fetchBOM } from "../../api/production";
import { toNumber } from '../../utils/production';

export default function MaterialIssue() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const batchIdFromUrl = searchParams.get("batch");

  const [batchId, setBatchId] = useState(batchIdFromUrl || "");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [warehouseKey, setWarehouseKey] = useState("1");
  const [wipAccountKey, setWipAccountKey] = useState("48");
  const [inventoryAccountKey, setInventoryAccountKey] = useState("42");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<any[]>([]);

  // Fetch batch details
  const { data: batch, isLoading: batchLoading } = useQuery({
    queryKey: ["production-batch", batchId],
    queryFn: () => fetchProductionBatch(Number(batchId)),
    enabled: !!batchId && Number(batchId) > 0,
  });

  // Fetch BOM details to get components
  const { data: bom, isLoading: bomLoading } = useQuery({
    queryKey: ["bom", batch?.bom_id],
    queryFn: () => fetchBOM(batch!.bom_id!),
    enabled: !!batch?.bom_id,
  });

  // Auto-populate material lines when BOM loads
  useEffect(() => {
  if (bom && batch && batch.planned_quantity && lines.length === 0) {
    const plannedQty = toNumber(batch.planned_quantity);
    const calculatedLines = (bom.lines || bom.components || []).map((comp) => {
      const qtyPer = toNumber(comp.quantity_per || comp.quantity);
      const requiredQty = qtyPer * plannedQty;
      return {
        item_key: comp.item_key || comp.component_item_key,
        item_name: comp.item_name || comp.component_item_name,
        item_code: comp.item_code || comp.component_item_code,
        quantity_per: qtyPer,
        required_quantity: requiredQty,
        quantity: requiredQty,
        uom: comp.uom || '',
      };
    });
    setLines(calculatedLines);
  }
}, [bom, batch, lines.length]);

  const mutation = useMutation({
    mutationFn: issueMaterials,
    onSuccess: (response) => {
      alert(`✅ Materials issued successfully!\n\nBatch: ${response.data.batch_number}\nStatus: ${response.data.status}\nMaterials issued: ${response.data.materials_issued}`);
      navigate("/production/batches");
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || error.message;
      alert(`❌ Failed to issue materials: ${errorMsg}`);
    },
  });

  const handleLineChange = (index: number, value: number) => {
    const newLines = [...lines];
    newLines[index].quantity = value;
    setLines(newLines);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!batchId || !warehouseKey || !wipAccountKey || !inventoryAccountKey) {
      alert("Please fill all required fields");
      return;
    }

    const validLines = lines.filter((line) => line.quantity > 0);
    if (validLines.length === 0) {
      alert("Please enter at least one quantity to issue");
      return;
    }

    mutation.mutate({
      batch_id: Number(batchId),
      issue_date: issueDate,
      warehouse_key: Number(warehouseKey),
      notes,
      wip_account_key: Number(wipAccountKey),
      inventory_account_key: Number(inventoryAccountKey),
      lines: validLines.map((line) => ({
        item_key: line.item_key,
        quantity: Number(line.quantity),
      })),
    });
  };

  const canIssue = batch && batch.status === 'DRAFT';
  const isInProgress = batch && batch.status === 'IN_PROGRESS';
  const isCompleted = batch && batch.status === 'COMPLETED';
  const isLoading = batchLoading || bomLoading;

  return (
    <div className="container-fluid py-4">
      <div className="row g-4">
        {/* Header */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="card-title mb-1">📤 Issue Materials</h2>
                  <p className="text-muted mb-0">Consume raw materials for production</p>
                </div>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => navigate("/production/batches")}
                >
                  ← Back to Batches
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Batch Info Banner */}
        {batch && (
          <div className="col-12">
            <div className={`alert ${
              canIssue ? 'alert-success' :
              isInProgress ? 'alert-info' :
              isCompleted ? 'alert-warning' : 'alert-secondary'
            } mb-0`}>
              <div className="row align-items-center">
                <div className="col-md-8">
                  <strong>📦 Batch: {batch.batch_number}</strong>
                  <br />
                  <div className="mt-1">
                    <span className="badge bg-secondary me-2">{batch.product_name}</span>
                    <span className="badge bg-info me-2">BOM: {batch.bom_code}</span>
                    <span className={`badge ${
                      batch.status === 'DRAFT' ? 'bg-secondary' :
                      batch.status === 'IN_PROGRESS' ? 'bg-warning text-dark' :
                      'bg-success'
                    }`}>
                      {batch.status}
                    </span>
                  </div>
                  <small className="d-block mt-2 text-muted">
                    Planned Quantity: {parseFloat(batch.planned_quantity as any).toFixed(3)}
                  </small>
                </div>
                <div className="col-md-4 text-end">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => navigate(`/production/batches/${batchId}`)}
                  >
                    View Batch Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Warnings */}
        {isInProgress && (
          <div className="col-12">
            <div className="alert alert-info">
              <strong>ℹ️ Batch Already In Progress</strong>
              <p className="mb-0 mt-2">Materials have already been issued for this batch.</p>
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="col-12">
            <div className="alert alert-warning">
              <strong>⚠️ Batch Completed</strong>
              <p className="mb-0 mt-2">This batch has already been completed.</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="col-12">
          <form onSubmit={handleSubmit}>
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-4">Issue Details</h5>
                
                <div className="row g-3 mb-4">
                  {/* Batch ID */}
                  <div className="col-md-4">
                    <label className="form-label">
                      Production Batch ID <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-lg"
                      value={batchId}
                      onChange={(e) => {
                        setBatchId(e.target.value);
                        setLines([]);
                      }}
                      placeholder="Enter Batch ID"
                      required
                      readOnly={!!batchIdFromUrl}
                    />
                    {batchIdFromUrl && (
                      <small className="text-success">✓ Pre-filled from batch view</small>
                    )}
                  </div>

                  {/* Issue Date */}
                  <div className="col-md-4">
                    <label className="form-label">
                      Issue Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-lg"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      required
                    />
                  </div>

                  {/* Warehouse */}
                  <div className="col-md-4">
                    <label className="form-label">
                      Warehouse <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-lg"
                      value={warehouseKey}
                      onChange={(e) => setWarehouseKey(e.target.value)}
                      placeholder="Warehouse ID"
                      required
                    />
                    <small className="text-muted">Where to take materials from</small>
                  </div>

                  {/* WIP Account */}
                  <div className="col-md-6">
                    <label className="form-label">
                      WIP Account (Debit) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={wipAccountKey}
                      onChange={(e) => setWipAccountKey(e.target.value)}
                      required
                    />
                    <small className="text-muted">Account 5: Work in Progress (will be debited)</small>
                  </div>

                  {/* Inventory Account */}
                  <div className="col-md-6">
                    <label className="form-label">
                      Inventory Account (Credit) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={inventoryAccountKey}
                      onChange={(e) => setInventoryAccountKey(e.target.value)}
                      required
                    />
                    <small className="text-muted">Account 3: Inventory (will be credited)</small>
                  </div>

                  {/* Notes */}
                  <div className="col-12">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional issue notes..."
                    />
                  </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                  <div className="alert alert-info">
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Loading BOM components...
                  </div>
                )}

                {/* Material Lines Table */}
                {!isLoading && lines.length > 0 && (
                  <>
                    <h5 className="mb-3">Materials to Issue</h5>
                    <div className="table-responsive mb-4">
                      <table className="table table-bordered align-middle">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: "30%" }}>Raw Material</th>
                            <th style={{ width: "12%" }} className="text-end">Per Unit</th>
                            <th style={{ width: "18%" }} className="text-end">Required Qty</th>
                            <th style={{ width: "25%" }}>Quantity to Issue *</th>
                            <th style={{ width: "15%" }}>UOM</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lines.map((line, index) => (
                            <tr key={index}>
                              <td>
                                <div className="fw-semibold">{line.item_name || line.item_code}</div>
                                <small className="text-muted">{line.item_code}</small>
                              </td>
                              <td className="text-end">{line.quantity_per.toFixed(3)}</td>
                              <td className="text-end">
                                <span className="badge bg-info fs-6">
                                  {line.required_quantity.toFixed(3)}
                                </span>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={line.quantity}
                                  onChange={(e) => handleLineChange(index, Number(e.target.value))}
                                  step="0.001"
                                  min="0"
                                  required
                                />
                              </td>
                              <td>{line.uom}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* No Materials Warning */}
                {!isLoading && batch && lines.length === 0 && (
                  <div className="alert alert-warning">
                    ⚠️ No materials found in BOM. This product might not have a recipe yet.
                  </div>
                )}

                {/* What Happens Info */}
                <div className="alert alert-info">
                  <h6 className="mb-2">ℹ️ What Happens When You Issue Materials:</h6>
                  <ol className="mb-0 small">
                    <li>Materials will be removed from inventory (warehouse {warehouseKey})</li>
                    <li>Materials will be moved to Work in Progress (WIP)</li>
                    <li>GL Entry: Dr WIP (Account {wipAccountKey}), Cr Inventory (Account {inventoryAccountKey})</li>
                    <li>Batch status will change from DRAFT → IN_PROGRESS</li>
                  </ol>
                </div>

                {/* Submit Buttons */}
                <div className="d-flex gap-2 justify-content-end mt-4 pt-3 border-top">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate("/production/batches")}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-warning btn-lg"
                    disabled={mutation.isPending || !canIssue || lines.length === 0}
                  >
                    {mutation.isPending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Issuing...
                      </>
                    ) : (
                      '📤 Issue Materials'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}