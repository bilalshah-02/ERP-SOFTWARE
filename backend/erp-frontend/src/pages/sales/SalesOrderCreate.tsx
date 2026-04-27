// src/pages/sales/SalesOrderCreate.tsx - FIXED VERSION
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createSalesOrder } from "../../api/sales";
import { fetchCustomers, type Customer } from "../../api/customers";
import { fetchItems, type Item } from "../../api/items";

interface SalesOrderLine {
  item_key: number;
  quantity: number;
  unit_price: number;
  description?: string;
  discount_amount?: number;
}

export default function SalesOrderCreate() {
  const navigate = useNavigate();

  const [companyKey] = useState(1);
  const [customerKey, setCustomerKey] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [lines, setLines] = useState<SalesOrderLine[]>([
    { item_key: 0, quantity: 0, unit_price: 0, description: "", discount_amount: 0 },
  ]);

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: () => fetchCustomers(),
  });

  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ["items"],
    queryFn: () => fetchItems(),
  });

  const mutation = useMutation({
    mutationFn: createSalesOrder,
    onSuccess: (data) => {
      alert(`Sales Order ${data.so_number} created successfully!`);
      navigate("/sales/orders");
    },
    onError: (error: any) => {
      alert("Failed to create SO: " + (error.response?.data?.error || error.message));
    },
  });

  const handleAddLine = () => {
    setLines([...lines, { item_key: 0, quantity: 0, unit_price: 0, description: "", discount_amount: 0 }]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof SalesOrderLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerKey) {
      alert("Please select a customer");
      return;
    }

    if (lines.length === 0) {
      alert("Please add at least one line item");
      return;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.item_key || line.quantity <= 0 || line.unit_price < 0) {
        alert(`Line ${i + 1}: Please fill all required fields`);
        return;
      }
    }

    mutation.mutate({
      company_key: companyKey,
      customer_key: Number(customerKey),
      order_date: orderDate,
      delivery_date: deliveryDate || undefined,
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
      <div className="col-12">
        <div className="card-box d-flex align-items-center justify-content-between">
          <div>
            <h2 className="fw-bold mb-1">Create Sales Order</h2>
            <div className="text-muted">Create customer order</div>
          </div>
          <button className="btn btn-outline-secondary" onClick={() => navigate("/sales/orders")}>
            ← Back to List
          </button>
        </div>
      </div>

      <div className="col-12">
        <form onSubmit={handleSubmit}>
          <div className="card-box">
            <h5 className="mb-3">SO Header</h5>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label">Customer *</label>
                <select
                  className="form-select"
                  value={customerKey}
                  onChange={(e) => setCustomerKey(e.target.value)}
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.party_key} value={c.party_key}>
                      {c.name} ({c.party_code})
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
                <label className="form-label">Delivery Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>

              <div className="col-12">
                <label className="form-label">Remarks</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional notes..."
                />
              </div>
            </div>

            <h5 className="mb-3">Line Items</h5>
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th style={{ width: "30%" }}>Item *</th>
                    <th style={{ width: "15%" }}>Quantity *</th>
                    <th style={{ width: "15%" }}>Unit Price *</th>
                    <th style={{ width: "15%" }}>Discount</th>
                    <th style={{ width: "15%" }}>Line Total</th>
                    <th style={{ width: "10%" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => {
                    const lineTotal = (line.quantity * line.unit_price) - (line.discount_amount || 0);
                    return (
                      <tr key={index}>
                        <td>
                          <select
                            className="form-select"
                            value={line.item_key}
                            onChange={(e) => handleLineChange(index, "item_key", e.target.value)}
                            required
                          >
                            <option value="">Select Item</option>
                            {items.map((item) => (
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
                            value={line.quantity || ""}
                            onChange={(e) => handleLineChange(index, "quantity", e.target.value)}
                            min="0"
                            step="0.001"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={line.unit_price || ""}
                            onChange={(e) => handleLineChange(index, "unit_price", e.target.value)}
                            min="0"
                            step="0.01"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={line.discount_amount || ""}
                            onChange={(e) => handleLineChange(index, "discount_amount", e.target.value)}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={lineTotal.toFixed(2)}
                            readOnly
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRemoveLine(index)}
                            disabled={lines.length === 1}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              className="btn btn-outline-primary mb-4"
              onClick={handleAddLine}
            >
              + Add Line
            </button>

            <div className="row">
              <div className="col-md-8"></div>
              <div className="col-md-4">
                <div className="card bg-light p-3">
                  <div className="d-flex justify-content-between mb-2">
                    <strong>Total:</strong>
                    <strong className="fs-4">{calculateTotal().toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate("/sales/orders")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Creating..." : "Create Sales Order"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}