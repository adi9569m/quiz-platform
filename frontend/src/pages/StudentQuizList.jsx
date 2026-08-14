import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client.js";

export default function StudentQuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setError("Access forbidden: You are logged in with an Admin account. Please log out and log in with a Student account to access student quizzes.");
      } else if (err.response?.status === 401) {
        setError("Unauthorized: Session expired or invalid. Please log in as a Student.");
      } else {
        setError(err.response?.data?.message || err.message || "Failed to load quizzes.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <h2>Available Quizzes</h2>
        <p className="muted">Loading published quizzes...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex-between mb-3">
        <div>
          <h2>Available Quizzes</h2>
          <p className="muted">Select a quiz to view details and start your attempt.</p>
        </div>
        <Link to="/" className="btn btn-secondary">
          Back to Home
        </Link>
      </div>

      {error ? (
        <div className="alert alert-error mb-3" style={{ display: "block" }}>
          <div>{error}</div>
          <div style={{ marginTop: "0.8rem" }}>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={fetchQuizzes}
              style={{ marginRight: "0.5rem" }}
            >
              Retry
            </button>
            <Link to="/login" className="btn btn-sm btn-primary">
              Log in as Student
            </Link>
          </div>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="card">
          <p className="muted">No published quizzes are currently available.</p>
        </div>
      ) : (
        <div className="quiz-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="card quiz-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ marginTop: 0 }}>{quiz.title}</h3>
                <p style={{ color: "#aaa", fontSize: "0.95rem" }}>{quiz.description || "No description provided."}</p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                  <span className="badge badge-info">{quiz.category}</span>
                  <span className="badge badge-warning">{quiz.difficulty}</span>
                </div>
                <ul className="user-info" style={{ paddingLeft: 0, listStyle: "none", fontSize: "0.9rem" }}>
                  <li><strong>Questions:</strong> {quiz.question_count || quiz.questions_count || 0}</li>
                  <li><strong>Duration:</strong> {quiz.duration} minutes</li>
                  <li><strong>Passing Score:</strong> {quiz.passing_score}%</li>
                  <li><strong>Max Attempts:</strong> {quiz.max_attempts}</li>
                </ul>
              </div>
              <div style={{ marginTop: "1rem" }}>
                <Link to={`/student/quizzes/${quiz.id}`} className="btn btn-primary" style={{ width: "100%", textAlign: "center", display: "block" }}>
                  View Quiz
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
