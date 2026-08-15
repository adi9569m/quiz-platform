import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/client.js";

export default function StudentQuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/student/quizzes");
      setQuizzes(response.data || []);
    } catch (err) {
      console.error("Error loading quizzes:", err);
      if (err.response?.status === 403) {
        setError(
          "Access forbidden: You are logged in with an Admin account. Please log out and log in with a Student account to access student quizzes."
        );
      } else if (err.response?.status === 401) {
        setError("Unauthorized: Session expired or invalid. Please log in as a Student.");
      } else {
        setError(err.response?.data?.message || err.message || "Failed to load quizzes.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyBadge = (diff) => {
    const d = String(diff).toUpperCase();
    if (d === "EASY") return <span className="badge badge-success">EASY</span>;
    if (d === "MEDIUM") return <span className="badge badge-warning">MEDIUM</span>;
    if (d === "HARD") return <span className="badge badge-danger">HARD</span>;
    return <span className="badge badge-info">{d}</span>;
  };

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: "1000px" }}>
        <h2>Available Quizzes</h2>
        <p className="muted">Loading published quizzes...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: "1000px" }}>
      {/* Header Bar */}
      <div className="flex-between mb-4" style={{ alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem" }}>Available Quizzes</h1>
          <p className="muted" style={{ margin: "0.25rem 0 0" }}>
            Select a published quiz to view details and start your attempt.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link to="/student/dashboard" className="btn btn-primary">
            Student Dashboard
          </Link>
          <Link to="/" className="btn btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>

      {error ? (
        <div className="alert alert-error mb-3" style={{ display: "block" }}>
          <div>{error}</div>
          <div style={{ marginTop: "0.8rem" }}>
            <button type="button" className="btn btn-secondary" onClick={fetchQuizzes}>
              Retry
            </button>
          </div>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="card text-center" style={{ padding: "3rem 1rem", color: "var(--color-text-muted)" }}>
          <h3>No Published Quizzes Available</h3>
          <p>Please check back later when new quizzes are published by administrators.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div className="flex-between mb-2">
                  <span className="stat-label">{quiz.category || "General"}</span>
                  {getDifficultyBadge(quiz.difficulty)}
                </div>

                <h3 style={{ fontSize: "1.15rem", margin: "0 0 8px 0" }}>{quiz.title}</h3>
                <p className="muted" style={{ fontSize: "0.88rem", margin: "0 0 16px 0", lineHeight: 1.5 }}>
                  {quiz.description || "Test your knowledge and evaluate your performance."}
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px",
                    padding: "10px",
                    background: "#f8fafc",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.8rem",
                    textAlign: "center",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <div className="muted">Duration</div>
                    <strong>⏱ {quiz.duration}m</strong>
                  </div>
                  <div>
                    <div className="muted">Questions</div>
                    <strong>📝 {quiz.questions_count || quiz.question_count || 0}</strong>
                  </div>
                  <div>
                    <div className="muted">Passing</div>
                    <strong>🎯 {quiz.passing_score}%</strong>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  onClick={() => navigate(`/student/quizzes/${quiz.id}`)}
                >
                  View Details & Take Quiz &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
