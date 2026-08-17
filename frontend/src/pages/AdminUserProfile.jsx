import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import apiClient from "../api/client.js";
import AdminLayout from "../components/AdminLayout.jsx";

export default function AdminUserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(`/admin/users/${id}`);
      setStudent(data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load student profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!student) return;
    const newStatus = student.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setMessage(null);
    setError(null);
    try {
      const { data } = await apiClient.patch(`/admin/users/${student.id}/status`, {
        status: newStatus,
      });
      setStudent((prev) => ({ ...prev, status: data.user.status }));
      setMessage(`Status updated to ${data.user.status}.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status.");
    }
  };

  const handleDelete = async () => {
    if (!student) return;
    if (!window.confirm(`Are you sure you want to delete student "${student.name}"?`)) {
      return;
    }
    try {
      await apiClient.delete(`/admin/users/${student.id}`);
      navigate("/admin/users");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete student.");
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    try {
      return new Date(isoString).toLocaleString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <AdminLayout title="Student Profile">
      <div className="mb-4">
        <Link to="/admin/users" className="btn btn-secondary btn-auto">
          &larr; Back to Student List
        </Link>
      </div>

      {loading && <div className="loading-spinner">Loading profile...</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {!loading && student && (
        <div className="profile-grid">
          <div className="card profile-info-card">
            <h2>{student.name}</h2>
            <div className="profile-status-row">
              <span
                className={`status-badge ${
                  student.status === "ACTIVE" ? "badge-active" : "badge-inactive"
                }`}
              >
                {student.status}
              </span>
              <span className="role-badge">{student.role}</span>
            </div>

            <ul className="profile-details-list">
              <li>
                <strong>Student ID:</strong> <span>{student.id}</span>
              </li>
              <li>
                <strong>Email Address:</strong> <span>{student.email}</span>
              </li>
              <li>
                <strong>Registration Date:</strong>{" "}
                <span>{formatDate(student.created_at)}</span>
              </li>
            </ul>

            <div className="profile-actions">
              <button
                type="button"
                className={`btn ${
                  student.status === "ACTIVE" ? "btn-warning" : "btn-success"
                }`}
                onClick={handleToggleStatus}
              >
                {student.status === "ACTIVE" ? "Deactivate Account" : "Activate Account"}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
              >
                Delete Account
              </button>
            </div>
          </div>

          <div className="card profile-sections-card">
            <div className="profile-section">
              <h3>Quiz History</h3>
              <div className="unimplemented-box">
                <p>No quiz data available yet.</p>
                <span className="muted">Quiz history tracking will be available in future releases.</span>
              </div>
            </div>

            <hr className="divider" />

            <div className="profile-section">
              <h3>Performance Statistics</h3>
              <div className="unimplemented-box">
                <p>No quiz data available yet.</p>
                <span className="muted">Student performance analytics will be available in future releases.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
