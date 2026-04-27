// src/pages/purchase/GoodsReceipt.tsx - COMPLETELY FIXED VERSION
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query"; // ✅ FIXED: Correct import
import { createGoodsReceipt, fetchPurchaseOrder } from "../../api/purchase";

interface GoodsReceiptLine {
  po_line_id: number;
  quantity_received: number;
}

export default function GoodsReceipt() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const poIdParam = searchParams.get("po_id");

  const [poId, setPoId] = useState(poIdParam || "");
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split("T")[0]);
  const [warehouseKey, setWarehouseKey] = useState("1");
  const [notes, setNotes] = useState("");
  const [inventoryAccountKey, setInventoryAccountKey] = useState("3");
  const [lines, setLines] = useState<GoodsReceiptLine[]>([]);

  // Fetch PO details when PO ID is entered
  const { data: po, isLoading: poLoading } = useQuery({
    queryKey: ["purchase-order", poId],
    queryFn: () => fetchPurchaseOrder(Number(poId)),
    enabled: !!poId && Number(poId) > 0,
  });

  // Initialize lines when PO is loaded
  useEffect(() => {
    if (po?.lines) {
      setLines(
        po.lines.map((line: any) => ({
          po_line_id: line.po_line_id,
          quantity_received: line.quantity - (line.quantity_received || 0),
        }))
      );
    }
  }, [po]);

  const mutation = useMutation({
    mutationFn: createGoodsReceipt,
    onSuccess: (data: any) => { // ✅ FIXED: Added type annotation
      alert(`Goods Receipt ${data.grn_number || 'created'} successfully!`);
      navigate("/purchase/orders");
    },
    onError: (error: any) => {
      alert("Failed to create GRN: " + (error.response?.data?.error || error.message));
    },
  });

  const handleLineChange = (index: number, value: number) => {
    const newLines = [...lines];
    newLines[index].quantity_received = value;
    setLines(newLines);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!poId) {
      alert("Please enter a PO ID");
      return;
    }

    if (!warehouseKey) {
      alert("Please select a warehouse");
      return;
    }

    if (!inventoryAccountKey) {
      alert("Please enter inventory account");
      return;
    }

    const validLines = lines.filter((line) => line.quantity_received > 0);
    if (validLines.length === 0) {
      alert("Please enter at least one quantity to receive");
      return;
    }

    mutation.mutate({
      po_id: Number(poId),
      receipt_date: receiptDate,
      warehouse_key: Number(warehouseKey),
      notes,
      inventory_account_key: Number(inventoryAccountKey),
      lines: validLines,
    });
  };

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box d-flex align-items-center justify-content-between">
          <div>
            <h2 className="fw-bold mb-1">Goods Receipt Note (GRN)</h2>
            <div className="text-muted">Receive items from purchase order</div>
          </div>
          <button className="btn btn-outline-secondary" onClick={() => navigate("/purchase/orders")}>
            ← Back to POs
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="col-12">
        <form onSubmit={handleSubmit}>
          <div className="card-box">
            <h5 className="mb-3">Receipt Header</h5>
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <label className="form-label">Purchase Order ID *</label>
                <input
                  type="number"
                  className="form-control"
                  value={poId}
                  onChange={(e) => setPoId(e.target.value)}
                  placeholder="Enter PO ID"
                  required
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Receipt Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Warehouse *</label>
                <input
                  type="number"
                  className="form-control"
                  value={warehouseKey}
                  onChange={(e) => setWarehouseKey(e.target.value)}
                  placeholder="Warehouse ID"
                  required
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Inventory Account *</label>
                <input
                  type="number"
                  className="form-control"
                  value={inventoryAccountKey}
                  onChange={(e) => setInventoryAccountKey(e.target.value)}
                  placeholder="Account Key"
                  required
                />
                <small className="text-muted">Account 3: Inventory (will be debited)</small>
              </div>

              <div className="col-12">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Delivery notes..."
                />
              </div>
            </div>

            {/* PO Info */}
            {poLoading && (
              <div className="alert alert-info">Loading PO details...</div>
            )}

            {po && (
              <div className="alert alert-success mb-4">
                <strong>PO {po.po_number}</strong> - {po.supplier_name} - Order Date:{" "}
                {new Date(po.order_date).toLocaleDateString()}
              </div>
            )}

            {/* Line Items */}
            {po?.lines && lines.length > 0 && (
              <>
                <h5 className="mb-3">Items to Receive</h5>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>Item</th>
                        <th className="text-end">Ordered Qty</th>
                        <th className="text-end">Already Received</th>
                        <th className="text-end">Remaining</th>
                        <th className="text-end">Receive Now *</th>
                      </tr>
                    </thead>
                    <tbody>
                      {po.lines.map((line: any, index: number) => {
                        const ordered = line.quantity;
                        const received = line.quantity_received || 0;
                        const remaining = ordered - received;

                        return (
                          <tr key={line.po_line_id}>
                            <td className="fw-semibold">{line.item_name}</td>
                            <td className="text-end">{ordered.toFixed(3)}</td>
                            <td className="text-end">{received.toFixed(3)}</td>
                            <td className="text-end">
                              <span className={remaining > 0 ? "text-warning" : "text-success"}>
                                {remaining.toFixed(3)}
                              </span>
                            </td>
                            <td className="text-end" style={{ width: "150px" }}>
                              <input
                                type="number"
                                className="form-control form-control-sm text-end"
                                value={lines[index]?.quantity_received || ""}
                                onChange={(e) => handleLineChange(index, Number(e.target.value))}
                                step="0.001"
                                min="0"
                                max={remaining}
                                placeholder="0.000"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

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
                disabled={mutation.isPending || !po}
              >
                {mutation.isPending ? "Creating GRN..." : "Create Goods Receipt"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}