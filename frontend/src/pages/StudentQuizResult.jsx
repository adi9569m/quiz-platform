import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../api/client.js";

export default function StudentQuizResult() {
  const { quizId, attemptId } = useParams();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL"); // ALL, CORRECT, INCORRECT, UNANSWERED

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get(`/attempts/${attemptId}/result`);
      setResult(response.data);
    } catch (err) {
      console.error("Error fetching attempt result:", err);
      if (err.response?.status === 403) {
        setError("Access forbidden: You are not authorized to view this result.");
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Attempt is still in progress.");
      } else {
        setError(err.response?.data?.message || "Failed to load examination results.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs) => {
    if (secs === null || secs === undefined) return "--";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: "850px" }}>
        <h2>Loading Official Scorecard...</h2>
        <p className="muted">Evaluating examination answers and generating solutions.</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="container" style={{ maxWidth: "850px" }}>
        <div className="alert alert-error" style={{ display: "block", marginTop: "2rem" }}>
          <h3>Scorecard Error</h3>
          <p>{error || "Result not available."}</p>
          <div style={{ marginTop: "1rem" }}>
            <Link to="/student/quizzes" className="btn btn-secondary">
              Back to Quizzes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { quiz, summary, review } = result;
  const isPassed = summary.status === "PASSED";

  const filteredReview = (review || []).filter((q) => {
    if (activeFilter === "CORRECT") return q.is_correct;
    if (activeFilter === "INCORRECT") return !q.is_correct && q.selected_option !== null;
    if (activeFilter === "UNANSWERED") return q.selected_option === null;
    return true;
  });

  return (
    <div className="container" style={{ maxWidth: "900px" }}>
      {/* Header Bar */}
      <div className="flex-between mb-4" style={{ alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.8rem" }}>{quiz?.title} — Results</h1>
          <p className="muted" style={{ margin: "0.25rem 0 0" }}>
            Category: {quiz?.category || "General"} | Attempt #{result.attempt_id}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link to="/student/dashboard" className="btn btn-primary">
            Student Dashboard
          </Link>
          <Link to="/student/quizzes" className="btn btn-secondary">
            Back to Quizzes
          </Link>
        </div>
      </div>

      {/* Main Scorecard Summary Hero Card */}
      <div className="card mb-4" style={{ padding: "2rem" }}>
        <div className="flex-between" style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "1.5rem" }}>
          <div>
            <span className="stat-label">Result Status</span>
            <div style={{ marginTop: "4px" }}>
              <span
                className={`badge ${isPassed ? "badge-success" : "badge-danger"}`}
                style={{ fontSize: "1.2rem", padding: "6px 18px" }}
              >
                {summary.status}
              </span>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <span className="stat-label">Percentage Score</span>
            <div style={{ fontSize: "2.4rem", fontWeight: 800, color: isPassed ? "var(--color-answered)" : "var(--color-not-answered)" }}>
              {summary.percentage}%
            </div>
          </div>
        </div>

        {/* Performance Metrics Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "1rem",
            marginTop: "1.5rem",
          }}
        >
          <div className="card" style={{ padding: "1rem", textAlign: "center", background: "#f8fafc" }}>
            <span className="stat-label">Marks</span>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: "2px" }}>
              {summary.obtained_marks} / {summary.total_marks}
            </div>
          </div>

          <div className="card" style={{ padding: "1rem", textAlign: "center", background: "var(--color-success-bg)" }}>
            <span className="stat-label" style={{ color: "#047857" }}>Correct</span>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: "2px", color: "#047857" }}>
              {summary.correct_answers}
            </div>
          </div>

          <div className="card" style={{ padding: "1rem", textAlign: "center", background: "var(--color-danger-bg)" }}>
            <span className="stat-label" style={{ color: "#b91c1c" }}>Incorrect</span>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: "2px", color: "#b91c1c" }}>
              {summary.incorrect_answers}
            </div>
          </div>

          <div className="card" style={{ padding: "1rem", textAlign: "center", background: "var(--color-warning-bg)" }}>
            <span className="stat-label" style={{ color: "#b45309" }}>Unanswered</span>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: "2px", color: "#b45309" }}>
              {summary.unanswered}
            </div>
          </div>

          <div className="card" style={{ padding: "1rem", textAlign: "center", background: "#f8fafc" }}>
            <span className="stat-label">Time Taken</span>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: "2px" }}>
              ⏱ {formatTime(summary.time_taken)}
            </div>
          </div>
        </div>
      </div>

      {/* Solutions & Explanation Section */}
      <div className="mb-4">
        <div className="flex-between mb-3" style={{ alignItems: "center" }}>
          <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Question Review & Solution Key</h2>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              className={`btn btn-sm ${activeFilter === "ALL" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setActiveFilter("ALL")}
            >
              All ({review?.length || 0})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeFilter === "CORRECT" ? "btn-success" : "btn-outline"}`}
              onClick={() => setActiveFilter("CORRECT")}
            >
              Correct ({summary.correct_answers})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeFilter === "INCORRECT" ? "btn-danger" : "btn-outline"}`}
              onClick={() => setActiveFilter("INCORRECT")}
            >
              Incorrect ({summary.incorrect_answers})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeFilter === "UNANSWERED" ? "btn-warning" : "btn-outline"}`}
              onClick={() => setActiveFilter("UNANSWERED")}
            >
              Unanswered ({summary.unanswered})
            </button>
          </div>
        </div>

        {/* Question Cards List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredReview.map((q) => {
            const isUnanswered = !q.selected_option;
            const isCorrect = q.is_correct;

            return (
              <div key={q.question_id} className="card" style={{ padding: "1.5rem" }}>
                <div className="flex-between mb-2">
                  <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>
                    Q{q.question_number}. Question ({q.marks} Mark{q.marks > 1 ? "s" : ""})
                  </span>

                  {isCorrect && <span className="badge badge-success">✓ CORRECT (+{q.marks})</span>}
                  {!isCorrect && !isUnanswered && <span className="badge badge-danger">✗ INCORRECT (0)</span>}
                  {isUnanswered && <span className="badge badge-warning">-- UNANSWERED (0)</span>}
                </div>

                <h3 style={{ fontSize: "1.05rem", lineHeight: 1.5, marginBottom: "1.2rem" }}>
                  {q.question_text}
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "10px",
                    marginBottom: "1rem",
                  }}
                >
                  {/* Your Answer */}
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      background: isCorrect ? "var(--color-success-bg)" : isUnanswered ? "var(--color-warning-bg)" : "var(--color-danger-bg)",
                    }}
                  >
                    <span className="stat-label" style={{ fontSize: "0.75rem" }}>Your Answer</span>
                    <div style={{ fontWeight: 600, marginTop: "2px" }}>
                      {q.selected_option ? `${q.selected_option.key}: ${q.selected_option.text}` : "Not Answered"}
                    </div>
                  </div>

                  {/* Correct Answer */}
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-success-bg)",
                    }}
                  >
                    <span className="stat-label" style={{ fontSize: "0.75rem", color: "#047857" }}>Correct Option</span>
                    <div style={{ fontWeight: 600, marginTop: "2px", color: "#047857" }}>
                      {q.correct_option ? `${q.correct_option.key}: ${q.correct_option.text}` : "N/A"}
                    </div>
                  </div>
                </div>

                {/* Explanation Card */}
                <div
                  style={{
                    padding: "12px 16px",
                    background: "#f8fafc",
                    borderLeft: "4px solid var(--color-primary)",
                    borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                    fontSize: "0.9rem",
                  }}
                >
                  <strong style={{ color: "var(--color-primary)" }}>Solution Explanation:</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--color-text-main)" }}>
                    {q.explanation || "No detailed explanation provided for this question."}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
