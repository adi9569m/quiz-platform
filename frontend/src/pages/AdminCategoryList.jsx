import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout.jsx";
import apiClient from "../api/client.js";

export default function AdminCategoryList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null if creating, cat obj if editing
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete modal state
  const [deleteCat, setDeleteCat] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/categories");
      setCategories(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormName("");
    setFormDescription("");
    setFormError("");
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDescription(cat.description || "");
    setFormError("");
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim()) {
      setFormError("Category name is required.");
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        // Edit existing
        const res = await apiClient.put(`/categories/${editingCategory.id}`, {
          name: formName.trim(),
          description: formDescription.trim(),
        });
        setSuccess(res.data.message || "Category updated successfully.");
      } else {
        // Create new
        const res = await apiClient.post("/categories", {
          name: formName.trim(),
          description: formDescription.trim(),
        });
        setSuccess(res.data.message || "Category created successfully.");
      }
      setShowModal(false);
      fetchCategories();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCat) return;
    setDeleting(true);
    setError("");
    try {
      const res = await apiClient.delete(`/categories/${deleteCat.id}`);
      setSuccess(res.data.message || "Category deleted successfully.");
      setDeleteCat(null);
      fetchCategories();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete category.");
      setDeleteCat(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout title="Category Management">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ margin: 0 }}>All Categories</h2>
            <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
              Manage system quiz categories and descriptions
            </p>
          </div>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            + Create Category
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {loading ? (
          <p>Loading categories...</p>
        ) : categories.length === 0 ? (
          <p>No categories found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>#{cat.id}</td>
                    <td>
                      <strong>{cat.name}</strong>
                    </td>
                    <td>{cat.description || "—"}</td>
                    <td>{cat.created_at ? new Date(cat.created_at).toLocaleDateString() : "—"}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline"
                        style={{ marginRight: "0.5rem" }}
                        onClick={() => handleOpenEdit(cat)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => setDeleteCat(cat)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: "500px", width: "100%" }}>
            <h3>{editingCategory ? "Edit Category" : "Create New Category"}</h3>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Science & Technology"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Short description of this category..."
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCat && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: "450px", width: "100%" }}>
            <h3>Confirm Delete Category</h3>
            <p>
              Are you sure you want to delete the category <strong>"{deleteCat.name}"</strong>?
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
              Categories linked to active quizzes cannot be deleted until associated quizzes are removed or reassigned.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDeleteCat(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
