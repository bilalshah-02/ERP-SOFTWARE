// src/pages/production/ProductionCompletion.tsx - REDESIGNED
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { completeProduction, fetchProductionBatch } from "../../api/production";
import { toString, formatQuantity } from '../../utils/production';

export default function ProductionCompletion() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const batchIdFromUrl = searchParams.get("batch");

  const [batchId, setBatchId] = useState(batchIdFromUrl || "");
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split("T")[0]);
  const [quantityCompleted, setQuantityCompleted] = useState("");
  const [warehouseKey, setWarehouseKey] = useState("1");
  const [fgInventoryAccountKey, setFgInventoryAccountKey] = useState("42");
  const [wipAccountKey, setWipAccountKey] = useState("48");
  const [notes, setNotes] = useState("");

  // Fetch batch details
  const { data: batch, isLoading: batchLoading } = useQuery({
    queryKey: ["production-batch", batchId],
    queryFn: () => fetchProductionBatch(Number(batchId)),
    enabled: !!batchId && Number(batchId) > 0,
  });

  // Auto-fill quantity when batch loads
  useEffect(() => {
    if (batch && !quantityCompleted) {
      setQuantityCompleted(toString(batch.planned_quantity));
    }
  }, [batch]);

  const mutation = useMutation({
    mutationFn: completeProduction,
    onSuccess: (response) => {
      alert(`✅ Production completed successfully!\n\nBatch: ${response.data.batch_number}\nQuantity: ${response.data.quantity_completed}\nCost: $${response.data.cost}`);
      navigate("/production/batches");
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || error.message;
      alert(`❌ Failed to complete production: ${errorMsg}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!batchId || !quantityCompleted || !warehouseKey || !fgInventoryAccountKey || !wipAccountKey) {
      alert("Please fill all required fields");
      return;
    }

    if (Number(quantityCompleted) <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    mutation.mutate({
      batch_id: Number(batchId),
      completion_date: completionDate,
      quantity_completed: Number(quantityCompleted),
      warehouse_key: Number(warehouseKey),
      fg_inventory_account_key: Number(fgInventoryAccountKey),
      wip_account_key: Number(wipAccountKey),
      notes,
    });
  };

  const canComplete = batch && (batch.status === 'IN_PROGRESS' || batch.status === 'POSTED');
  const isDraft = batch && batch.status === 'DRAFT';
  const isCompleted = batch && batch.status === 'COMPLETED';

  return (
    <div className="container-fluid py-4">
      <div className="row g-4">
        {/* Header */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="card-title mb-1">✅ Complete Production</h2>
                  <p className="text-muted mb-0">Receive finished goods and close batch</p>
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
              canComplete ? 'alert-success' :
              isDraft ? 'alert-warning' :
              isCompleted ? 'alert-info' : 'alert-secondary'
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
                    Planned: {formatQuantity(batch.planned_quantity, 3)} | 
Actual: {batch.actual_quantity ? formatQuantity(batch.actual_quantity, 3) : '0.000'}
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
        {isDraft && (
          <div className="col-12">
            <div className="alert alert-warning">
              <strong>⚠️ Cannot Complete: Batch is in DRAFT status</strong>
              <p className="mb-0 mt-2">You need to issue materials first before completing production.</p>
              <button
                className="btn btn-warning btn-sm mt-2"
                onClick={() => navigate(`/production/material-issue?batch=${batchId}`)}
              >
                Go to Material Issue
              </button>
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="col-12">
            <div className="alert alert-info">
              <strong>ℹ️ Batch Already Completed</strong>
              <p className="mb-0 mt-2">This production batch has already been completed.</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="col-12">
          <form onSubmit={handleSubmit}>
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-4">Completion Details</h5>
                
                <div className="row g-3">
                  {/* Batch ID */}
                  <div className="col-md-4">
                    <label className="form-label">
                      Production Batch ID <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-lg"
                      value={batchId}
                      onChange={(e) => setBatchId(e.target.value)}
                      placeholder="Enter Batch ID"
                      required
                      readOnly={!!batchIdFromUrl}
                    />
                    {batchIdFromUrl && (
                      <small className="text-success">✓ Pre-filled from batch view</small>
                    )}
                    {batchLoading && (
                      <small className="text-muted">
                        <span className="spinner-border spinner-border-sm me-1"></span>
                        Loading batch...
                      </small>
                    )}
                  </div>

                  {/* Completion Date */}
                  <div className="col-md-4">
                    <label className="form-label">
                      Completion Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-lg"
                      value={completionDate}
                      onChange={(e) => setCompletionDate(e.target.value)}
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
                    <small className="text-muted">Where to receive finished goods</small>
                  </div>

                  {/* Quantity Completed */}
                  <div className="col-12">
                    <label className="form-label">
                      Quantity Completed <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-lg"
                      value={quantityCompleted}
                      onChange={(e) => setQuantityCompleted(e.target.value)}
                      step="0.001"
                      min="0.001"
                      placeholder="0.000"
                      required
                    />
                    {batch && (
                      <small className="text-muted">
                        Planned: {formatQuantity(batch.planned_quantity, 3)} | 
Already Completed: {batch.actual_quantity ? formatQuantity(batch.actual_quantity, 3) : '0.000'}
                      </small>
                    )}
                  </div>

                  {/* FG Inventory Account */}
                  <div className="col-md-6">
                    <label className="form-label">
                      Finished Goods Account (Debit) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={fgInventoryAccountKey}
                      onChange={(e) => setFgInventoryAccountKey(e.target.value)}
                      required
                    />
                    <small className="text-muted">Account 3: Finished Goods Inventory (will be debited)</small>
                  </div>

                  {/* WIP Account */}
                  <div className="col-md-6">
                    <label className="form-label">
                      WIP Account (Credit) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={wipAccountKey}
                      onChange={(e) => setWipAccountKey(e.target.value)}
                      required
                    />
                    <small className="text-muted">Account 5: Work in Progress (will be credited)</small>
                  </div>

                  {/* Notes */}
                  <div className="col-12">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional completion notes..."
                    />
                  </div>
                </div>

                {/* What Happens Info */}
                <div className="alert alert-info mt-4">
                  <h6 className="mb-2">ℹ️ What Happens When You Complete:</h6>
                  <ol className="mb-0 small">
                    <li>Finished goods will be added to inventory (warehouse {warehouseKey})</li>
                    <li>Cost will be calculated from materials issued to this batch</li>
                    <li>GL Entry: Dr Finished Goods Inventory (Account {fgInventoryAccountKey}), Cr WIP (Account {wipAccountKey})</li>
                    <li>Batch status will change to COMPLETED</li>
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
                    className="btn btn-success btn-lg"
                    disabled={mutation.isPending || !canComplete}
                  >
                    {mutation.isPending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Completing...
                      </>
                    ) : (
                      '✅ Complete Production'
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