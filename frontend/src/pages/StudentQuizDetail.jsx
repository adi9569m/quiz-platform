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
  const [confirmedDeclaration, setConfirmedDeclaration] = useState(false);

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
      console.error("Error loading quiz detail:", err);
      if (err.response?.status === 404) {
        setError("Quiz not found or not published.");
      } else {
        setError(err.response?.data?.message || "Failed to load quiz details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartAttempt = async () => {
    try {
      setStarting(true);
      setError("");
      const response = await apiClient.post(`/quizzes/${quizId}/start`);
      const attemptId = response.data?.attempt_id || response.data?.id;
      if (attemptId) {
        navigate(`/student/quizzes/${quizId}/attempt/${attemptId}`);
      } else {
        setError("Failed to start attempt: missing attempt ID.");
      }
    } catch (err) {
      console.error("Error starting attempt:", err);
      setError(
        err.response?.data?.message ||
          "Unable to start quiz attempt. You may have reached the maximum attempt limit."
      );
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: "800px" }}>
        <h2>Loading Quiz Instructions...</h2>
        <p className="muted">Retrieving quiz parameters.</p>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="container" style={{ maxWidth: "800px" }}>
        <div className="alert alert-error" style={{ display: "block", marginTop: "2rem" }}>
          <h3>Error</h3>
          <p>{error}</p>
          <div style={{ marginTop: "1rem" }}>
            <Link to="/student/quizzes" className="btn btn-secondary">
              Back to Quiz List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: "850px" }}>
      {/* Header Bar */}
      <div className="flex-between mb-4" style={{ alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem" }}>{quiz?.title}</h1>
          <p className="muted" style={{ margin: "0.25rem 0 0" }}>
            Review the quiz parameters and instructions before starting.
          </p>
        </div>
        <Link to="/student/quizzes" className="btn btn-secondary">
          &larr; Back to Quiz List
        </Link>
      </div>

      {error && (
        <div className="alert alert-error mb-3" style={{ display: "block" }}>
          <div>{error}</div>
        </div>
      )}

      {/* Quiz Details Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div className="card" style={{ padding: "1.1rem" }}>
          <span className="stat-label">Category</span>
          <div style={{ fontSize: "1.15rem", fontWeight: 700, marginTop: "4px" }}>
            {quiz?.category || "General"}
          </div>
        </div>

        <div className="card" style={{ padding: "1.1rem" }}>
          <span className="stat-label">Duration</span>
          <div style={{ fontSize: "1.15rem", fontWeight: 700, marginTop: "4px", color: "var(--color-primary)" }}>
            ⏱ {quiz?.duration} Mins
          </div>
        </div>

        <div className="card" style={{ padding: "1.1rem" }}>
          <span className="stat-label">Questions</span>
          <div style={{ fontSize: "1.15rem", fontWeight: 700, marginTop: "4px" }}>
            📝 {quiz?.questions_count || quiz?.question_count || 0}
          </div>
        </div>

        <div className="card" style={{ padding: "1.1rem" }}>
          <span className="stat-label">Passing Score</span>
          <div style={{ fontSize: "1.15rem", fontWeight: 700, marginTop: "4px", color: "var(--color-success)" }}>
            🎯 {quiz?.passing_score}%
          </div>
        </div>

        <div className="card" style={{ padding: "1.1rem" }}>
          <span className="stat-label">Max Attempts</span>
          <div style={{ fontSize: "1.15rem", fontWeight: 700, marginTop: "4px" }}>
            🔄 {quiz?.max_attempts}
          </div>
        </div>
      </div>

      {/* Short & Crisp Instructions Card */}
      <div className="card mb-4">
        <h3 style={{ marginTop: 0, borderBottom: "1px solid var(--color-border)", paddingBottom: "10px", fontSize: "1.1rem" }}>
          Instructions
        </h3>

        <ul style={{ margin: "0.8rem 0", paddingLeft: "1.2rem", lineHeight: 1.8, fontSize: "0.95rem" }}>
          <li>The countdown timer displays the remaining time for the quiz.</li>
          <li>Select one option for each question.</li>
          <li>Use <strong>Save & Next</strong> to save your answer and move forward.</li>
          <li>Use the Question Navigator on the right to jump between questions.</li>
          <li>Click <strong>Submit Quiz</strong> when you are finished.</li>
        </ul>

        {/* Declaration Checkbox */}
        <div
          style={{
            marginTop: "1.2rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <input
            type="checkbox"
            id="declaration-check"
            checked={confirmedDeclaration}
            onChange={(e) => setConfirmedDeclaration(e.target.checked)}
            style={{ width: "18px", height: "18px", cursor: "pointer" }}
          />
          <label htmlFor="declaration-check" style={{ fontSize: "0.95rem", cursor: "pointer", fontWeight: 500 }}>
            I have read the instructions and am ready to start the quiz.
          </label>
        </div>

        {/* Start Button */}
        <div style={{ marginTop: "1.2rem", textAlign: "right" }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: "10px 28px", fontSize: "0.95rem" }}
            onClick={handleStartAttempt}
            disabled={!confirmedDeclaration || starting}
            id="start-quiz-btn"
          >
            {starting ? "Starting..." : "Start Quiz &rarr;"}
          </button>
        </div>
      </div>
    </div>
  );
}
