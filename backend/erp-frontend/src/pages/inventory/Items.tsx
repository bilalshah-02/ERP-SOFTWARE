// src/pages/inventory/Items.tsx - UPDATED WITH RECIPE BADGES
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchItems, deleteItem, type Item, ITEM_CLASSES } from "../../api/items";

export default function Items() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items", search, filterClass],
    queryFn: () => fetchItems(search, filterClass),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      alert("✅ Item deleted successfully!");
    },
    onError: (error: any) => {
      alert("❌ Failed to delete item: " + (error.response?.data?.detail || error.message));
    },
  });

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
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
            <h2 className="fw-bold mb-1">Items (Products / Raw Materials)</h2>
            <div className="text-muted">Manage your inventory items</div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate("/inventory/items/create")}>
            + Create Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="col-12">
        <div className="card-box">
          <div className="row g-3">
            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="Search by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                <option value="">All Item Classes</option>
                {ITEM_CLASSES.map((cls) => (
                  <option key={cls.value} value={cls.value}>
                    {cls.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>UOM</th>
                  <th>Costing Method</th>
                  <th>Batch Tracked</th>
                  <th>Status</th>
                  <th style={{ width: 200 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">
                      {search || filterClass
                        ? "No items found matching your filters"
                        : "No items yet. Create your first item!"}
                    </td>
                  </tr>
                ) : (
                  items.map((item: Item) => (
                    <tr key={item.item_key}>
                      <td className="fw-bold">{item.item_code}</td>
                      <td>
                        {item.name}
                        {item.item_class === "MANUFACTURED" && (
                          <span className="badge bg-success ms-2" title="Has Recipe">
                            📋 Recipe
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            item.item_class === "MANUFACTURED"
                              ? "bg-primary"
                              : item.item_class === "INVENTORY"
                              ? "bg-secondary"
                              : "bg-info"
                          }`}
                        >
                          {item.item_class}
                        </span>
                      </td>
                      <td>{item.uom}</td>
                      <td>{item.costing_method || "–"}</td>
                      <td>
                        {item.is_batch_tracked ? (
                          <span className="badge bg-info">Yes</span>
                        ) : (
                          <span className="badge bg-light text-dark">No</span>
                        )}
                      </td>
                      <td>
                        {item.is_active !== false ? (
                          <span className="badge bg-success">Active</span>
                        ) : (
                          <span className="badge bg-danger">Inactive</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          {item.item_class === "MANUFACTURED" && (
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => navigate(`/inventory/items/${item.item_key}/recipe`)}
                              title="View Recipe"
                            >
                              📋 Recipe
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(item.item_key!, item.name)}
                            title="Delete"
                            disabled={deleteMutation.isPending}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {items.length > 0 && (
            <div className="mt-3 pt-3 border-top">
              <div className="row text-center">
                <div className="col-md-4">
                  <small className="text-muted">Total Items</small>
                  <div className="fs-5 fw-bold">{items.length}</div>
                </div>
                <div className="col-md-4">
                  <small className="text-muted">Raw Materials</small>
                  <div className="fs-5 fw-bold text-secondary">
                    {items.filter((i) => i.item_class === "INVENTORY").length}
                  </div>
                </div>
                <div className="col-md-4">
                  <small className="text-muted">Products (with recipes)</small>
                  <div className="fs-5 fw-bold text-primary">
                    {items.filter((i) => i.item_class === "MANUFACTURED").length}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Help */}
      <div className="col-12">
        <div className="card-box bg-light">
          <h6 className="fw-bold mb-2">💡 Quick Guide:</h6>
          <ul className="mb-0">
            <li>
              <strong>Step 1:</strong> Create Raw Materials first (Wood, Screws, etc.) with type = INVENTORY
            </li>
            <li>
              <strong>Step 2:</strong> Create Products (Chair, Table, etc.) with type = MANUFACTURED
            </li>
            <li>
              <strong>Step 3:</strong> When creating a product, the recipe section appears automatically - add raw materials inline!
            </li>
            <li>
              <strong>Recipe Button:</strong> Click 📋 Recipe to view the recipe for any manufactured product
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}