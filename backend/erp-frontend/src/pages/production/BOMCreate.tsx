// src/pages/production/BOMCreate.tsx - FINAL FIXED VERSION
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchItems, type Item } from "../../api/items";
import { http } from "../../api/http";

interface BomComponent {
  item_key: number;
  quantity: number;
  uom?: string;
}

export default function BOMCreate() {
  const navigate = useNavigate();

  const [parentItemKey, setParentItemKey] = useState("");
  const [quantityProduced, setQuantityProduced] = useState("1");
  const [bomCode, setBomCode] = useState("");
  const [components, setComponents] = useState<BomComponent[]>([
    { item_key: 0, quantity: 0, uom: "" },
  ]);

  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ["items"],
    queryFn: () => fetchItems(),
  });

  // ✅ FIXED: Direct mutation with proper structure
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await http.post("/api/production/boms/", data);
      return res.data;
    },
    onSuccess: (data) => {
      alert(`BOM ${data.bom_code || 'created'} successfully!`);
      navigate("/production/boms");
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || 
                      JSON.stringify(error.response?.data) || 
                      error.message;
      alert("Failed to create BOM: " + errorMsg);
      console.error("BOM creation error:", error.response?.data);
    },
  });

  const handleAddComponent = () => {
    setComponents([...components, { item_key: 0, quantity: 0, uom: "" }]);
  };

  const handleRemoveComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const handleComponentChange = (index: number, field: keyof BomComponent, value: any) => {
    const newComponents = [...components];
    newComponents[index] = { ...newComponents[index], [field]: value };
    setComponents(newComponents);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!parentItemKey) {
      alert("Please select a product");
      return;
    }

    if (!bomCode) {
      alert("Please enter BOM code");
      return;
    }

    if (components.length === 0) {
      alert("Please add at least one component");
      return;
    }

    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      if (!component.item_key || component.quantity <= 0) {
        alert(`Component ${i + 1}: Please fill all required fields`);
        return;
      }
    }

    // ✅ FIXED: Send with NESTED structure that backend expects
    const payload = {
      parent_item_key: Number(parentItemKey),
      bom_code: bomCode,
      quantity_produced: Number(quantityProduced),
      components: components.map((comp) => ({
        component_item_key: Number(comp.item_key), // ✅ Nested structure
        quantity_per: Number(comp.quantity),       // ✅ Changed field name
        uom: comp.uom || "",
      })),
    };

    console.log("Sending BOM payload:", payload);
    mutation.mutate(payload);
  };

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box d-flex align-items-center justify-content-between">
          <div>
            <h2 className="fw-bold mb-1">Create Bill of Materials</h2>
            <div className="text-muted">Define product recipe</div>
          </div>
          <button className="btn btn-outline-secondary" onClick={() => navigate("/production/boms")}>
            ← Back to List
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="col-12">
        <form onSubmit={handleSubmit}>
          <div className="card-box">
            <h5 className="mb-3">BOM Header</h5>
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label">BOM Code *</label>
                <input
                  type="text"
                  className="form-control"
                  value={bomCode}
                  onChange={(e) => setBomCode(e.target.value)}
                  placeholder="BOM-001"
                  required
                />
                <small className="text-muted">Unique identifier for this BOM</small>
              </div>

              <div className="col-md-4">
                <label className="form-label">Finished Product *</label>
                <select
                  className="form-select"
                  value={parentItemKey}
                  onChange={(e) => setParentItemKey(e.target.value)}
                  required
                >
                  <option value="">Select Product</option>
                  {items.map((item) => (
                    <option key={item.item_key} value={item.item_key}>
                      {item.name} ({item.item_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Quantity Produced *</label>
                <input
                  type="number"
                  className="form-control"
                  value={quantityProduced}
                  onChange={(e) => setQuantityProduced(e.target.value)}
                  step="0.001"
                  min="0"
                  required
                />
                <small className="text-muted">How many units this BOM produces</small>
              </div>
            </div>

            {/* Components */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Components (Raw Materials)</h5>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleAddComponent}>
                + Add Component
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "50%" }}>Component Item *</th>
                    <th style={{ width: "25%" }}>Quantity Required *</th>
                    <th style={{ width: "20%" }}>UOM</th>
                    <th style={{ width: "5%" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {components.map((component, index) => (
                    <tr key={index}>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={component.item_key}
                          onChange={(e) => handleComponentChange(index, "item_key", e.target.value)}
                          required
                        >
                          <option value="">Select Component</option>
                          {items.map((item) => (
                            <option key={item.item_key} value={item.item_key}>
                              {item.name} ({item.item_code})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={component.quantity || ""}
                          onChange={(e) => handleComponentChange(index, "quantity", e.target.value)}
                          step="0.001"
                          min="0"
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={component.uom || ""}
                          onChange={(e) => handleComponentChange(index, "uom", e.target.value)}
                          placeholder="kg, pcs, etc"
                        />
                      </td>
                      <td>
                        {components.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemoveComponent(index)}
                          >
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="alert alert-info mt-3">
              <strong>ℹ️ Example:</strong> To produce 1 unit of "Finished Soap", you need:
              <br />• 0.5 kg of Oil
              <br />• 0.2 kg of Lye
              <br />• 0.3 kg of Water
            </div>

            {/* Actions */}
            <div className="d-flex gap-2 justify-content-end mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/production/boms")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Creating..." : "Create BOM"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}