// src/pages/purchase/VendorPaymentDetail.tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { fetchVendorPayment } from "../../api/purchase";

export default function VendorPaymentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: payment, isLoading } = useQuery({
    queryKey: ["vendor-payment", id],
    queryFn: () => fetchVendorPayment(Number(id)),
  });

  if (isLoading) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  if (!payment) return (
    <div className="alert alert-danger m-4">
      Payment not found. <button className="btn btn-link p-0" onClick={() => navigate("/purchase/payments")}>Back</button>
    </div>
  );

  return (
    <div className="row g-4">
      <div className="col-12">
        <div className="card-box d-flex justify-content-between align-items-center">
          <h2 className="fw-bold mb-0">Payment #{payment.payment_id}</h2>
          <button className="btn btn-outline-secondary" onClick={() => navigate("/purchase/payments")}>← Back</button>
        </div>
      </div>
      <div className="col-md-6">
        <div className="card-box">
          <h5 className="fw-bold mb-3">Payment Details</h5>
          <table className="table table-borderless mb-0">
            <tbody>
              <tr><td className="text-muted">Supplier</td><td className="fw-bold">{payment.supplier_name}</td></tr>
              <tr><td className="text-muted">Date</td><td>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : "—"}</td></tr>
              <tr><td className="text-muted">Amount</td><td className="fw-bold text-success fs-5">${Number(payment.amount).toFixed(2)}</td></tr>
              <tr><td className="text-muted">Method</td><td>{payment.payment_method || "—"}</td></tr>
              <tr><td className="text-muted">Reference</td><td>{payment.reference_no || "—"}</td></tr>
              <tr><td className="text-muted">Remarks</td><td>{payment.remarks || "—"}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}