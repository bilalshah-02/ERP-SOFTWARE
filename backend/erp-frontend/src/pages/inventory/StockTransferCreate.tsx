// src/pages/inventory/StockTransferCreate.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { http } from "../../api/http";

interface TransferLine {
  item_key: number;
  quantity: number;
  item_code?: string;
  item_name?: string;
}

export default function StockTransferCreate() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    from_warehouse_key: 0,
    to_warehouse_key: 0,
    transfer_date: today,
    reference_no: "",
    notes: "",
  });

  const [lines, setLines] = useState<TransferLine[]>([
    { item_key: 0, quantity: 0 },
  ]);

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
    mutationFn: async (data: any) => {
      const res = await http.post("/api/inventory/transfers/", data);
      return res.data;
    },
    onSuccess: () => {
      alert("✅ Stock transfer created successfully!");
      navigate("/inventory/movements");
    },
    onError: (error: any) => {
      alert(`❌ Error: ${error.response?.data?.detail || error.message}`);
    },
  });

  const addLine = () => {
    setLines([...lines, { item_key: 0, quantity: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof TransferLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    // Update item details
    if (field === "item_key") {
      const item = items.find((i: any) => i.item_key === Number(value));
      if (item) {
        newLines[index].item_code = item.item_code;
        newLines[index].item_name = item.name;
      }
    }
    
    setLines(newLines);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!form.from_warehouse_key) {
      alert("Please select source warehouse");
      return;
    }
    if (!form.to_warehouse_key) {
      alert("Please select destination warehouse");
      return;
    }
    if (form.from_warehouse_key === form.to_warehouse_key) {
      alert("Source and destination warehouses must be different");
      return;
    }
    if (lines.some((line) => !line.item_key || line.quantity <= 0)) {
      alert("All lines must have an item and quantity > 0");
      return;
    }

    const data = {
      company_key: 1,
      from_warehouse_key: form.from_warehouse_key,
      to_warehouse_key: form.to_warehouse_key,
      transfer_date: form.transfer_date,
      reference_no: form.reference_no || `TRF-${Date.now()}`,
      notes: form.notes,
      lines: lines.map((line) => ({
        item_key: line.item_key,
        quantity: line.quantity,
      })),
    };

    createMutation.mutate(data);
  };

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold mb-1">Stock Transfer</h2>
              <div className="text-muted">Move inventory between warehouses</div>
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

      {/* Transfer Form */}
      <div className="col-12">
        <div className="card-box">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* From Warehouse */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  From Warehouse (Source) *
                </label>
                <select
                  className="form-select"
                  value={form.from_warehouse_key}
                  onChange={(e) =>
                    setForm({ ...form, from_warehouse_key: Number(e.target.value) })
                  }
                  required
                >
                  <option value="">Select source warehouse...</option>
                  {warehouses.map((wh: any) => (
                    <option key={wh.warehouse_key} value={wh.warehouse_key}>
                      {wh.code} - {wh.name}
                    </option>
                  ))}
                </select>
                <small className="text-muted">Stock will be removed from this warehouse</small>
              </div>

              {/* To Warehouse */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  To Warehouse (Destination) *
                </label>
                <select
                  className="form-select"
                  value={form.to_warehouse_key}
                  onChange={(e) =>
                    setForm({ ...form, to_warehouse_key: Number(e.target.value) })
                  }
                  required
                >
                  <option value="">Select destination warehouse...</option>
                  {warehouses
                    .filter((wh: any) => wh.warehouse_key !== form.from_warehouse_key)
                    .map((wh: any) => (
                      <option key={wh.warehouse_key} value={wh.warehouse_key}>
                        {wh.code} - {wh.name}
                      </option>
                    ))}
                </select>
                <small className="text-muted">Stock will be added to this warehouse</small>
              </div>

              {/* Transfer Date */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Transfer Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.transfer_date}
                  onChange={(e) =>
                    setForm({ ...form, transfer_date: e.target.value })
                  }
                  max={today}
                  required
                />
              </div>

              {/* Reference Number */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Reference No</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Auto-generated if left blank"
                  value={form.reference_no}
                  onChange={(e) =>
                    setForm({ ...form, reference_no: e.target.value })
                  }
                />
              </div>

              {/* Notes */}
              <div className="col-12">
                <label className="form-label fw-semibold">Notes</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Optional notes about this transfer..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>

            {/* Transfer Lines */}
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Items to Transfer</h6>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={addLine}
                >
                  + Add Line
                </button>
              </div>

              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: "50%" }}>Item *</th>
                      <th style={{ width: "30%" }}>Quantity *</th>
                      <th style={{ width: "20%" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, index) => (
                      <tr key={index}>
                        <td>
                          <select
                            className="form-select"
                            value={line.item_key}
                            onChange={(e) =>
                              updateLine(index, "item_key", Number(e.target.value))
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
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            step="0.001"
                            min="0.001"
                            value={line.quantity || ""}
                            onChange={(e) =>
                              updateLine(index, "quantity", Number(e.target.value))
                            }
                            required
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeLine(index)}
                            disabled={lines.length === 1}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 p-3 bg-light rounded">
              <h6 className="mb-3">Transfer Summary</h6>
              <div className="row">
                <div className="col-md-4">
                  <small className="text-muted">Total Items</small>
                  <div className="fw-bold">{lines.length}</div>
                </div>
                <div className="col-md-4">
                  <small className="text-muted">Total Quantity</small>
                  <div className="fw-bold">
                    {lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0).toFixed(3)}
                  </div>
                </div>
                <div className="col-md-4">
                  <small className="text-muted">Direction</small>
                  <div className="fw-bold">
                    {form.from_warehouse_key && form.to_warehouse_key ? (
                      <>
                        {warehouses.find((w: any) => w.warehouse_key === form.from_warehouse_key)?.code || "Source"}
                        {" → "}
                        {warehouses.find((w: any) => w.warehouse_key === form.to_warehouse_key)?.code || "Destination"}
                      </>
                    ) : (
                      "Select warehouses"
                    )}
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
                {createMutation.isPending ? "Creating..." : "🔄 Create Transfer"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Info Box */}
      <div className="col-12">
        <div className="alert alert-info">
          <strong>ℹ️ How Stock Transfer Works:</strong>
          <ul className="mb-0 mt-2">
            <li>Stock is removed from the source warehouse</li>
            <li>Stock is added to the destination warehouse</li>
            <li>System validates that sufficient stock exists in source warehouse</li>
            <li>Two inventory transactions are created (OUT from source, IN to destination)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}