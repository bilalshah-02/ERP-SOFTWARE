import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBanks,
  createBank,
  updateBank,
  deleteBank,
  type Bank,
} from "../../api/banks";
import FormWrapper from "../../components/FormWrapper";

export default function Banks() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [formData, setFormData] = useState<Bank>({
    party_code: "",
    name: "",
    tax_id: "",        // Account Number
    phone: "",         // Branch
    email: "",         // Swift/IBAN
    address_line1: "", // Bank Address
    city: "",
    country: "",
  });

  const queryClient = useQueryClient();

  const { data: banks = [], isLoading } = useQuery({
    queryKey: ["banks", search],
    queryFn: () => fetchBanks(search),
  });

  const createMutation = useMutation({
    mutationFn: createBank,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      setShowForm(false);
      resetForm();
      alert("Bank created successfully!");
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Error creating bank");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Bank }) =>
      updateBank(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      setShowForm(false);
      resetForm();
      alert("Bank updated successfully!");
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Error updating bank");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBank,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      alert("Bank deleted successfully!");
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Error deleting bank");
    },
  });

  const resetForm = () => {
    setFormData({
      party_code: "",
      name: "",
      tax_id: "",
      phone: "",
      email: "",
      address_line1: "",
      city: "",
      country: "",
    });
    setEditingBank(null);
  };

  const handleEdit = (bank: Bank) => {
    setFormData(bank);
    setEditingBank(bank);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this bank?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingBank && editingBank.party_key) {
      updateMutation.mutate({
        id: editingBank.party_key,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (showForm) {
    return (
      <FormWrapper
        title={editingBank ? "Edit Bank" : "Add Bank"}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false);
          resetForm();
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Bank Code*</label>
            <input
              type="text"
              className="form-control"
              name="party_code"
              value={formData.party_code}
              onChange={handleChange}
              required
              placeholder="BANK-001"
            />
            <small className="text-muted">Unique identifier for this bank account</small>
          </div>

          <div className="col-md-6">
            <label className="form-label">Bank Name*</label>
            <input
              type="text"
              className="form-control"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Meezan Bank - Main Account"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Account Number*</label>
            <input
              type="text"
              className="form-control"
              name="tax_id"
              value={formData.tax_id || ""}
              onChange={handleChange}
              required
              placeholder="Enter account number"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Branch</label>
            <input
              type="text"
              className="form-control"
              name="phone"
              value={formData.phone || ""}
              onChange={handleChange}
              placeholder="Branch name or code"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Swift Code / IBAN</label>
            <input
              type="text"
              className="form-control"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
              placeholder="International codes"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Currency</label>
            <input
              type="text"
              className="form-control"
              name="country"
              value={formData.country || ""}
              onChange={handleChange}
              placeholder="PKR, USD, etc."
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Bank Address</label>
            <input
              type="text"
              className="form-control"
              name="address_line1"
              value={formData.address_line1 || ""}
              onChange={handleChange}
              placeholder="Bank branch address"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">City</label>
            <input
              type="text"
              className="form-control"
              name="city"
              value={formData.city || ""}
              onChange={handleChange}
              placeholder="Lahore, Karachi, etc."
            />
          </div>
        </div>
      </FormWrapper>
    );
  }

  return (
    <div className="row g-4">
      <div className="col-12">
        <div className="card-box d-flex align-items-center justify-content-between">
          <div>
            <h2 className="fw-bold mb-1">Bank Accounts</h2>
            <div className="text-muted">Manage your company bank accounts</div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            + Add Bank
          </button>
        </div>
      </div>

      <div className="col-12">
        <div className="card-box">
          <input
            type="text"
            className="form-control"
            placeholder="Search by bank name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Bank Name</th>
                  <th>Account Number</th>
                  <th>Branch</th>
                  <th>Swift/IBAN</th>
                  <th>Currency</th>
                  <th style={{ width: 150 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center">
                      Loading...
                    </td>
                  </tr>
                ) : banks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center">
                      No banks found. Click "+ Add Bank" to create one.
                    </td>
                  </tr>
                ) : (
                  banks.map((bank: Bank) => (
                    <tr key={bank.party_key}>
                      <td>
                        <span className="badge bg-primary">{bank.party_code}</span>
                      </td>
                      <td className="fw-semibold">{bank.name}</td>
                      <td>
                        <code>{bank.tax_id || "—"}</code>
                      </td>
                      <td>{bank.phone || "—"}</td>
                      <td>
                        <small>{bank.email || "—"}</small>
                      </td>
                      <td>
                        <span className="badge bg-secondary">
                          {bank.country || "PKR"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEdit(bank)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(bank.party_key!)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {banks.length > 0 && (
        <div className="col-12">
          <div className="card-box bg-light">
            <h5 className="mb-3">📊 Summary</h5>
            <div className="row">
              <div className="col-md-4">
                <div className="fw-semibold text-muted">Total Banks</div>
                <div className="fs-4 fw-bold">{banks.length}</div>
              </div>
              <div className="col-md-4">
                <div className="fw-semibold text-muted">Status</div>
                <div className="fs-4">
                  <span className="badge bg-success">All Active</span>
                </div>
              </div>
              <div className="col-md-4">
                <div className="fw-semibold text-muted">Last Updated</div>
                <div className="fs-6">{new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}