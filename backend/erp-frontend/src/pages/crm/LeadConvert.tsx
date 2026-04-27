// src/pages/crm/LeadConvert.tsx
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { fetchLead, convertLead } from "../../api/crm";

export default function LeadConvert() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [createCustomer, setCreateCustomer] = useState(true);

  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead", id],
    queryFn: () => fetchLead(Number(id)),
    enabled: !!id,
  });

  const convertMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { create_customer?: boolean } }) =>
      convertLead(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      
      alert(
        `Lead converted successfully!${
          data.customer
            ? `\nCustomer created: ${data.customer.party_code} - ${data.customer.name}`
            : ""
        }`
      );
      navigate(`/crm/leads/${id}`);
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    },
  });

  const handleConvert = () => {
    if (
      window.confirm(
        `Convert lead "${lead?.lead_name}" to customer?${
          createCustomer
            ? "\n\nThis will create a new customer record."
            : "\n\nNo customer record will be created."
        }`
      )
    ) {
      convertMutation.mutate({ 
        id: Number(id), 
        data: { create_customer: createCustomer } 
      });
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

  if (!lead) {
    return (
      <div className="card-box text-center py-5">
        <h5>Lead not found</h5>
        <button className="btn btn-primary mt-3" onClick={() => navigate("/crm/leads")}>
          Back to Leads
        </button>
      </div>
    );
  }

  if (lead.customer_party_key) {
    return (
      <div className="card-box text-center py-5">
        <h5 className="text-success">✓ Lead Already Converted</h5>
        <p className="text-muted mt-3">
          This lead has already been converted to a customer:
          <br />
          <strong>{lead.customer_name || `Customer #${lead.customer_party_key}`}</strong>
        </p>
        <button
          className="btn btn-primary mt-3"
          onClick={() => navigate(`/crm/leads/${id}`)}
        >
          Back to Lead Details
        </button>
      </div>
    );
  }

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold mb-1">Convert Lead to Customer</h2>
              <div className="text-muted">Transform this lead into a customer account</div>
            </div>
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate(`/crm/leads/${id}`)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Lead Information */}
      <div className="col-md-6">
        <div className="card-box">
          <h5 className="fw-bold mb-3">Lead Information</h5>
          <table className="table table-sm">
            <tbody>
              <tr>
                <th style={{ width: "40%" }}>Lead Code</th>
                <td>{lead.lead_code}</td>
              </tr>
              <tr>
                <th>Lead Name</th>
                <td className="fw-semibold">{lead.lead_name}</td>
              </tr>
              <tr>
                <th>Contact Person</th>
                <td>{lead.contact_person || "—"}</td>
              </tr>
              <tr>
                <th>Email</th>
                <td>{lead.email || "—"}</td>
              </tr>
              <tr>
                <th>Phone</th>
                <td>{lead.phone || "—"}</td>
              </tr>
              <tr>
                <th>Source</th>
                <td>{lead.source || "—"}</td>
              </tr>
              <tr>
                <th>Status</th>
                <td>
                  <span className="badge bg-primary">{lead.status}</span>
                </td>
              </tr>
              <tr>
                <th>Estimated Value</th>
                <td>
                  {lead.estimated_value
                    ? `${lead.currency_code || ""} ${lead.estimated_value.toLocaleString()}`
                    : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Conversion Options */}
      <div className="col-md-6">
        <div className="card-box">
          <h5 className="fw-bold mb-3">Conversion Options</h5>

          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="createCustomerCheck"
              checked={createCustomer}
              onChange={(e) => setCreateCustomer(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="createCustomerCheck">
              <strong>Create Customer Record</strong>
              <div className="text-muted small">
                Automatically create a new customer in the system using the lead information
              </div>
            </label>
          </div>

          {createCustomer && (
            <div className="alert alert-info">
              <strong>Customer will be created with:</strong>
              <ul className="mb-0 mt-2">
                <li>Customer Code: CUST-{lead.lead_code}</li>
                <li>Name: {lead.lead_name}</li>
                <li>Phone: {lead.phone || "Not provided"}</li>
                <li>Email: {lead.email || "Not provided"}</li>
              </ul>
            </div>
          )}

          {!createCustomer && (
            <div className="alert alert-warning">
              <strong>⚠️ No customer record will be created.</strong>
              <div className="mt-2">
                The lead will be marked as converted, but you won't have a customer
                record to link transactions to. You can manually create a customer later
                if needed.
              </div>
            </div>
          )}

          <div className="d-grid gap-2 mt-4">
            <button
              className="btn btn-success btn-lg"
              onClick={handleConvert}
              disabled={convertMutation.isPending}
            >
              {convertMutation.isPending
                ? "Converting..."
                : "✓ Convert to Customer"}
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate(`/crm/leads/${id}`)}
              disabled={convertMutation.isPending}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Information Box */}
      <div className="col-12">
        <div className="card-box">
          <h5 className="fw-bold mb-3">What happens when you convert?</h5>
          <div className="row">
            <div className="col-md-4">
              <div className="d-flex align-items-start mb-3">
                <div className="text-primary me-3" style={{ fontSize: "24px" }}>
                  ✓
                </div>
                <div>
                  <strong>Lead Status Updated</strong>
                  <div className="text-muted small">
                    The lead will be linked to the customer record
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-start mb-3">
                <div className="text-primary me-3" style={{ fontSize: "24px" }}>
                  👤
                </div>
                <div>
                  <strong>Customer Created</strong>
                  <div className="text-muted small">
                    A new customer record with lead information (if enabled)
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-start mb-3">
                <div className="text-primary me-3" style={{ fontSize: "24px" }}>
                  📋
                </div>
                <div>
                  <strong>History Preserved</strong>
                  <div className="text-muted small">
                    All lead activities and data are retained
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}