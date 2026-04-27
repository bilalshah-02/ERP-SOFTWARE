// src/pages/production/ProductionBatchCreate.tsx - REDESIGNED
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createProductionBatch, fetchBOMs, checkMaterialAvailability } from "../../api/production";

export default function ProductionBatchCreate() {
  const navigate = useNavigate();

  const [bomKey, setBomKey] = useState("");
  const [plannedQuantity, setPlannedQuantity] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [availability, setAvailability] = useState<any>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Fetch all BOMs
  const { data: boms = [], isLoading: bomsLoading } = useQuery({
    queryKey: ["boms"],
    queryFn: fetchBOMs,
  });

  // Filter only active BOMs
  const activeBoms = boms.filter(bom => bom.is_active);

  // Get selected BOM details
  const selectedBom = activeBoms.find(bom => bom.bom_key === Number(bomKey));

  const mutation = useMutation({
    mutationFn: createProductionBatch,
    onSuccess: (data) => {
      alert(`✅ Production batch ${data.batch_number} created successfully!`);
      navigate("/production/batches");
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || error.message;
      alert(`❌ Failed to create batch: ${errorMsg}`);
    },
  });

  const handleCheckAvailability = async () => {
    if (!bomKey || !plannedQuantity) {
      alert("Please select BOM and enter quantity first");
      return;
    }

    setCheckingAvailability(true);
    try {
      const result = await checkMaterialAvailability(Number(bomKey), Number(plannedQuantity));
      setAvailability(result);
    } catch (error: any) {
      alert(`Failed to check availability: ${error.response?.data?.error || error.message}`);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!bomKey || !plannedQuantity) {
      alert("Please fill all required fields");
      return;
    }

    mutation.mutate({
      bom_key: Number(bomKey),
      planned_quantity: Number(plannedQuantity),
      start_date: startDate,
      notes,
    });
  };

  if (bomsLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-2 text-muted">Loading BOMs...</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row g-4">
        {/* Header */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="card-title mb-1">🏭 Create Production Order</h2>
                  <p className="text-muted mb-0">Start a new manufacturing batch</p>
                </div>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => navigate("/production/batches")}
                >
                  ← Back to List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* No BOMs Warning */}
        {activeBoms.length === 0 && (
          <div className="col-12">
            <div className="alert alert-warning">
              <strong>⚠️ No active BOMs found!</strong> You need to create a product with a recipe first.
              <div className="mt-2">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate("/inventory/items/create")}
                >
                  Create Product with Recipe
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="col-12">
          <form onSubmit={handleSubmit}>
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-4">Production Order Details</h5>
                
                <div className="row g-3">
                  {/* BOM Selection */}
                  <div className="col-md-6">
                    <label className="form-label">
                      Product Recipe (BOM) <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select form-select-lg"
                      value={bomKey}
                      onChange={(e) => {
                        setBomKey(e.target.value);
                        setAvailability(null);
                      }}
                      required
                    >
                      <option value="">Select a recipe...</option>
                      {activeBoms.map((bom) => (
                        <option key={bom.bom_key} value={bom.bom_key}>
                          {bom.product_name} ({bom.bom_code})
                        </option>
                      ))}
                    </select>
                    {selectedBom && (
                      <small className="text-muted d-block mt-1">
                        Product: {selectedBom.product_name} | Code: {selectedBom.product_code}
                      </small>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="col-md-6">
                    <label className="form-label">
                      Quantity to Produce <span className="text-danger">*</span>
                    </label>
                    <div className="input-group input-group-lg">
                      <input
                        type="number"
                        className="form-control"
                        value={plannedQuantity}
                        onChange={(e) => {
                          setPlannedQuantity(e.target.value);
                          setAvailability(null);
                        }}
                        step="0.001"
                        min="0.001"
                        placeholder="0.000"
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={handleCheckAvailability}
                        disabled={!bomKey || !plannedQuantity || checkingAvailability}
                      >
                        {checkingAvailability ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Checking...
                          </>
                        ) : (
                          '🔍 Check Materials'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Start Date */}
                  <div className="col-md-6">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  {/* Notes */}
                  <div className="col-md-6">
                    <label className="form-label">Notes</label>
                    <input
                      type="text"
                      className="form-control"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional notes..."
                    />
                  </div>
                </div>

                {/* Material Availability Results */}
                {availability && (
                  <div className={`alert ${availability.available ? 'alert-success' : 'alert-warning'} mt-4`}>
                    <h6 className="mb-2">
                      {availability.available ? '✅ All Materials Available' : '⚠️ Material Shortage Detected'}
                    </h6>
                    
                    {availability.recipe_info && (
                      <div className="mb-3">
                        <strong>Recipe:</strong> {availability.recipe_info.product_name} ({availability.recipe_info.bom_code})
                        <br />
                        <strong>Quantity:</strong> {availability.recipe_info.quantity}
                      </div>
                    )}
                    
                    {availability.requirements && availability.requirements.length > 0 && (
                      <div className="table-responsive">
                        <table className="table table-sm table-bordered mb-0 bg-white">
                          <thead>
                            <tr>
                              <th>Raw Material</th>
                              <th className="text-end">Required</th>
                              <th className="text-end">Available</th>
                              <th className="text-end">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {availability.requirements.map((req: any, idx: number) => (
                              <tr key={idx} className={!req.sufficient ? 'table-warning' : ''}>
                                <td>
                                  {req.item_name || req.item_code}
                                  <br />
                                  <small className="text-muted">{req.item_code}</small>
                                </td>
                                <td className="text-end">
                                  {req.required.toFixed(3)} {req.uom}
                                </td>
                                <td className="text-end">
                                  {req.available.toFixed(3)}
                                </td>
                                <td className="text-end">
                                  {req.sufficient ? (
                                    <span className="badge bg-success">✓ OK</span>
                                  ) : (
                                    <span className="badge bg-danger">
                                      ✗ Short {(req.required - req.available).toFixed(3)}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    {!availability.available && (
                      <div className="mt-3">
                        <small className="text-muted">
                          💡 You can still create the batch, but you'll need to purchase/produce the missing materials before issuing.
                        </small>
                      </div>
                    )}
                  </div>
                )}

                {/* Help Text */}
                {!availability && selectedBom && plannedQuantity && (
                  <div className="alert alert-info mt-4">
                    <strong>💡 Tip:</strong> Click "Check Materials" to verify if you have enough raw materials in stock before creating the production order.
                  </div>
                )}

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
                    disabled={mutation.isPending || activeBoms.length === 0}
                  >
                    {mutation.isPending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Creating...
                      </>
                    ) : (
                      '🏭 Create Production Order'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Workflow Info */}
        <div className="col-12">
          <div className="card shadow-sm bg-light">
            <div className="card-body">
              <h6 className="mb-3">📋 What Happens Next:</h6>
              <div className="row">
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="fs-3 mb-2">1️⃣</div>
                    <div className="fw-bold">Batch Created</div>
                    <small className="text-muted">Status: DRAFT</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="fs-3 mb-2">2️⃣</div>
                    <div className="fw-bold">Issue Materials</div>
                    <small className="text-muted">Move to WIP</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="fs-3 mb-2">3️⃣</div>
                    <div className="fw-bold">Production</div>
                    <small className="text-muted">Status: IN_PROGRESS</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="fs-3 mb-2">4️⃣</div>
                    <div className="fw-bold">Complete</div>
                    <small className="text-muted">Receive goods</small>
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