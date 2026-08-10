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
    if (!isoString) return "N/A";
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <AdminLayout title="Student Management">
      <div className="table-controls card">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <input
            type="text"
            className="input-search"
            placeholder="Search students by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-auto">
            Search
          </button>
          {search && (
            <button
              type="button"
              className="btn btn-secondary btn-auto"
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

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-container card">
        {loading ? (
          <div className="loading-spinner">Loading student accounts...</div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <p>No student accounts found.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Registered Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td className="font-semibold">{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className="role-badge">{u.role}</span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        u.status === "ACTIVE" ? "badge-active" : "badge-inactive"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td>{formatDate(u.created_at)}</td>
                  <td className="actions-cell">
                    <Link
                      to={`/admin/users/${u.id}`}
                      className="btn btn-sm btn-outline"
                    >
                      View Profile
                    </Link>
                    <button
                      type="button"
                      className={`btn btn-sm ${
                        u.status === "ACTIVE" ? "btn-warning" : "btn-success"
                      }`}
                      onClick={() => handleToggleStatus(u)}
                    >
                      {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteUser(u)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
