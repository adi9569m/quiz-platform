import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client.js";
import AdminLayout from "../components/AdminLayout.jsx";

export default function AdminQuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get("/quizzes");
      setQuizzes(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load quizzes list.");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (quiz) => {
    setActionLoadingId(quiz.id);
    setError(null);
    setSuccessMsg(null);
    const targetStatus = quiz.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      const { data } = await apiClient.patch(`/quizzes/${quiz.id}/publish`, {
        status: targetStatus,
      });
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quiz.id ? { ...q, status: data.status } : q))
      );
      setSuccessMsg(`Quiz "${quiz.title}" is now ${data.status}.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update quiz status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmDelete = (quiz) => {
    setQuizToDelete(quiz);
  };

  const handleDelete = async () => {
    if (!quizToDelete) return;
    setActionLoadingId(quizToDelete.id);
    setError(null);
    setSuccessMsg(null);
    try {
      await apiClient.delete(`/quizzes/${quizToDelete.id}`);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizToDelete.id));
      setSuccessMsg(`Quiz "${quizToDelete.title}" was deleted successfully.`);
      setQuizToDelete(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete quiz.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <AdminLayout title="Quiz Management">
      <div className="table-header-actions mb-4" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>All Quizzes</h2>
          <p className="text-muted">Create, edit, delete, and publish/unpublish quizzes.</p>
        </div>
        <Link to="/admin/quizzes/new" className="btn btn-primary">
          ➕ Create Quiz
        </Link>
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
          {successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg(null)}>×</button>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          {error}
          <button type="button" className="btn-retry" onClick={fetchQuizzes}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">Loading quizzes...</div>
      ) : quizzes.length === 0 ? (
        <div className="empty-state card text-center p-4">
          <p>No quizzes found. Create your first quiz to get started!</p>
          <Link to="/admin/quizzes/new" className="btn btn-primary mt-2">
            Create Quiz
          </Link>
        </div>
      ) : (
        <div className="table-responsive card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Difficulty</th>
                <th>Duration</th>
                <th>Passing Score</th>
                <th>Max Attempts</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz) => (
                <tr key={quiz.id}>
                  <td>
                    <strong>{quiz.title}</strong>
                    {quiz.description && (
                      <div className="text-muted text-sm" style={{ fontSize: "0.85rem", color: "#666" }}>
                        {quiz.description.length > 50 ? quiz.description.substring(0, 50) + "..." : quiz.description}
                      </div>
                    )}
                  </td>
                  <td><span className="badge badge-info">{quiz.category}</span></td>
                  <td>
                    <span className={`badge ${quiz.difficulty === "EASY" ? "badge-success" : quiz.difficulty === "MEDIUM" ? "badge-warning" : "badge-danger"}`}>
                      {quiz.difficulty}
                    </span>
                  </td>
                  <td>{quiz.duration} min</td>
                  <td>{quiz.passing_score}%</td>
                  <td>{quiz.max_attempts}</td>
                  <td>
                    <span className={`status-badge ${quiz.status === "PUBLISHED" ? "status-active" : "status-inactive"}`}>
                      {quiz.status}
                    </span>
                  </td>
                  <td>{new Date(quiz.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="actions-cell" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <Link to={`/admin/quizzes/${quiz.id}/edit`} className="btn btn-sm btn-outline">
                        Edit
                      </Link>

                      <button
                        type="button"
                        className={`btn btn-sm ${quiz.status === "PUBLISHED" ? "btn-warning" : "btn-success"}`}
                        onClick={() => handleTogglePublish(quiz)}
                        disabled={actionLoadingId === quiz.id}
                      >
                        {quiz.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => confirmDelete(quiz)}
                        disabled={actionLoadingId === quiz.id}
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

      {quizToDelete && (
        <div className="modal-backdrop" style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
        }}>
          <div className="modal-content card" style={{ maxWidth: "450px", width: "100%", padding: "1.5rem", background: "#fff", borderRadius: "8px" }}>
            <h3>Confirm Deletion</h3>
            <p style={{ margin: "1rem 0" }}>
              Are you sure you want to delete the quiz <strong>"{quizToDelete.title}"</strong>? This action cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setQuizToDelete(null)}
                disabled={actionLoadingId === quizToDelete.id}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={actionLoadingId === quizToDelete.id}
              >
                {actionLoadingId === quizToDelete.id ? "Deleting..." : "Delete Quiz"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
