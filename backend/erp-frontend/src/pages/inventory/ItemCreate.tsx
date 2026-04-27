// src/pages/inventory/ItemCreate.tsx - NEW WITH INLINE RECIPE
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchItems, ITEM_CLASSES, UOMS, type Item } from "../../api/items";
import { http } from "../../api/http";

interface RecipeComponent {
  component_item_key: number;
  quantity_per: number;
  uom: string;
}

export default function ItemCreate() {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    item_code: "",
    name: "",
    description: "",
    item_class: "INVENTORY",
    uom: "pcs",
    costing_method: "FIFO",
    is_batch_tracked: false,
    is_active: true,
  });

  // Recipe state (only for MANUFACTURED items)
  const [recipeComponents, setRecipeComponents] = useState<RecipeComponent[]>([
    { component_item_key: 0, quantity_per: 0, uom: "pcs" },
  ]);

  // Fetch all items for recipe dropdown (raw materials)
  const { data: allItems = [] } = useQuery<Item[]>({
    queryKey: ["items"],
    queryFn: () => fetchItems(),
  });

  // Filter to show only raw materials (not manufactured items)
  const rawMaterials = allItems.filter(
    (item) => item.item_class === "INVENTORY" || item.item_class === "SERVICE"
  );

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // If MANUFACTURED, include recipe
      if (formData.item_class === "MANUFACTURED" && recipeComponents.length > 0) {
        // Validate recipe
        const validComponents = recipeComponents.filter(
          (comp) => comp.component_item_key > 0 && comp.quantity_per > 0
        );

        if (validComponents.length === 0) {
          throw new Error("Please add at least one raw material to the recipe");
        }

        // Create item with recipe in ONE call
        const response = await http.post("/api/items/with-recipe/", {
          item: data,
          recipe: validComponents,
        });

        if (!response.data) {
          throw new Error("Failed to create item with recipe");
        }

        return response.data;
      } else {
        // Create regular item
        const response = await http.post("/api/items/", data);
        return response.data;
      }
    },
    onSuccess: () => {
      alert("✅ Item created successfully!");
      navigate("/inventory/items");
    },
    onError: (error: any) => {
      alert("❌ Failed to create item: " + (error.response?.data?.error || error.message));
      console.error("Error:", error);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleAddComponent = () => {
    setRecipeComponents([
      ...recipeComponents,
      { component_item_key: 0, quantity_per: 0, uom: "pcs" },
    ]);
  };

  const handleRemoveComponent = (index: number) => {
    if (recipeComponents.length > 1) {
      setRecipeComponents(recipeComponents.filter((_, i) => i !== index));
    }
  };

  const handleComponentChange = (index: number, field: keyof RecipeComponent, value: any) => {
    const newComponents = [...recipeComponents];
    newComponents[index] = { ...newComponents[index], [field]: value };
    setRecipeComponents(newComponents);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.item_code || !formData.name) {
      alert("Please fill all required fields");
      return;
    }

    mutation.mutate(formData);
  };

  const isManufactured = formData.item_class === "MANUFACTURED";

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box d-flex align-items-center justify-content-between">
          <div>
            <h2 className="fw-bold mb-1">Create Item</h2>
            <div className="text-muted">Add new item to inventory</div>
          </div>
          <button className="btn btn-outline-secondary" onClick={() => navigate("/inventory/items")}>
            ← Back to Items
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="col-12">
        <form onSubmit={handleSubmit}>
          <div className="card-box">
            {/* Basic Info */}
            <h5 className="mb-3">Basic Information</h5>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label">Item Code *</label>
                <input
                  type="text"
                  className="form-control"
                  name="item_code"
                  value={formData.item_code}
                  onChange={handleChange}
                  placeholder="e.g., CHAIR-001, WOOD-001"
                  required
                />
                <small className="text-muted">Unique identifier for this item</small>
              </div>

              <div className="col-md-6">
                <label className="form-label">Item Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Office Chair, Wood Plank"
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Optional description"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Item Type *</label>
                <select
                  className="form-select"
                  name="item_class"
                  value={formData.item_class}
                  onChange={handleChange}
                  required
                >
                  {ITEM_CLASSES.map((cls) => (
                    <option key={cls.value} value={cls.value}>
                      {cls.label}
                    </option>
                  ))}
                </select>
                <small className="text-muted">
                  {isManufactured ? "📦 Final Product (needs recipe)" : "🔧 Raw Material"}
                </small>
              </div>

              <div className="col-md-4">
                <label className="form-label">Unit of Measure *</label>
                <select
                  className="form-select"
                  name="uom"
                  value={formData.uom}
                  onChange={handleChange}
                  required
                >
                  {UOMS.map((uom) => (
                    <option key={uom} value={uom}>
                      {uom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Costing Method</label>
                <select
                  className="form-select"
                  name="costing_method"
                  value={formData.costing_method}
                  onChange={handleChange}
                >
                  <option value="FIFO">FIFO</option>
                  <option value="LIFO">LIFO</option>
                  <option value="AVERAGE">Average</option>
                  <option value="STANDARD">Standard</option>
                </select>
              </div>

              <div className="col-md-6">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="is_batch_tracked"
                    checked={formData.is_batch_tracked}
                    onChange={handleChange}
                  />
                  <label className="form-check-label">Batch Tracked</label>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                  <label className="form-check-label">Active</label>
                </div>
              </div>
            </div>

            {/* Recipe Section - Only for MANUFACTURED items */}
            {isManufactured && (
              <>
                <hr className="my-4" />
                <div className="alert alert-info mb-3">
                  <strong>📋 Recipe Required:</strong> Since this is a final product, please add the raw materials needed to manufacture it.
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Recipe (Raw Materials)</h5>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={handleAddComponent}
                  >
                    + Add Raw Material
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "50%" }}>Raw Material *</th>
                        <th style={{ width: "25%" }}>Quantity per Unit *</th>
                        <th style={{ width: "20%" }}>Unit of Measure</th>
                        <th style={{ width: "5%" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipeComponents.map((component, index) => (
                        <tr key={index}>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={component.component_item_key}
                              onChange={(e) =>
                                handleComponentChange(index, "component_item_key", e.target.value)
                              }
                              required={isManufactured}
                            >
                              <option value="">Select Raw Material</option>
                              {rawMaterials.map((item) => (
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
                              value={component.quantity_per || ""}
                              onChange={(e) =>
                                handleComponentChange(index, "quantity_per", e.target.value)
                              }
                              step="0.001"
                              min="0.001"
                              placeholder="0.000"
                              required={isManufactured}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={component.uom}
                              onChange={(e) => handleComponentChange(index, "uom", e.target.value)}
                              placeholder="kg, pcs, ltr"
                            />
                          </td>
                          <td className="text-center">
                            {recipeComponents.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleRemoveComponent(index)}
                                title="Remove"
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

                <div className="alert alert-success">
                  <strong>💡 Example:</strong> If you're creating "Office Chair", add:
                  <br />• Wood Plank: 4 pcs
                  <br />• Screws: 16 pcs
                  <br />• Varnish: 0.5 ltr
                  <br />
                  <br />
                  When you manufacture 100 chairs, the system will automatically calculate: 400 wood planks, 1,600 screws, 50 ltr varnish.
                </div>
              </>
            )}

            {/* Actions */}
            <div className="d-flex gap-2 justify-content-end mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/inventory/items")}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                {mutation.isPending
                  ? "Saving..."
                  : isManufactured
                  ? "💾 Save Product & Recipe"
                  : "💾 Save Item"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div className="col-12">
        <div className="card-box bg-light">
          <h6 className="fw-bold mb-2">📚 Item Types Explained:</h6>
          <ul className="mb-0">
            <li>
              <strong>Inventory:</strong> Raw materials, components (e.g., Wood, Screws, Fabric) - No recipe needed
            </li>
            <li>
              <strong>Manufactured:</strong> Final products made from raw materials (e.g., Chair, Table) - <strong>Recipe section appears automatically!</strong>
            </li>
            <li>
              <strong>Service:</strong> Services offered (e.g., Assembly, Delivery) - No recipe needed
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}