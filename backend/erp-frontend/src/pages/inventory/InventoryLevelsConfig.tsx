// src/pages/inventory/InventoryLevelsConfig.tsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardBody } from "../../components/ui/Cards";
import  Button  from "../../components/ui/Button";
import { fetchItems } from "../../api/items";
import {
  configureInventoryLevels,
  fetchInventoryLevels,
  type InventoryLevelsInput,
  type ItemWithLevels,
} from "../../api/inventoryLevels";

export default function InventoryLevelsConfig() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const itemKeyParam = searchParams.get("item_key");

  const [items, setItems] = useState<any[]>([]);
  const [selectedItemKey, setSelectedItemKey] = useState<number>(
    itemKeyParam ? parseInt(itemKeyParam) : 0
  );
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Form data
  const [formData, setFormData] = useState<InventoryLevelsInput>({
    item_key: 0,
    avg_daily_usage: 0,
    min_daily_usage: 0,
    max_daily_usage: 0,
    avg_lead_time_days: 0,
    min_lead_time_days: 0,
    max_lead_time_days: 0,
    economic_order_qty: 0,
  });

  // Calculated levels
  const [calculated, setCalculated] = useState<ItemWithLevels | null>(null);

  // Load items
  useEffect(() => {
    loadItems();
  }, []);

  // Load existing levels if item selected
  useEffect(() => {
    if (selectedItemKey > 0) {
      loadExistingLevels();
    }
  }, [selectedItemKey]);

  const loadItems = async () => {
    try {
      const data = await fetchItems();
      setItems(data);
    } catch (error) {
      console.error("Failed to load items:", error);
    }
  };

  const loadExistingLevels = async () => {
    try {
      const data = await fetchInventoryLevels({ item_key: selectedItemKey });
      if (data && data.length > 0) {
        const existing = data[0];
        setFormData({
          item_key: existing.item_key,
          avg_daily_usage: existing.avg_daily_usage,
          min_daily_usage: existing.min_daily_usage,
          max_daily_usage: existing.max_daily_usage,
          avg_lead_time_days: existing.avg_lead_time_days,
          min_lead_time_days: existing.min_lead_time_days,
          max_lead_time_days: existing.max_lead_time_days,
          economic_order_qty: existing.economic_order_qty,
        });
        setCalculated(existing);
      }
    } catch (error) {
      console.error("Failed to load existing levels:", error);
    }
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemKey = parseInt(e.target.value);
    setSelectedItemKey(itemKey);
    setFormData({ ...formData, item_key: itemKey });
    setCalculated(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseFloat(value) || 0,
    });
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.item_key === 0) {
      alert("Please select an item");
      return;
    }

    console.log("Sending data:", formData); // Debug log

    setCalculating(true);

    try {
      const result = await configureInventoryLevels(formData);
      console.log("Success result:", result); // Debug log
      setCalculated(result as any);
      alert("✅ Inventory levels calculated and saved successfully!");
    } catch (error: any) {
      console.error("Full error object:", error);
      console.error("Error response:", error.response);
      console.error("Error data:", error.response?.data);
      
      // Show detailed error in alert
      alert(`❌ Error: ${JSON.stringify(error.response?.data, null, 2)}`);
    } finally {
      setCalculating(false);
    }
  };

  const selectedItem = items.find((i) => i.item_key === selectedItemKey);

  return (
    <div className="container-fluid p-4">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Configure Inventory Levels</h2>
          <p className="text-muted mb-0">
            Set reorder points, min/max stock levels, and economic order quantities
          </p>
        </div>
        <Button 
          onClick={() => navigate("/inventory/levels/list")}
          className="btn btn-outline-primary"
        >
          📊 View All Items
        </Button>
      </div>

      <div className="row">
        {/* Left Column - Configuration Form */}
        <div className="col-lg-8">
          <Card>
            <CardHeader 
              title="Inventory Control Parameters"
              subtitle="Configure usage patterns and lead times for automatic stock level calculation"
            />
            <CardBody>
              <form onSubmit={handleCalculate}>
                {/* Item Selection */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Select Item <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select form-select-lg"
                    value={selectedItemKey}
                    onChange={handleItemChange}
                    required
                  >
                    <option value={0}>-- Select an Item --</option>
                    {items.map((item) => (
                      <option key={item.item_key} value={item.item_key}>
                        {item.item_code} - {item.name}
                      </option>
                    ))}
                  </select>
                  {selectedItem && (
                    <small className="text-muted d-block mt-1">
                      Unit of Measure: <span className="fw-semibold">{selectedItem.uom || "N/A"}</span>
                    </small>
                  )}
                </div>

                {selectedItemKey > 0 && (
                  <>
                    {/* Daily Usage Section */}
                    <div className="mb-4">
                      <h5 className="border-bottom pb-2 mb-3">
                        📈 Daily Usage Pattern
                      </h5>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label">Minimum Usage/Day</label>
                          <input
                            type="number"
                            className="form-control"
                            name="min_daily_usage"
                            value={formData.min_daily_usage}
                            onChange={handleInputChange}
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                          />
                          <small className="text-muted">Lowest daily consumption</small>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Average Usage/Day</label>
                          <input
                            type="number"
                            className="form-control"
                            name="avg_daily_usage"
                            value={formData.avg_daily_usage}
                            onChange={handleInputChange}
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                          />
                          <small className="text-muted">Typical daily consumption</small>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">
                            Maximum Usage/Day <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            name="max_daily_usage"
                            value={formData.max_daily_usage}
                            onChange={handleInputChange}
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            required
                          />
                          <small className="text-muted">Peak daily consumption</small>
                        </div>
                      </div>
                    </div>

                    {/* Lead Time Section */}
                    <div className="mb-4">
                      <h5 className="border-bottom pb-2 mb-3">
                        ⏱️ Lead Time (Days)
                      </h5>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label">Minimum Lead Time</label>
                          <input
                            type="number"
                            className="form-control"
                            name="min_lead_time_days"
                            value={formData.min_lead_time_days}
                            onChange={handleInputChange}
                            min="0"
                            placeholder="0"
                          />
                          <small className="text-muted">Fastest delivery time</small>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Average Lead Time</label>
                          <input
                            type="number"
                            className="form-control"
                            name="avg_lead_time_days"
                            value={formData.avg_lead_time_days}
                            onChange={handleInputChange}
                            min="0"
                            placeholder="0"
                          />
                          <small className="text-muted">Typical delivery time</small>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">
                            Maximum Lead Time <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            name="max_lead_time_days"
                            value={formData.max_lead_time_days}
                            onChange={handleInputChange}
                            min="0"
                            placeholder="0"
                            required
                          />
                          <small className="text-muted">Longest delivery time</small>
                        </div>
                      </div>
                    </div>

                    {/* EOQ Section */}
                    <div className="mb-4">
                      <h5 className="border-bottom pb-2 mb-3">
                        📦 Economic Order Quantity
                      </h5>
                      <div className="row">
                        <div className="col-md-6">
                          <label className="form-label">Economic Order Qty (EOQ)</label>
                          <input
                            type="number"
                            className="form-control"
                            name="economic_order_qty"
                            value={formData.economic_order_qty}
                            onChange={handleInputChange}
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                          />
                          <small className="text-muted">
                            Optimal order quantity to minimize total inventory costs
                          </small>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="d-flex gap-2 pt-3 border-top">
                      <Button 
                        type="submit" 
                        disabled={calculating}
                        className="btn btn-primary btn-lg px-4"
                      >
                        {calculating ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Calculating...
                          </>
                        ) : (
                          <>🔄 Calculate & Save Levels</>
                        )}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => navigate("/inventory/balance")}
                        className="btn btn-outline-secondary"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </CardBody>
          </Card>
        </div>

        {/* Right Column - Calculated Results */}
        <div className="col-lg-4">
          {calculated ? (
            <Card>
              <CardHeader title="✅ Calculated Stock Levels" />
              <CardBody>
                {/* Reorder Level */}
                <div className="mb-4 p-3 bg-primary bg-opacity-10 rounded">
                  <div className="text-muted small mb-1">Reorder Level</div>
                  <div className="fs-2 fw-bold text-primary">
                    {calculated.reorder_level?.toFixed(2)}
                  </div>
                  <small className="text-muted">
                    📍 Order when stock hits this level
                  </small>
                </div>

                {/* Minimum Levels */}
                <div className="mb-3">
                  <h6 className="text-uppercase small fw-semibold text-muted mb-2">
                    Minimum Stock Levels
                  </h6>
                  <div className="row g-2">
                    <div className="col-6">
                      <div className="p-2 border rounded">
                        <div className="small text-muted">Absolute</div>
                        <div className="fw-bold fs-5 text-danger">
                          {calculated.min_stock_absolute?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-2 border rounded">
                        <div className="small text-muted">Normal</div>
                        <div className="fw-bold fs-5 text-warning">
                          {calculated.min_stock_normal?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Maximum Levels */}
                <div className="mb-4">
                  <h6 className="text-uppercase small fw-semibold text-muted mb-2">
                    Maximum Stock Levels
                  </h6>
                  <div className="row g-2">
                    <div className="col-6">
                      <div className="p-2 border rounded">
                        <div className="small text-muted">Absolute</div>
                        <div className="fw-bold fs-5 text-success">
                          {calculated.max_stock_absolute?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-2 border rounded">
                        <div className="small text-muted">Normal</div>
                        <div className="fw-bold fs-5 text-info">
                          {calculated.max_stock_normal?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formulas Reference */}
                <div className="alert alert-light border">
                  <h6 className="small fw-semibold mb-2">📐 Formulas Used:</h6>
                  <ul className="mb-0 small" style={{ fontSize: "0.8rem", lineHeight: "1.6" }}>
                    <li><code>Reorder = Max Usage × Max Lead Time</code></li>
                    <li><code>Min Abs = Reorder - (Max × Max Lead)</code></li>
                    <li><code>Min Normal = Reorder - (Avg × Avg Lead)</code></li>
                    <li><code>Max Abs = Reorder - (Min × Min Lead) + EOQ</code></li>
                    <li><code>Max Normal = Reorder - (Avg × Avg Lead) + EOQ</code></li>
                  </ul>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody>
                <div className="text-center py-5 text-muted">
                  <div className="fs-1 mb-3">📊</div>
                  <p className="mb-0">Select an item and enter parameters to calculate stock levels</p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}