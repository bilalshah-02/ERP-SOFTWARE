// src/pages/inventory/ItemRecipeCreate.tsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchItems, fetchItemById, type Item } from "../../api/items";
import { createItemRecipe } from "../../api/items";

interface RecipeComponent {
  item_key: number;
  quantity: number;
  uom?: string;
}

export default function ItemRecipeCreate() {
  const navigate = useNavigate();
  const { id } = useParams(); // Product item_key

  const [components, setComponents] = useState<RecipeComponent[]>([
    { item_key: 0, quantity: 0, uom: "" },
  ]);

  // Fetch the product details
  const { data: product } = useQuery<Item>({
    queryKey: ["item", id],
    queryFn: () => fetchItemById(Number(id)),
    enabled: !!id,
  });

  // Fetch all items for component dropdown
  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ["items"],
    queryFn: () => fetchItems(),
  });

  // Filter out the current product from components list
  const availableItems = items.filter(item => item.item_key !== Number(id));

  const mutation = useMutation({
    mutationFn: createItemRecipe,
    onSuccess: (data) => {
      alert(`Recipe created successfully for ${product?.name}!`);
      navigate(`/inventory/items`);
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || 
                      JSON.stringify(error.response?.data) || 
                      error.message;
      alert("Failed to create recipe: " + errorMsg);
      console.error("Recipe creation error:", error.response?.data);
    },
  });

  const handleAddComponent = () => {
    setComponents([...components, { item_key: 0, quantity: 0, uom: "" }]);
  };

  const handleRemoveComponent = (index: number) => {
    if (components.length > 1) {
      setComponents(components.filter((_, i) => i !== index));
    }
  };

  const handleComponentChange = (index: number, field: keyof RecipeComponent, value: any) => {
    const newComponents = [...components];
    newComponents[index] = { ...newComponents[index], [field]: value };
    setComponents(newComponents);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!product) {
      alert("Product not found");
      return;
    }

    if (components.length === 0) {
      alert("Please add at least one component");
      return;
    }

    // Validate components
    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      if (!component.item_key || component.quantity <= 0) {
        alert(`Component ${i + 1}: Please fill all required fields`);
        return;
      }
    }

    const payload = {
      product_item_key: Number(id),
      components: components.map((comp) => ({
        component_item_key: Number(comp.item_key),
        quantity_per: Number(comp.quantity),
        uom: comp.uom || "",
      })),
    };

    console.log("Creating recipe:", payload);
    mutation.mutate(payload);
  };

  if (!product) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box d-flex align-items-center justify-content-between">
          <div>
            <h2 className="fw-bold mb-1">Create Recipe for: {product.name}</h2>
            <div className="text-muted">Define how to manufacture this product</div>
          </div>
          <button className="btn btn-outline-secondary" onClick={() => navigate("/inventory/items")}>
            ← Back to Items
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="col-12">
        <div className="alert alert-info">
          <strong>📦 Product:</strong> {product.name} ({product.item_code})
          <br />
          <strong>Type:</strong> {product.item_class}
          <br />
          <strong>Recipe Output:</strong> 1 unit of {product.name}
        </div>
      </div>

      {/* Form */}
      <div className="col-12">
        <form onSubmit={handleSubmit}>
          <div className="card-box">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Recipe Ingredients (Raw Materials)</h5>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleAddComponent}>
                + Add Ingredient
              </button>
            </div>

            <div className="alert alert-warning">
              <strong>⚠️ Important:</strong> Define quantities needed to make <strong>1 unit</strong> of {product.name}
            </div>

            <div className="table-responsive">
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "50%" }}>Raw Material / Component *</th>
                    <th style={{ width: "25%" }}>Quantity per Unit *</th>
                    <th style={{ width: "20%" }}>Unit of Measure</th>
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
                          <option value="">Select Raw Material</option>
                          {availableItems.map((item) => (
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
                          min="0.001"
                          placeholder="0.000"
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={component.uom || ""}
                          onChange={(e) => handleComponentChange(index, "uom", e.target.value)}
                          placeholder="kg, pcs, ltr"
                        />
                      </td>
                      <td className="text-center">
                        {components.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemoveComponent(index)}
                            title="Remove ingredient"
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

            {/* Example */}
            <div className="alert alert-success mt-3">
              <strong>💡 Example:</strong> To produce <strong>1 unit of Soap</strong>, you need:
              <br />• 0.5 kg of Oil
              <br />• 0.2 kg of Lye
              <br />• 0.3 kg of Water
              <br />
              <br />
              When you create a production order for <strong>100 units</strong>, the system will automatically calculate:
              <br />• 50 kg of Oil (0.5 × 100)
              <br />• 20 kg of Lye (0.2 × 100)
              <br />• 30 kg of Water (0.3 × 100)
            </div>

            {/* Actions */}
            <div className="d-flex gap-2 justify-content-end mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/inventory/items")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Creating Recipe..." : "💾 Save Recipe"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div className="col-12">
        <div className="card-box bg-light">
          <h6 className="fw-bold mb-2">📚 How Recipes Work:</h6>
          <ol className="mb-0">
            <li>Define the raw materials needed to make 1 unit of this product</li>
            <li>When creating a production order, just select this product and quantity</li>
            <li>The system automatically calculates required materials using this recipe</li>
            <li>No need to manually create BOM for each production order!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}