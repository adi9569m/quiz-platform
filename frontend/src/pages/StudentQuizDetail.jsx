import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import apiClient from "../api/client.js";

export default function StudentQuizDetail() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchQuizDetail();
  }, [quizId]);

  const fetchQuizDetail = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get(`/student/quizzes/${quizId}`);
      setQuiz(response.data?.quiz || null);
    } catch (err) {
      console.error("Error loading quiz details:", err);
      setError(err.response?.data?.message || "Failed to load quiz details.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    try {
      setStarting(true);
      setError("");
      const response = await apiClient.post(`/quizzes/${quizId}/start`);
      const attemptData = response.data;
      const attemptId = attemptData.attempt_id || attemptData.id;
      if (attemptId) {
        navigate(`/student/quizzes/${quizId}/attempt/${attemptId}`);
      } else {
        setError("Could not retrieve attempt session.");
      }
    } catch (err) {
      console.error("Error starting quiz:", err);
      setError(err.response?.data?.message || "Failed to start quiz.");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <h2>Quiz Details</h2>
        <p className="muted">Loading quiz details...</p>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="container">
        <div className="alert alert-error mb-3">{error}</div>
        <Link to="/student/quizzes" className="btn btn-secondary">
          Back to Quiz List
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: "800px" }}>
      <div className="mb-3">
        <Link to="/student/quizzes" className="btn btn-secondary">
          &larr; Back to Quiz List
        </Link>
      </div>

      {error && <div className="alert alert-error mb-3">{error}</div>}

      {quiz && (
        <div className="card">
          <h2>{quiz.title}</h2>
          <p className="muted" style={{ fontSize: "1.05rem", lineHeight: "1.6" }}>
            {quiz.description || "No description provided."}
          </p>

          <hr style={{ borderColor: "#333", margin: "1.5rem 0" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <strong>Category:</strong>
              <p>{quiz.category}</p>
            </div>
            <div>
              <strong>Difficulty:</strong>
              <p><span className="badge badge-warning">{quiz.difficulty}</span></p>
            </div>
            <div>
              <strong>Number of Questions:</strong>
              <p>{quiz.question_count || quiz.questions_count || 0}</p>
            </div>
            <div>
              <strong>Duration:</strong>
              <p>{quiz.duration} minutes</p>
            </div>
            <div>
              <strong>Passing Score:</strong>
              <p>{quiz.passing_score}%</p>
            </div>
            <div>
              <strong>Maximum Attempts:</strong>
              <p>{quiz.max_attempts}</p>
            </div>
          </div>

          <div className="alert alert-info mb-3">
            <strong>Instructions:</strong> Once you click &quot;Start Quiz&quot;, your timer will begin immediately based on server time. You can navigate between questions and select answers.
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.85rem", fontSize: "1.1rem" }}
            onClick={handleStartQuiz}
            disabled={starting}
          >
            {starting ? "Starting Quiz..." : "Start Quiz"}
          </button>
        </div>
      )}
    </div>
  );
}
