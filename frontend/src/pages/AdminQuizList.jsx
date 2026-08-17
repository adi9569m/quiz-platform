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
      <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800, color: "#000000", lineHeight: 1.2 }}>
            Quiz Management
          </h1>
          <p style={{ margin: "3px 0 0", fontSize: "0.84rem", color: "#334155" }}>
            Create, edit, delete, manage questions, and publish or unpublish quizzes.
          </p>
        </div>
        <Link to="/admin/quizzes/new" className="btn btn-primary" style={{ height: "38px", padding: "0 16px", fontWeight: 700, display: "inline-flex", alignItems: "center" }}>
          + Create Quiz
        </Link>
      </div>

      {successMsg && (
        <div className="alert alert-success mb-3" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{successMsg}</span>
          <button type="button" className="btn-close" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }} onClick={() => setSuccessMsg(null)}>×</button>
        </div>
      )}

      {error && (
        <div className="alert alert-error mb-3" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchQuizzes}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner" style={{ padding: "3rem 0" }}>Loading quizzes...</div>
      ) : quizzes.length === 0 ? (
        <div className="card text-center p-4" style={{ padding: "3rem 1.5rem", textAlign: "center", background: "#ffffff", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}>
          <p style={{ margin: "0 0 12px 0", color: "#334155", fontSize: "0.95rem" }}>No quizzes found. Create your first quiz to get started!</p>
          <Link to="/admin/quizzes/new" className="btn btn-primary">
            + Create Quiz
          </Link>
        </div>
      ) : (
        <div
          className="card"
          style={{
            padding: 0,
            background: "#ffffff",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-sm)",
            overflow: "hidden",
            width: "100%",
          }}
        >
          <div className="table-responsive" style={{ width: "100%", overflowX: "auto" }}>
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr>
                  <th style={{ minWidth: "150px", color: "#000000", padding: "10px 10px" }}>Title</th>
                  <th style={{ width: "100px", color: "#000000", padding: "10px 8px" }}>Category</th>
                  <th style={{ width: "75px", textAlign: "center", color: "#000000", padding: "10px 6px" }}>Difficulty</th>
                  <th style={{ width: "65px", textAlign: "center", color: "#000000", padding: "10px 6px" }}>Duration</th>
                  <th style={{ width: "60px", textAlign: "center", color: "#000000", padding: "10px 6px" }}>Pass %</th>
                  <th style={{ width: "65px", textAlign: "center", color: "#000000", padding: "10px 6px" }}>Attempts</th>
                  <th style={{ width: "85px", textAlign: "center", color: "#000000", padding: "10px 6px" }}>Status</th>
                  <th style={{ width: "95px", whiteSpace: "nowrap", color: "#000000", padding: "10px 8px" }}>Created</th>
                  <th style={{ width: "260px", minWidth: "260px", textAlign: "right", color: "#000000", padding: "10px 12px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((quiz) => (
                  <tr key={quiz.id}>
                    <td style={{ padding: "10px 10px" }}>
                      <div style={{ fontWeight: 700, color: "#000000", fontSize: "0.86rem" }}>
                        {quiz.title}
                      </div>
                      {quiz.description && (
                        <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "1px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {quiz.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <span className="badge badge-info" style={{ fontSize: "0.68rem", padding: "2px 6px", whiteSpace: "nowrap" }}>
                        {quiz.category || "General"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center", padding: "10px 6px" }}>
                      <span
                        className={`badge ${
                          quiz.difficulty === "EASY"
                            ? "badge-success"
                            : quiz.difficulty === "HARD"
                            ? "badge-danger"
                            : "badge-warning"
                        }`}
                        style={{ fontSize: "0.68rem", padding: "2px 6px" }}
                      >
                        {quiz.difficulty}
                      </span>
                    </td>
                    <td style={{ textAlign: "center", fontSize: "0.8rem", color: "#334155", whiteSpace: "nowrap", padding: "10px 6px" }}>
                      {quiz.duration}m
                    </td>
                    <td style={{ textAlign: "center", fontSize: "0.8rem", color: "#334155", fontWeight: 600, padding: "10px 6px" }}>
                      {quiz.passing_score}%
                    </td>
                    <td style={{ textAlign: "center", fontSize: "0.8rem", color: "#334155", padding: "10px 6px" }}>
                      {quiz.max_attempts}
                    </td>
                    <td style={{ textAlign: "center", padding: "10px 6px" }}>
                      <span
                        className={`status-badge ${
                          quiz.status === "PUBLISHED" ? "badge-active" : "badge-inactive"
                        }`}
                        style={{ fontSize: "0.66rem", padding: "2px 6px" }}
                      >
                        {quiz.status}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap", fontSize: "0.78rem", color: "#64748b", padding: "10px 8px" }}>
                      {formatDate(quiz.created_at)}
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap", padding: "10px 12px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                        <Link
                          to={`/admin/quizzes/${quiz.id}/questions`}
                          className="btn btn-secondary btn-sm"
                          style={{
                            padding: "0",
                            height: "28px",
                            width: "68px",
                            fontSize: "0.74rem",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--color-primary)",
                            borderColor: "var(--color-border)",
                            boxSizing: "border-box",
                          }}
                        >
                          Questions
                        </Link>

                        <Link
                          to={`/admin/quizzes/${quiz.id}/edit`}
                          className="btn btn-secondary btn-sm"
                          style={{
                            padding: "0",
                            height: "28px",
                            width: "44px",
                            fontSize: "0.74rem",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--color-text-main)",
                            borderColor: "var(--color-border)",
                            boxSizing: "border-box",
                          }}
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          className={`btn btn-sm ${
                            quiz.status === "PUBLISHED" ? "btn-secondary" : "btn-success"
                          }`}
                          style={{
                            padding: "0",
                            height: "28px",
                            width: "74px",
                            fontSize: "0.74rem",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxSizing: "border-box",
                          }}
                          onClick={() => handleTogglePublish(quiz)}
                          disabled={actionLoadingId === quiz.id}
                        >
                          {actionLoadingId === quiz.id
                            ? "..."
                            : quiz.status === "PUBLISHED"
                            ? "Unpublish"
                            : "Publish"}
                        </button>

                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          style={{
                            padding: "0",
                            height: "28px",
                            width: "54px",
                            fontSize: "0.74rem",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxSizing: "border-box",
                          }}
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
        </div>
      )}

      {quizToDelete && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content card"
            style={{
              maxWidth: "450px",
              width: "100%",
              padding: "24px",
              background: "#fff",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", color: "#000000", fontSize: "1.15rem" }}>Confirm Deletion</h3>
            <p style={{ margin: "0 0 20px 0", color: "#334155", fontSize: "0.9rem" }}>
              Are you sure you want to delete the quiz <strong>"{quizToDelete.title}"</strong>? This action cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ height: "38px", padding: "0 16px" }}
                onClick={() => setQuizToDelete(null)}
                disabled={actionLoadingId === quizToDelete.id}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ height: "38px", padding: "0 16px" }}
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
