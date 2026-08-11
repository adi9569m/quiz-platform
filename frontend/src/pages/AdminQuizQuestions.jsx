import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import apiClient from "../api/client.js";

export default function AdminQuizQuestions() {
  const { quiz_id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Delete modal state
  const [deleteQ, setDeleteQ] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchQuizAndQuestions();
  }, [quiz_id]);

  const fetchQuizAndQuestions = async () => {
    setLoading(true);
    setError("");
    try {
      const [quizRes, qRes] = await Promise.all([
        apiClient.get(`/quizzes/${quiz_id}`),
        apiClient.get(`/quizzes/${quiz_id}/questions`),
      ]);
      setQuiz(quizRes.data.quiz);
      setQuestions(qRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load quiz questions.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteQ) return;
    setDeleting(true);
    setError("");
    try {
      const res = await apiClient.delete(`/questions/${deleteQ.id}`);
      setSuccess(res.data.message || "Question deleted successfully.");
      setDeleteQ(null);
      fetchQuizAndQuestions();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete question.");
      setDeleteQ(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout title={quiz ? `Manage Questions — ${quiz.title}` : "Manage Questions"}>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <p>Loading questions...</p>
      ) : !quiz ? (
        <div className="alert alert-error">Quiz not found.</div>
      ) : (
        <>
          {/* Header Card */}
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ marginBottom: "0.5rem" }}>
                  <Link to="/admin/quizzes" style={{ color: "var(--color-primary)", textDecoration: "none" }}>
                    &larr; Back to Quizzes
                  </Link>
                </div>
                <h2 style={{ margin: "0 0 0.5rem 0" }}>{quiz.title}</h2>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
                  <span>🏷️ <strong>Category:</strong> {quiz.category}</span>
                  <span>⚡ <strong>Difficulty:</strong> {quiz.difficulty}</span>
                  <span>⏱️ <strong>Duration:</strong> {quiz.duration} mins</span>
                  <span>📊 <strong>Questions Count:</strong> {questions.length}</span>
                </div>
              </div>

              <Link to={`/admin/quizzes/${quiz_id}/questions/new`} className="btn btn-primary">
                + Add Question
              </Link>
            </div>
          </div>

          {/* Question List */}
          <div className="card">
            <h3>Question List ({questions.length})</h3>

            {questions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <p>No questions added to this quiz yet.</p>
                <Link to={`/admin/quizzes/${quiz_id}/questions/new`} className="btn btn-primary">
                  + Add First Question
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1rem" }}>
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    style={{
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      padding: "1.25rem",
                      backgroundColor: "var(--color-surface-elevated, #ffffff)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span className="badge badge-primary" style={{ fontSize: "0.85rem" }}>
                          Q{idx + 1}
                        </span>
                        <span className="badge badge-secondary" style={{ fontSize: "0.85rem" }}>
                          {q.question_type}
                        </span>
                        <span className="badge badge-info" style={{ fontSize: "0.85rem" }}>
                          {q.marks} {q.marks === 1 ? "Mark" : "Marks"}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Link to={`/admin/questions/${q.id}/edit`} className="btn btn-sm btn-outline">
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => setDeleteQ(q)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: "1.05rem", fontWeight: "600", marginBottom: "1rem", whiteSpace: "pre-line" }}>
                      {q.question_text}
                    </div>

                    {/* Options list */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.5rem" }}>
                      {q.options.map((opt) => (
                        <div
                          key={opt.id || opt.key}
                          style={{
                            padding: "0.6rem 0.8rem",
                            borderRadius: "6px",
                            border: opt.is_correct ? "2px solid #10b981" : "1px solid var(--color-border)",
                            backgroundColor: opt.is_correct ? "#ecfdf5" : "transparent",
                            color: opt.is_correct ? "#065f46" : "inherit",
                            fontWeight: opt.is_correct ? "600" : "normal",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              backgroundColor: opt.is_correct ? "#10b981" : "#e5e7eb",
                              color: opt.is_correct ? "#ffffff" : "#374151",
                              textAlign: "center",
                              lineHeight: "24px",
                              fontSize: "0.8rem",
                              fontWeight: "bold",
                            }}
                          >
                            {opt.key}
                          </span>
                          <span>{opt.text}</span>
                          {opt.is_correct && (
                            <span style={{ marginLeft: "auto", fontSize: "0.85rem" }}>✓ Correct</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete Question Modal */}
      {deleteQ && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: "450px", width: "100%" }}>
            <h3>Confirm Delete Question</h3>
            <p>Are you sure you want to delete this question?</p>
            <div style={{ fontStyle: "italic", background: "#f9fafb", padding: "0.75rem", borderRadius: "6px", margin: "1rem 0" }}>
              "{deleteQ.question_text}"
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDeleteQ(null)}
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
