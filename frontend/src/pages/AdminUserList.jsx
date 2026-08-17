import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client.js";
import AdminLayout from "../components/AdminLayout.jsx";

export default function AdminUserList() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (searchQuery = search) => {
    setLoading(true);
    setError(null);
    try {
      const url = searchQuery ? `/admin/users?search=${encodeURIComponent(searchQuery)}` : "/admin/users";
      const { data } = await apiClient.get(url);
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load student list.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(search);
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setMessage(null);
    setError(null);
    try {
      const { data } = await apiClient.patch(`/admin/users/${user.id}/status`, {
        status: newStatus,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: data.user.status } : u))
      );
      setMessage(`Student "${user.name}" status changed to ${data.user.status}.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user status.");
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete student "${user.name}"?`)) {
      return;
    }
    setMessage(null);
    setError(null);
    try {
      await apiClient.delete(`/admin/users/${user.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setMessage(`Student "${user.name}" has been deleted.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete student.");
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    try {
      return new Date(isoString).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800, color: "var(--color-text-main)", lineHeight: 1.2 }}>
          Student Management
        </h1>
        <p className="muted" style={{ margin: "3px 0 0", fontSize: "0.84rem" }}>
          View, manage, and control registered student accounts.
        </p>
      </div>

      <div className="table-controls">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <input
            type="text"
            className="input-search"
            placeholder="Search students by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ height: "42px", padding: "0 18px", fontWeight: 600 }}>
            Search
          </button>
          {search && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ height: "42px", padding: "0 14px" }}
              onClick={() => {
                setSearch("");
                fetchUsers("");
              }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {message && <div className="alert alert-success mb-3">{message}</div>}
      {error && <div className="alert alert-error mb-3">{error}</div>}

      <div
        className="card"
        style={{
          padding: 0,
          background: "#ffffff",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div className="loading-spinner" style={{ padding: "3rem 0" }}>
            Loading student accounts...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--color-text-muted)" }}>
            <h3 style={{ margin: "0 0 4px 0", color: "var(--color-text-main)", fontSize: "1.05rem" }}>
              {search ? "No students match your search." : "No student accounts found."}
            </h3>
            <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
              {search
                ? "Try searching with a different name or email address."
                : "Registered students will appear in this management table."}
            </p>
            {search && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: "12px" }}
                onClick={() => {
                  setSearch("");
                  fetchUsers("");
                }}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ width: "65px", textAlign: "center" }}>ID</th>
                  <th style={{ minWidth: "160px" }}>Name</th>
                  <th style={{ minWidth: "220px" }}>Email</th>
                  <th style={{ width: "110px", textAlign: "center" }}>Role</th>
                  <th style={{ width: "110px", textAlign: "center" }}>Status</th>
                  <th style={{ width: "150px", whiteSpace: "nowrap" }}>Registered</th>
                  <th style={{ width: "250px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ textAlign: "center", fontWeight: 700, color: "var(--color-text-muted)" }}>
                      {u.id}
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--color-text-main)" }}>
                      {u.name}
                    </td>
                    <td style={{ color: "var(--color-text-muted)" }}>
                      {u.email}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="role-badge">
                        {u.role}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className={`status-badge ${
                          u.status === "ACTIVE" ? "badge-active" : "badge-inactive"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap", color: "var(--color-text-muted)", fontSize: "0.82rem" }}>
                      {formatDate(u.created_at)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="actions-cell">
                        <Link
                          to={`/admin/users/${u.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                        >
                          View Profile
                        </Link>
                        <button
                          type="button"
                          className={`btn btn-sm ${
                            u.status === "ACTIVE" ? "btn-warning" : "btn-success"
                          }`}
                          style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                          onClick={() => handleDeleteUser(u)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
