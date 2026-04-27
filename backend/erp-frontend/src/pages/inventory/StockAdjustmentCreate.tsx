// src/pages/inventory/StockAdjustmentCreate.tsx - MATCHES YOUR BACKEND
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { http } from "../../api/http";

interface AdjustmentForm {
  company_key: number;
  item_key: number;
  warehouse_key: number;
  adjustment_date: string;
  quantity: number;
  adjustment_type: "INCREASE" | "DECREASE";
  unit_cost?: number;
  reason?: string;
  created_by?: number;
  post_to_gl?: boolean;
  inventory_account_key?: number;
  adjustment_account_key?: number;
}

export default function StockAdjustmentCreate() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState<AdjustmentForm>({
    company_key: 1,
    item_key: 0,
    warehouse_key: 0,
    adjustment_date: today,
    quantity: 0,
    adjustment_type: "INCREASE",
    unit_cost: 0,
    reason: "",
    created_by: 1,
    post_to_gl: false,
  });

  // Fetch items
  const { data: items = [] } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const res = await http.get("/api/items/");
      return res.data;
    },
  });

  // Fetch warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await http.get("/api/warehouses/");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AdjustmentForm) => {
      // Build payload matching your backend serializer
      const payload: any = {
        company_key: data.company_key,
        item_key: data.item_key,
        warehouse_key: data.warehouse_key,
        adjustment_date: data.adjustment_date,
        quantity: data.quantity,
        adjustment_type: data.adjustment_type,
        reason: data.reason || "",
        created_by: data.created_by || 1,
        post_to_gl: data.post_to_gl || false,
      };

      // Add unit_cost if provided (backend will use average cost if not)
      if (data.unit_cost && data.unit_cost > 0) {
        payload.unit_cost = data.unit_cost;
      }

      // Add GL accounts if posting to GL
      if (data.post_to_gl) {
        payload.inventory_account_key = data.inventory_account_key || 3;
        payload.adjustment_account_key = data.adjustment_account_key || 2;
      }

      console.log("📤 Sending to backend:", payload);

      const res = await http.post("/api/inventory/adjustments/", payload);
      return res.data;
    },
    onSuccess: (data) => {
      console.log("✅ Success response:", data);
      alert(`✅ ${data.message}\nTransaction ID: ${data.inv_txn_id}`);
      navigate("/inventory/movements");
    },
    onError: (error: any) => {
      console.error("❌ Error:", error);
      console.error("Error response:", error.response?.data);

      // Show detailed error
      const errorData = error.response?.data;
      let errorMsg = "Failed to create adjustment";

      if (errorData) {
        if (typeof errorData === "object") {
          // Format validation errors
          errorMsg = Object.entries(errorData)
            .map(([field, messages]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(", ")}`;
              }
              return `${field}: ${messages}`;
            })
            .join("\n");
        } else if (errorData.error) {
          errorMsg = errorData.error;
        } else {
          errorMsg = JSON.stringify(errorData);
        }
      }

      alert(`❌ Error:\n${errorMsg}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!form.item_key) {
      alert("Please select an item");
      return;
    }
    if (!form.warehouse_key) {
      alert("Please select a warehouse");
      return;
    }
    if (form.quantity <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }
    if (!form.reason?.trim()) {
      alert("Please provide a reason");
      return;
    }

    createMutation.mutate(form);
  };

  const totalValue = form.quantity * (form.unit_cost || 0);

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold mb-1">Stock Adjustment</h2>
              <div className="text-muted">Add or remove inventory stock</div>
            </div>
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate("/inventory/movements")}
            >
              ← Back to Movements
            </button>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className="col-12">
        <div className="alert alert-info">
          <strong>💡 Cost Information:</strong> If you don't provide a unit cost, 
          the system will automatically use the average cost from your inventory.
        </div>
      </div>

      {/* Adjustment Form */}
      <div className="col-12">
        <div className="card-box">
          <form onSubmit={handleSubmit}>
            {/* Adjustment Type */}
            <div className="mb-4">
              <label className="form-label fw-bold">Adjustment Type *</label>
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className={`btn ${
                    form.adjustment_type === "INCREASE"
                      ? "btn-success"
                      : "btn-outline-success"
                  }`}
                  onClick={() =>
                    setForm({ ...form, adjustment_type: "INCREASE" })
                  }
                >
                  ➕ Stock Increase (Add)
                </button>
                <button
                  type="button"
                  className={`btn ${
                    form.adjustment_type === "DECREASE"
                      ? "btn-danger"
                      : "btn-outline-danger"
                  }`}
                  onClick={() =>
                    setForm({ ...form, adjustment_type: "DECREASE" })
                  }
                >
                  ➖ Stock Decrease (Remove)
                </button>
              </div>
              <small className="text-muted">
                {form.adjustment_type === "INCREASE"
                  ? "Add stock to inventory (e.g., initial stock, found items, returns)"
                  : "Remove stock from inventory (e.g., damaged, lost, stolen, write-off)"}
              </small>
            </div>

            <div className="row g-3">
              {/* Item Selection */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Item *</label>
                <select
                  className="form-select"
                  value={form.item_key}
                  onChange={(e) =>
                    setForm({ ...form, item_key: Number(e.target.value) })
                  }
                  required
                >
                  <option value="">Select item...</option>
                  {items.map((item: any) => (
                    <option key={item.item_key} value={item.item_key}>
                      {item.item_code} - {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Warehouse Selection */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Warehouse *</label>
                <select
                  className="form-select"
                  value={form.warehouse_key || ""}
                  onChange={(e) =>
                    setForm({ ...form, warehouse_key: Number(e.target.value) })
                  }
                  required
                >
                  <option value="">Select warehouse...</option>
                  {warehouses?.length > 0 ? (
                    warehouses.map((wh: any) => (
                      <option
                        key={wh.warehouse_key ?? wh.id}
                        value={wh.warehouse_key ?? wh.id}
                      >
                        {(wh.code ?? "") + " - "}
                        {wh.name ?? wh.title ?? "Warehouse"}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="1">Main Warehouse</option>
                      <option value="2">Secondary Warehouse</option>
                    </>
                  )}
                </select>
              </div>

              {/* Adjustment Date */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.adjustment_date}
                  onChange={(e) =>
                    setForm({ ...form, adjustment_date: e.target.value })
                  }
                  max={today}
                  required
                />
              </div>

              {/* Quantity */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Quantity *</label>
                <input
                  type="number"
                  className="form-control"
                  step="0.001"
                  min="0.001"
                  value={form.quantity || ""}
                  onChange={(e) =>
                    setForm({ ...form, quantity: Number(e.target.value) })
                  }
                  required
                />
              </div>

              {/* Unit Cost (Optional) */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Unit Cost (Optional)
                </label>
                <input
                  type="number"
                  className="form-control"
                  step="0.01"
                  min="0"
                  value={form.unit_cost || ""}
                  onChange={(e) =>
                    setForm({ ...form, unit_cost: Number(e.target.value) })
                  }
                  placeholder="Leave blank to use average cost"
                />
                <small className="text-muted">
                  If not provided, system uses average inventory cost
                </small>
              </div>

              {/* Total Value (calculated) */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Estimated Value</label>
                <input
                  type="text"
                  className="form-control bg-light"
                  value={totalValue.toFixed(2)}
                  readOnly
                />
                <small className="text-muted">
                  {!form.unit_cost || form.unit_cost === 0
                    ? "Will use average cost"
                    : "Using provided cost"}
                </small>
              </div>

              {/* Reason */}
              <div className="col-12">
                <label className="form-label fw-semibold">Reason *</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Explain why this adjustment is needed..."
                  value={form.reason}
                  onChange={(e) =>
                    setForm({ ...form, reason: e.target.value })
                  }
                  required
                />
                <small className="text-muted">
                  Examples: "Initial stock count", "Damaged goods write-off",
                  "Found in warehouse", "Customer return"
                </small>
              </div>

              {/* GL Posting Option */}
              <div className="col-12">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="postToGL"
                    checked={form.post_to_gl}
                    onChange={(e) =>
                      setForm({ ...form, post_to_gl: e.target.checked })
                    }
                  />
                  <label className="form-check-label" htmlFor="postToGL">
                    Post to General Ledger (creates journal entry)
                  </label>
                </div>
                <small className="text-muted">
                  If checked, will create GL entries (Dr/Cr Inventory & Adjustment accounts)
                </small>
              </div>
            </div>

            {/* Summary Box */}
            <div className="mt-4 p-3 bg-light rounded">
              <h6 className="mb-3">Adjustment Summary</h6>
              <div className="row">
                <div className="col-md-3">
                  <small className="text-muted">Type</small>
                  <div className="fw-bold">
                    {form.adjustment_type === "INCREASE" ? (
                      <span className="text-success">➕ INCREASE</span>
                    ) : (
                      <span className="text-danger">➖ DECREASE</span>
                    )}
                  </div>
                </div>
                <div className="col-md-3">
                  <small className="text-muted">Quantity</small>
                  <div className="fw-bold">{form.quantity.toFixed(3)}</div>
                </div>
                <div className="col-md-3">
                  <small className="text-muted">Cost</small>
                  <div className="fw-bold">
                    {form.unit_cost && form.unit_cost > 0
                      ? form.unit_cost.toFixed(2)
                      : "Auto (Avg)"}
                  </div>
                </div>
                <div className="col-md-3">
                  <small className="text-muted">Total Value</small>
                  <div className="fw-bold fs-5 text-primary">
                    {form.unit_cost && form.unit_cost > 0
                      ? totalValue.toFixed(2)
                      : "Auto Calc"}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 d-flex gap-2 justify-content-end">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate("/inventory/movements")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Adjustment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}