import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  type Vendor,
} from "../../api/vendors";
import FormWrapper from "../../components/FormWrapper";

export default function Vendors() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<Vendor>({
    party_code: "",
    name: "",
    tax_id: "",
    phone: "",
    email: "",
    address_line1: "",
    address_line2: "",
    city: "",
    country: "",
  });

  const queryClient = useQueryClient();

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["vendors", search],
    queryFn: () => fetchVendors(search),
  });

  const createMutation = useMutation({
    mutationFn: createVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setShowForm(false);
      resetForm();
      alert("Vendor created successfully!");
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Error creating vendor");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Vendor }) =>
      updateVendor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setShowForm(false);
      resetForm();
      alert("Vendor updated successfully!");
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Error updating vendor");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      alert("Vendor deleted successfully!");
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Error deleting vendor");
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
      address_line2: "",
      city: "",
      country: "",
    });
    setEditingVendor(null);
  };

  const handleEdit = (vendor: Vendor) => {
    setFormData(vendor);
    setEditingVendor(vendor);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingVendor && editingVendor.party_key) {
      updateMutation.mutate({
        id: editingVendor.party_key,
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
        title={editingVendor ? "Edit Vendor" : "Create Vendor"}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false);
          resetForm();
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Vendor Code*</label>
            <input
              type="text"
              className="form-control"
              name="party_code"
              value={formData.party_code}
              onChange={handleChange}
              required
              placeholder="VND-001"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Vendor Name*</label>
            <input
              type="text"
              className="form-control"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Tax ID</label>
            <input
              type="text"
              className="form-control"
              name="tax_id"
              value={formData.tax_id || ""}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Phone</label>
            <input
              type="text"
              className="form-control"
              name="phone"
              value={formData.phone || ""}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Address Line 1</label>
            <input
              type="text"
              className="form-control"
              name="address_line1"
              value={formData.address_line1 || ""}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Address Line 2</label>
            <input
              type="text"
              className="form-control"
              name="address_line2"
              value={formData.address_line2 || ""}
              onChange={handleChange}
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
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Country</label>
            <input
              type="text"
              className="form-control"
              name="country"
              value={formData.country || ""}
              onChange={handleChange}
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
            <h2 className="fw-bold mb-1">Vendors</h2>
            <div className="text-muted">Manage your suppliers</div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            + Create Vendor
          </button>
        </div>
      </div>

      <div className="col-12">
        <div className="card-box">
          <input
            type="text"
            className="form-control"
            placeholder="Search by name or code..."
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
                  <th>Name</th>
                  <th>Tax ID</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>City</th>
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
                ) : vendors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center">
                      No vendors found
                    </td>
                  </tr>
                ) : (
                  vendors.map((vendor: Vendor) => (
                    <tr key={vendor.party_key}>
                      <td>{vendor.party_code}</td>
                      <td className="fw-semibold">{vendor.name}</td>
                      <td>{vendor.tax_id || "—"}</td>
                      <td>{vendor.phone || "—"}</td>
                      <td>{vendor.email || "—"}</td>
                      <td>{vendor.city || "—"}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEdit(vendor)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(vendor.party_key!)}
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
    </div>
  );
}