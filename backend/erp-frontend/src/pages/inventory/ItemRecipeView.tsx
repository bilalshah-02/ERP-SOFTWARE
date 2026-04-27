// src/pages/inventory/ItemRecipeView.tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { fetchItemRecipe, fetchItemById, type Item } from "../../api/items";

export default function ItemRecipeView() {
  const navigate = useNavigate();
  const { id } = useParams(); // Product item_key

  // Fetch product
  const { data: product } = useQuery<Item>({
    queryKey: ["item", id],
    queryFn: () => fetchItemById(Number(id)),
    enabled: !!id,
  });

  // Fetch recipe
  const { data: recipe, isLoading } = useQuery({
    queryKey: ["item-recipe", id],
    queryFn: () => fetchItemRecipe(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!recipe || !recipe.components || recipe.components.length === 0) {
    return (
      <div className="row g-4">
        <div className="col-12">
          <div className="card-box">
            <h2 className="fw-bold mb-3">No Recipe Found</h2>
            <p>This product doesn't have a recipe yet.</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/inventory/items/${id}/recipe/create`)}
            >
              Create Recipe
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalComponents = recipe.components?.length || 0;

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box d-flex align-items-center justify-content-between">
          <div>
            <h2 className="fw-bold mb-1">Recipe: {product?.name || recipe.product_name}</h2>
            <div className="text-muted">Manufacturing formula</div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" onClick={() => navigate("/inventory/items")}>
              ← Back to Items
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/production/batches/create?product_id=${id}`)}
            >
              🏭 Start Production
            </button>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="col-md-4">
        <div className="card-box">
          <h5 className="mb-3">Product Information</h5>
          <table className="table table-sm">
            <tbody>
              <tr>
                <th style={{ width: "40%" }}>Product:</th>
                <td>{product?.name || recipe.product_name}</td>
              </tr>
              <tr>
                <th>Code:</th>
                <td>{product?.item_code || recipe.product_code}</td>
              </tr>
              <tr>
                <th>Output:</th>
                <td className="fw-bold">1 unit</td>
              </tr>
              <tr>
                <th>Ingredients:</th>
                <td className="fw-bold text-primary">{totalComponents} items</td>
              </tr>
              <tr>
                <th>Status:</th>
                <td>
                  <span className="badge bg-success">Active</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Recipe Components */}
      <div className="col-md-8">
        <div className="card-box">
          <h5 className="mb-3">Recipe Ingredients</h5>
          <div className="alert alert-info mb-3">
            <strong>📋 Formula:</strong> To produce <strong>1 unit</strong> of {product?.name || recipe.product_name}, you need:
          </div>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Raw Material / Component</th>
                  <th>Item Code</th>
                  <th className="text-end">Quantity per Unit</th>
                  <th>UOM</th>
                </tr>
              </thead>
              <tbody>
                {recipe.components && recipe.components.map((component: any, index: number) => (
                  <tr key={index}>
                    <td className="fw-semibold">{component.item_name || `Item #${component.item_key}`}</td>
                    <td>{component.item_code || 'N/A'}</td>
                    <td className="text-end fw-bold text-primary">{component.quantity_per?.toFixed(3) || component.quantity?.toFixed(3)}</td>
                    <td>{component.uom || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Production Examples */}
      <div className="col-12">
        <div className="card-box bg-light">
          <h5 className="mb-3">📊 Production Calculation Examples</h5>
          <div className="table-responsive">
            <table className="table table-bordered mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Production Quantity</th>
                  {recipe.components && recipe.components.slice(0, 3).map((comp: any, idx: number) => (
                    <th key={idx}>{comp.item_name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[10, 50, 100, 500].map((qty) => (
                  <tr key={qty}>
                    <td className="fw-bold">{qty} units</td>
                    {recipe.components && recipe.components.slice(0, 3).map((comp: any, idx: number) => (
                      <td key={idx}>
                        {((comp.quantity_per || comp.quantity) * qty).toFixed(3)} {comp.uom}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="col-12">
        <div className="card-box">
          <h5 className="mb-3">Quick Actions</h5>
          <div className="row g-3">
            <div className="col-md-4">
              <button
                className="btn btn-outline-primary w-100"
                onClick={() => navigate(`/production/batches/create?product_id=${id}`)}
              >
                🏭 Create Production Order
              </button>
            </div>
            <div className="col-md-4">
              <button
                className="btn btn-outline-info w-100"
                onClick={() => navigate(`/inventory/items/${id}/recipe/edit`)}
              >
                ✏️ Edit Recipe
              </button>
            </div>
            <div className="col-md-4">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => navigate("/inventory/items")}
              >
                📋 Back to Items
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}