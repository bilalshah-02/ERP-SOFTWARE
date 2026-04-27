// src/pages/crm/ActivityCreate.tsx
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { createActivity } from "../../api/crm";
import { fetchLeads } from "../../api/crm";
import { fetchCustomers } from "../../api/customers";
import FormWrapper from "../../components/FormWrapper";

export default function ActivityCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Get leadId from location state if passed
  const preselectedLeadId = location.state?.leadId;

  const [formData, setFormData] = useState({
    lead_id: preselectedLeadId || "",
    party_key: "",
    activity_type: "CALL",
    subject: "",
    notes: "",
    due_at: "",
  });

  // Fetch leads for dropdown
  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => fetchLeads(),
  });

  // Fetch customers for dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => fetchCustomers(""),
  });

  const createMutation = useMutation({
    mutationFn: createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["lead-activities"] });
      alert("Activity added successfully!");
      navigate(
        preselectedLeadId
          ? `/crm/leads/${preselectedLeadId}`
          : "/crm/activities"
      );
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    },
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.lead_id && !formData.party_key) {
      alert("Please select either a Lead or a Customer");
      return;
    }

    if (!formData.subject) {
      alert("Subject is required");
      return;
    }

    createMutation.mutate({
      lead_id: formData.lead_id ? Number(formData.lead_id) : undefined,
      party_key: formData.party_key ? Number(formData.party_key) : undefined,
      activity_type: formData.activity_type,
      subject: formData.subject,
      notes: formData.notes || undefined,
      due_at: formData.due_at || undefined,
      // created_by removed until authentication is implemented
    });
  };

  return (
    <FormWrapper
      title="Add Activity"
      onSubmit={handleSubmit}
      onCancel={() =>
        navigate(
          preselectedLeadId
            ? `/crm/leads/${preselectedLeadId}`
            : "/crm/activities"
        )
      }
      isLoading={createMutation.isPending}
    >
      <div className="row g-3">
        {/* Activity Type */}
        <div className="col-md-6">
          <label className="form-label">
            Activity Type* <span className="text-danger">(Required)</span>
          </label>
          <select
            className="form-select"
            name="activity_type"
            value={formData.activity_type}
            onChange={handleChange}
            required
          >
            <option value="CALL">📞 Call</option>
            <option value="EMAIL">📧 Email</option>
            <option value="MEETING">🤝 Meeting</option>
            <option value="TASK">✅ Task</option>
            <option value="NOTE">📝 Note</option>
          </select>
        </div>

        {/* Due Date */}
        <div className="col-md-6">
          <label className="form-label">Due Date</label>
          <input
            type="datetime-local"
            className="form-control"
            name="due_at"
            value={formData.due_at}
            onChange={handleChange}
          />
        </div>

        {/* Lead */}
        <div className="col-md-6">
          <label className="form-label">Lead</label>
          <select
            className="form-select"
            name="lead_id"
            value={formData.lead_id}
            onChange={handleChange}
            disabled={!!preselectedLeadId || !!formData.party_key}
          >
            <option value="">Select lead (optional)</option>
            {leads.map((lead: any) => (
              <option key={lead.lead_id} value={lead.lead_id}>
                {lead.lead_code} - {lead.lead_name}
              </option>
            ))}
          </select>
          {preselectedLeadId && (
            <small className="text-muted">Pre-selected from lead detail page</small>
          )}
        </div>

        {/* Customer/Party */}
        <div className="col-md-6">
          <label className="form-label">Customer</label>
          <select
            className="form-select"
            name="party_key"
            value={formData.party_key}
            onChange={handleChange}
            disabled={!!formData.lead_id}
          >
            <option value="">Select customer (optional)</option>
            {customers.map((customer: any) => (
              <option key={customer.party_key} value={customer.party_key}>
                {customer.party_code} - {customer.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div className="col-12">
          <label className="form-label">
            Subject* <span className="text-danger">(Required)</span>
          </label>
          <input
            type="text"
            className="form-control"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            placeholder="Brief description of the activity"
          />
        </div>

        {/* Notes */}
        <div className="col-12">
          <label className="form-label">Notes</label>
          <textarea
            className="form-control"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            placeholder="Detailed notes about the activity..."
          />
        </div>

        {/* Help Text */}
        <div className="col-12">
          <div className="alert alert-info">
            <strong>💡 Tip:</strong> Select either a Lead OR a Customer, not
            both. Activities help track your interactions and follow-ups.
          </div>
        </div>
      </div>
    </FormWrapper>
  );
}