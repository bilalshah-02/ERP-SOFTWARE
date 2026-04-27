import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type Customer,
} from "../../api/customers";
import FormWrapper from "../../components/FormWrapper";

export default function Customers() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Customer>({
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

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", search],
    queryFn: () => fetchCustomers(search),
  });

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setShowForm(false);
      resetForm();
      alert("Customer created successfully!");
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Error creating customer");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Customer }) =>
      updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setShowForm(false);
      resetForm();
      alert("Customer updated successfully!");
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Error updating customer");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      alert("Customer deleted successfully!");
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Error deleting customer");
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
    setEditingCustomer(null);
  };

  const handleEdit = (customer: Customer) => {
    setFormData(customer);
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCustomer && editingCustomer.party_key) {
      updateMutation.mutate({
        id: editingCustomer.party_key,
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
        title={editingCustomer ? "Edit Customer" : "Create Customer"}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false);
          resetForm();
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Customer Code*</label>
            <input
              type="text"
              className="form-control"
              name="party_code"
              value={formData.party_code}
              onChange={handleChange}
              required
              placeholder="CUST-001"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Customer Name*</label>
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
            <h2 className="fw-bold mb-1">Customers</h2>
            <div className="text-muted">Manage your customers</div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            + Create Customer
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
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center">
                      No customers found
                    </td>
                  </tr>
                ) : (
                  customers.map((customer: Customer) => (
                    <tr key={customer.party_key}>
                      <td>{customer.party_code}</td>
                      <td className="fw-semibold">{customer.name}</td>
                      <td>{customer.tax_id || "—"}</td>
                      <td>{customer.phone || "—"}</td>
                      <td>{customer.email || "—"}</td>
                      <td>{customer.city || "—"}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEdit(customer)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(customer.party_key!)}
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