// src/pages/purchase/VendorInvoiceCreate.tsx - FIXED VERSION
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createVendorInvoice } from "../../api/purchase";
import { fetchVendors, type Vendor } from "../../api/vendors";
import { fetchItems, type Item } from "../../api/items";

interface VendorInvoiceLine {
  item_key?: number;
  description?: string;
  quantity?: number;
  unit_price?: number;
  line_amount: number;
}

export default function VendorInvoiceCreate() {
  const navigate = useNavigate();

  const [companyKey] = useState(1);
  const [supplierKey, setSupplierKey] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [expenseAccountKey, setExpenseAccountKey] = useState("43"); // ✅ FIXED: Changed to expense_account_key
  const [apAccountKey, setApAccountKey] = useState("45"); // Default AP account
  const [lines, setLines] = useState<VendorInvoiceLine[]>([
    { item_key: 0, quantity: 0, unit_price: 0, line_amount: 0, description: "" },
  ]);

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["vendors"],
    queryFn: () => fetchVendors(),
  });

  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ["items"],
    queryFn: () => fetchItems(),
  });

  const mutation = useMutation({
    mutationFn: createVendorInvoice,
    onSuccess: (data) => {
      alert(`Invoice ${data.invoice_number || 'created'} and posted to GL!`);
      navigate("/purchase/invoices");
    },
    onError: (error: any) => {
      alert("Failed to create invoice: " + (error.response?.data?.error || error.message));
    },
  });

  const handleAddLine = () => {
    setLines([...lines, { item_key: 0, quantity: 0, unit_price: 0, line_amount: 0, description: "" }]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof VendorInvoiceLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };

    // Auto-calculate line_amount if quantity and unit_price are set
    if (field === "quantity" || field === "unit_price") {
      const qty = field === "quantity" ? Number(value) : newLines[index].quantity || 0;
      const price = field === "unit_price" ? Number(value) : newLines[index].unit_price || 0;
      newLines[index].line_amount = qty * price;
    }

    setLines(newLines);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierKey || !invoiceNumber || !expenseAccountKey || !apAccountKey) {
      alert("Please fill all required fields");
      return;
    }

    if (lines.length === 0 || lines.some((l) => l.line_amount <= 0)) {
      alert("Please add valid line items with amounts");
      return;
    }

    mutation.mutate({
      company_key: companyKey,
      supplier_key: Number(supplierKey),
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      due_date: dueDate,
      inventory_account_key: Number(expenseAccountKey), // ✅ FIXED: Correct field name
      ap_account_key: Number(apAccountKey),
      lines: lines.map((line) => ({
        item_key: line.item_key || undefined,
        quantity: line.quantity || undefined,
        unit_price: line.unit_price || undefined,
        line_amount: Number(line.line_amount),
        description: line.description,
      })),
    });
  };

  const calculateTotal = () => {
    return lines.reduce((sum, line) => sum + (line.line_amount || 0), 0);
  };

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box d-flex align-items-center justify-content-between">
          <div>
            <h2 className="fw-bold mb-1">Create Vendor Invoice</h2>
            <div className="text-muted">Post AP invoice with automatic GL entries</div>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate("/purchase/invoices")}
          >
            ← Back to List
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="col-12">
        <form onSubmit={handleSubmit}>
          <div className="card-box">
            <h5 className="mb-3">Invoice Header</h5>
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

              <div className="col-md-6">
                <label className="form-label">Invoice Number *</label>
                <input
                  type="text"
                  className="form-control"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="VINV-2025-001"
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Invoice Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Due Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  Expense Account * 
                  <small className="text-muted"> (Debit)</small>
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={expenseAccountKey}
                  onChange={(e) => setExpenseAccountKey(e.target.value)}
                  placeholder="Account Key"
                  required
                />
                <small className="text-muted">Account 8: Expenses (will be debited)</small>
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  Accounts Payable Account * 
                  <small className="text-muted"> (Credit)</small>
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={apAccountKey}
                  onChange={(e) => setApAccountKey(e.target.value)}
                  placeholder="Account Key"
                  required
                />
                <small className="text-muted">Account 4: Accounts Payable (will be credited)</small>
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
                    <th style={{ width: "25%" }}>Item</th>
                    <th style={{ width: "12%" }}>Quantity</th>
                    <th style={{ width: "12%" }}>Unit Price</th>
                    <th style={{ width: "15%" }}>Line Amount *</th>
                    <th style={{ width: "30%" }}>Description</th>
                    <th style={{ width: "6%" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={index}>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={line.item_key || ""}
                          onChange={(e) => handleLineChange(index, "item_key", e.target.value)}
                        >
                          <option value="">Select Item (Optional)</option>
                          {items.map((item) => (
                            <option key={item.item_key} value={item.item_key}>
                              {item.name}
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
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={line.line_amount || ""}
                          onChange={(e) => handleLineChange(index, "line_amount", e.target.value)}
                          step="0.01"
                          min="0"
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={line.description || ""}
                          onChange={(e) => handleLineChange(index, "description", e.target.value)}
                          placeholder="Description..."
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
                  <tr className="table-active fw-bold">
                    <td colSpan={3} className="text-end">
                      Total:
                    </td>
                    <td>{calculateTotal().toFixed(2)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="alert alert-info mt-3">
              <strong>Note:</strong> This will automatically create GL entries:
              <br />
              Dr: Expense (Account {expenseAccountKey}) = {calculateTotal().toFixed(2)}
              <br />
              Cr: Accounts Payable (Account {apAccountKey}) = {calculateTotal().toFixed(2)}
            </div>

            {/* Actions */}
            <div className="d-flex gap-2 justify-content-end mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/purchase/invoices")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Posting..." : "Post Invoice to GL"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}