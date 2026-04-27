// src/pages/crm/LeadCreate.tsx
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createLead } from "../../api/crm";
import FormWrapper from "../../components/FormWrapper";

export default function LeadCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    company_key: 1, // Default company
    lead_name: "",
    contact_person: "",
    email: "",
    phone: "",
    source: "",
    estimated_value: "",
    currency_code: "PKR",
  });

  const createMutation = useMutation({
    mutationFn: createLead,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      alert(`Lead created successfully! (${data.lead_code})`);
      navigate("/crm/leads");
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.lead_name) {
      alert("Lead name is required");
      return;
    }

    createMutation.mutate({
      company_key: formData.company_key,
      lead_name: formData.lead_name,
      contact_person: formData.contact_person || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      source: formData.source || undefined,
      estimated_value: formData.estimated_value
        ? parseFloat(formData.estimated_value)
        : undefined,
      // created_by removed until authentication is implemented
    });
  };

  return (
    <FormWrapper
      title="Create Lead"
      onSubmit={handleSubmit}
      onCancel={() => navigate("/crm/leads")}
      isLoading={createMutation.isPending}
    >
      <div className="row g-3">
        {/* Lead Name */}
        <div className="col-md-6">
          <label className="form-label">
            Lead Name* <span className="text-danger">(Required)</span>
          </label>
          <input
            type="text"
            className="form-control"
            name="lead_name"
            value={formData.lead_name}
            onChange={handleChange}
            required
            placeholder="Company or organization name"
          />
        </div>

        {/* Contact Person */}
        <div className="col-md-6">
          <label className="form-label">Contact Person</label>
          <input
            type="text"
            className="form-control"
            name="contact_person"
            value={formData.contact_person}
            onChange={handleChange}
            placeholder="Name of primary contact"
          />
        </div>

        {/* Email */}
        <div className="col-md-4">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="contact@example.com"
          />
        </div>

        {/* Phone */}
        <div className="col-md-4">
          <label className="form-label">Phone</label>
          <input
            type="text"
            className="form-control"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+92-300-1234567"
          />
        </div>

        {/* Source */}
        <div className="col-md-4">
          <label className="form-label">Source</label>
          <select
            className="form-select"
            name="source"
            value={formData.source}
            onChange={handleChange}
          >
            <option value="">Select source</option>
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
            <option value="Cold Call">Cold Call</option>
            <option value="Social Media">Social Media</option>
            <option value="Email Campaign">Email Campaign</option>
            <option value="Trade Show">Trade Show</option>
            <option value="Partner">Partner</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Estimated Value */}
        <div className="col-md-6">
          <label className="form-label">Estimated Value</label>
          <div className="input-group">
            <select
              className="form-select"
              name="currency_code"
              value={formData.currency_code}
              onChange={handleChange}
              style={{ maxWidth: "100px" }}
            >
              <option value="PKR">PKR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
            <input
              type="number"
              className="form-control"
              name="estimated_value"
              value={formData.estimated_value}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
            />
          </div>
          <small className="text-muted">Potential deal value</small>
        </div>

        {/* Help Text */}
        <div className="col-12">
          <div className="alert alert-info">
            <strong>💡 Tip:</strong> A lead represents a potential customer. Once
            you've qualified the lead and they become a customer, you can convert
            them to a customer record.
          </div>
        </div>
      </div>
    </FormWrapper>
  );
}