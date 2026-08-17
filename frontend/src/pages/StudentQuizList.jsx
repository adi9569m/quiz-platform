import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/client.js";
import StudentLayout from "../components/StudentLayout.jsx";

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
    const d = String(diff || "MEDIUM").toUpperCase();
    if (d === "EASY") return <span className="badge badge-success">EASY</span>;
    if (d === "MEDIUM") return <span className="badge badge-warning">MEDIUM</span>;
    if (d === "HARD") return <span className="badge badge-danger">HARD</span>;
    return <span className="badge badge-info">{d}</span>;
  };

  return (
    <StudentLayout
      title="Browse Available Quizzes"
      subtitle="Select a published quiz to view examination parameters and start your attempt."
      action={
        <div className="flex-gap">
          <Link to="/student/dashboard" className="btn btn-secondary btn-sm">
            My Dashboard
          </Link>
          <Link to="/leaderboard" className="btn btn-secondary btn-sm">
            Leaderboard
          </Link>
        </div>
      }
    >
      <div className="container" style={{ paddingTop: "0" }}>
        {loading ? (
          <div className="card text-center" style={{ padding: "3rem 1rem", color: "var(--color-text-muted)" }}>
            <p style={{ margin: 0, fontSize: "1.05rem" }}>Loading published quizzes...</p>
          </div>
        ) : error ? (
          <div className="alert alert-error" style={{ display: "block" }}>
            <div>{error}</div>
            <div style={{ marginTop: "0.8rem" }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={fetchQuizzes}>
                Retry
              </button>
            </div>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="card text-center" style={{ padding: "3.5rem 1.5rem" }}>
            <h3 style={{ margin: "0 0 6px 0" }}>No Published Quizzes Available</h3>
            <p className="muted" style={{ margin: "0 auto 1.5rem", maxWidth: "400px", fontSize: "0.92rem" }}>
              There are no quizzes currently active. Please check back shortly as instructors publish new tests.
            </p>
            <Link to="/student/dashboard" className="btn btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="card card-hover"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: "20px",
                }}
              >
                <div>
                  <div className="flex-between mb-2">
                    <span className="badge badge-info">{quiz.category || "General"}</span>
                    {getDifficultyBadge(quiz.difficulty)}
                  </div>

                  <h3 style={{ fontSize: "1.15rem", margin: "0 0 8px 0", color: "var(--color-text-main)" }}>
                    {quiz.title}
                  </h3>
                  <p className="muted" style={{ fontSize: "0.88rem", margin: "0 0 16px 0", lineHeight: 1.5 }}>
                    {quiz.description || "Test your knowledge and evaluate your performance."}
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "8px",
                      padding: "12px",
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      fontSize: "0.8rem",
                      textAlign: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <div>
                      <div className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>Duration</div>
                      <div style={{ fontWeight: 700, color: "var(--color-text-main)", marginTop: "2px" }}>{quiz.duration}m</div>
                    </div>
                    <div>
                      <div className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>Questions</div>
                      <div style={{ fontWeight: 700, color: "var(--color-text-main)", marginTop: "2px" }}>{quiz.questions_count || quiz.question_count || 0}</div>
                    </div>
                    <div>
                      <div className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>Passing</div>
                      <div style={{ fontWeight: 700, color: "var(--color-text-main)", marginTop: "2px" }}>{quiz.passing_score}%</div>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    className="btn btn-primary btn-full"
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
    </StudentLayout>
  );
}
