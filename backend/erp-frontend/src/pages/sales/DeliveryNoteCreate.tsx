// src/pages/sales/DeliveryNoteCreate.tsx - FIXED VERSION
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createDeliveryNote, fetchSalesOrders } from "../../api/sales";

export default function DeliveryNoteCreate() {
  const navigate = useNavigate();

  const [soId, setSoId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split("T")[0]);
  const [warehouseKey, setWarehouseKey] = useState("1");
  const [notes, setNotes] = useState("");
  const [inventoryAccountKey, setInventoryAccountKey] = useState("42"); // Fixed: Use correct account
  const [cogsAccountKey, setCogsAccountKey] = useState("43"); // Fixed: Use correct account

  // ✅ FIX: Handle correct API response structure
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["sales-orders"],
    queryFn: fetchSalesOrders,
  });

  // ✅ FIX: Extract orders array from response
  const orders = ordersData?.orders || [];

  // Filter confirmed orders only
  const confirmedOrders = orders.filter((o: any) => o.status === "CONFIRMED");

  const mutation = useMutation({
    mutationFn: createDeliveryNote,
    onSuccess: (data) => {
      alert(`Delivery Note created successfully! Stock reduced.`);
      navigate("/sales/deliveries");
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.non_field_errors?.[0] || 
                       error.response?.data?.detail || 
                       error.response?.data?.error || 
                       error.message;
      alert(`Failed to create delivery: ${errorMsg}\n\n⚠️ Check stock availability!`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!soId) {
      alert("Please select a Sales Order");
      return;
    }

    if (!warehouseKey) {
      alert("Please select a warehouse");
      return;
    }

    mutation.mutate({
      so_id: Number(soId),
      delivery_date: deliveryDate,
      warehouse_key: Number(warehouseKey),
      notes,
      inventory_account_key: Number(inventoryAccountKey),
      cogs_account_key: Number(cogsAccountKey),
    });
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
            <h2 className="fw-bold mb-1">Create Delivery Note</h2>
            <div className="text-muted">⚠️ Stock will be validated and reduced</div>
          </div>
          <button className="btn btn-outline-secondary" onClick={() => navigate("/sales/deliveries")}>
            ← Back to List
          </button>
        </div>
      </div>

      {/* Warning Box */}
      <div className="col-12">
        <div className="alert alert-warning">
          <strong>⚠️ Stock Validation:</strong> This system will check stock availability before creating the delivery.
          If insufficient stock is available, the delivery will be rejected!
        </div>
      </div>

      {/* Form */}
      <div className="col-12">
        <form onSubmit={handleSubmit}>
          <div className="card-box">
            <h5 className="mb-3">Delivery Details</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Sales Order *</label>
                <select
                  className="form-select"
                  value={soId}
                  onChange={(e) => setSoId(e.target.value)}
                  required
                >
                  <option value="">Select Sales Order</option>
                  {confirmedOrders.map((order: any) => (
                    <option key={order.so_id} value={order.so_id}>
                      {order.so_number} - {order.customer_name}
                    </option>
                  ))}
                </select>
                {confirmedOrders.length === 0 && (
                  <small className="text-muted">
                    No confirmed sales orders available. Create and confirm an SO first.
                  </small>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label">Delivery Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Warehouse *</label>
                <select
                  className="form-select"
                  value={warehouseKey}
                  onChange={(e) => setWarehouseKey(e.target.value)}
                  required
                >
                  <option value="1">Main Warehouse</option>
                  <option value="2">Secondary Warehouse</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">Notes</label>
                <input
                  type="text"
                  className="form-control"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional delivery notes..."
                />
              </div>

              {/* GL Accounts */}
              <div className="col-12">
                <h6 className="mt-3">GL Accounts (Auto-posting)</h6>
              </div>

              <div className="col-md-6">
                <label className="form-label">Inventory Account (Credit) *</label>
                <input
                  type="number"
                  className="form-control"
                  value={inventoryAccountKey}
                  onChange={(e) => setInventoryAccountKey(e.target.value)}
                  required
                />
                <small className="text-muted">Account 3: Inventory (1500) - will be credited (reduced)</small>
              </div>

              <div className="col-md-6">
                <label className="form-label">COGS Account (Debit) *</label>
                <input
                  type="number"
                  className="form-control"
                  value={cogsAccountKey}
                  onChange={(e) => setCogsAccountKey(e.target.value)}
                  required
                />
                <small className="text-muted">Account 7: COGS (5000) - will be debited</small>
              </div>
            </div>

            {/* Important Notes */}
            <div className="alert alert-info mt-4">
              <strong>What happens when you submit:</strong>
              <ul className="mb-0">
                <li>✅ System checks if stock is available in the warehouse</li>
                <li>✅ If stock OK: Delivery created, inventory reduced</li>
                <li>✅ COGS calculated using real FIFO costing</li>
                <li>✅ GL entry created (Dr: COGS, Cr: Inventory)</li>
                <li>❌ If insufficient stock: Delivery rejected with error</li>
              </ul>
            </div>

            {/* Submit */}
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate("/sales/deliveries")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Creating..." : "✅ Create Delivery"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}