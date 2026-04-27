// src/pages/purchase/PurchaseOrderCreate.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createPurchaseOrder } from "../../api/purchase";
import { fetchVendors, type Vendor } from "../../api/vendors";
import { fetchItems, type Item } from "../../api/items";

interface PurchaseOrderLine {
  item_key: number;
  quantity: number;
  unit_price: number;
  description?: string;
  discount_amount?: number;
}

export default function PurchaseOrderCreate() {
  const navigate = useNavigate();

  const [companyKey] = useState(1); // TODO: Get from auth/context
  const [supplierKey, setSupplierKey] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [expectedDate, setExpectedDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [lines, setLines] = useState<PurchaseOrderLine[]>([
    { item_key: 0, quantity: 0, unit_price: 0, description: "", discount_amount: 0 },
  ]);

  // Fetch vendors and items for dropdowns
  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["vendors"],
    queryFn: () => fetchVendors(),
  });

  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ["items"],
    queryFn: () => fetchItems(),
  });

  const mutation = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: (data) => {
      alert(`Purchase Order ${data.po_number} created successfully!`);
      navigate("/purchase/orders");
    },
    onError: (error: any) => {
      alert("Failed to create PO: " + (error.response?.data?.error || error.message));
    },
  });

  const handleAddLine = () => {
    setLines([...lines, { item_key: 0, quantity: 0, unit_price: 0, description: "", discount_amount: 0 }]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof PurchaseOrderLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierKey) {
      alert("Please select a supplier");
      return;
    }

    if (lines.length === 0) {
      alert("Please add at least one line item");
      return;
    }

    // Validate lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.item_key || line.quantity <= 0 || line.unit_price < 0) {
        alert(`Line ${i + 1}: Please fill all required fields`);
        return;
      }
    }

    mutation.mutate({
      company_key: companyKey,
      supplier_key: Number(supplierKey),
      order_date: orderDate,
      expected_date: expectedDate || undefined,
      remarks,
      lines: lines.map((line) => ({
        item_key: Number(line.item_key),
        quantity: Number(line.quantity),
        unit_price: Number(line.unit_price),
        description: line.description,
        discount_amount: Number(line.discount_amount) || 0,
      })),
    });
  };

  const calculateTotal = () => {
    return lines.reduce((sum, line) => {
      const lineTotal = (line.quantity * line.unit_price) - (line.discount_amount || 0);
      return sum + lineTotal;
    }, 0);
  };

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box d-flex align-items-center justify-content-between">
          <div>
            <h2 className="fw-bold mb-1">Create Purchase Order</h2>
            <div className="text-muted">Order goods from supplier</div>
          </div>
          <button className="btn btn-outline-secondary" onClick={() => navigate("/purchase/orders")}>
            ← Back to List
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="col-12">
        <form onSubmit={handleSubmit}>
          <div className="card-box">
            <h5 className="mb-3">PO Header</h5>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label">Supplier *</label>
                <select
                  className="form-select"
                  value={supplierKey}
                  onChange={(e) => setSupplierKey(e.target.value)}
                  required
                >
                  <option value="">Select Supplier</option>
                  {vendors.map((v) => (
                    <option key={v.party_key} value={v.party_key}>
                      {v.name} ({v.party_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">Order Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Expected Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </div>

              <div className="col-12">
                <label className="form-label">Remarks</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Line Items</h5>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleAddLine}>
                + Add Line
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "30%" }}>Item *</th>
                    <th style={{ width: "15%" }}>Quantity *</th>
                    <th style={{ width: "15%" }}>Unit Price *</th>
                    <th style={{ width: "15%" }}>Discount</th>
                    <th style={{ width: "20%" }}>Description</th>
                    <th style={{ width: "5%" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={index}>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={line.item_key}
                          onChange={(e) => handleLineChange(index, "item_key", e.target.value)}
                          required
                        >
                          <option value="">Select Item</option>
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
                          value={line.quantity || ""}
                          onChange={(e) => handleLineChange(index, "quantity", e.target.value)}
                          step="0.001"
                          min="0"
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={line.unit_price || ""}
                          onChange={(e) => handleLineChange(index, "unit_price", e.target.value)}
                          step="0.0001"
                          min="0"
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={line.discount_amount || ""}
                          onChange={(e) => handleLineChange(index, "discount_amount", e.target.value)}
                          step="0.01"
                          min="0"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={line.description || ""}
                          onChange={(e) => handleLineChange(index, "description", e.target.value)}
                          placeholder="Notes..."
                        />
                      </td>
                      <td>
                        {lines.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemoveLine(index)}
                          >
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} className="text-end fw-bold">Total:</td>
                    <td className="fw-bold">{calculateTotal().toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Actions */}
            <div className="d-flex gap-2 justify-content-end mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/purchase/orders")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Creating..." : "Create Purchase Order"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}