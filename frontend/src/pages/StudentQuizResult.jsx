import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../api/client.js";
import StudentLayout from "../components/StudentLayout.jsx";

export default function StudentQuizResult() {
  const { quizId, attemptId } = useParams();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

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

  return (
    <StudentLayout
      title={result?.quiz ? `${result.quiz.title} — Examination Result` : "Examination Result"}
      subtitle={result?.quiz ? `Category: ${result.quiz.category || "General"} • Attempt #${result.attempt_id}` : ""}
      action={
        <div className="flex-gap">
          <Link to="/leaderboard" className="btn btn-secondary btn-sm">
            Leaderboard
          </Link>
          <Link to="/student/dashboard" className="btn btn-secondary btn-sm">
            My Dashboard
          </Link>
          <Link to="/student/quizzes" className="btn btn-primary btn-sm">
            Browse Quizzes
          </Link>
        </div>
      }
    >
      <div className="container" style={{ paddingTop: "0" }}>
        {loading ? (
          <div className="card text-center" style={{ padding: "3rem 1rem", color: "var(--color-text-muted)" }}>
            <p style={{ margin: 0, fontSize: "1.05rem" }}>Evaluating examination results & loading solutions...</p>
          </div>
        ) : error || !result ? (
          <div className="alert alert-error" style={{ display: "block" }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "1.1rem" }}>Scorecard Error</h3>
            <p style={{ margin: 0 }}>{error || "Result not available."}</p>
            <div style={{ marginTop: "1rem" }}>
              <Link to="/student/quizzes" className="btn btn-secondary btn-sm">
                Back to Quizzes
              </Link>
            </div>
          </div>
        ) : (
          (() => {
            const { quiz, summary, review } = result;
            const isPassed = summary.status === "PASSED";

            const filteredReview = (review || []).filter((q) => {
              if (activeFilter === "CORRECT") return q.is_correct;
              if (activeFilter === "INCORRECT") return !q.is_correct && q.selected_option !== null;
              if (activeFilter === "UNANSWERED") return q.selected_option === null;
              return true;
            });

            return (
              <>
                <div className="card mb-4" style={{ padding: "24px" }}>
                  <div className="flex-between" style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "20px" }}>
                    <div>
                      <div className="stat-label">Official Result Status</div>
                      <div style={{ marginTop: "6px" }}>
                        <span
                          className={`badge ${isPassed ? "badge-success" : "badge-danger"}`}
                          style={{ fontSize: "1.15rem", padding: "6px 18px" }}
                        >
                          {summary.status}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div className="stat-label">Percentage Score</div>
                      <div style={{ fontSize: "2.4rem", fontWeight: 800, color: isPassed ? "var(--color-success)" : "var(--color-danger)" }}>
                        {summary.percentage}%
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: "12px",
                      marginTop: "20px",
                    }}
                  >
                    <div className="stat-card" style={{ padding: "14px", textAlign: "center" }}>
                      <div className="stat-label">Marks Obtained</div>
                      <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-text-main)", marginTop: "2px" }}>
                        {summary.obtained_marks} / {summary.total_marks}
                      </div>
                    </div>

                    <div className="stat-card" style={{ padding: "14px", textAlign: "center", background: "var(--color-success-bg)", borderColor: "var(--color-success-border)" }}>
                      <div className="stat-label" style={{ color: "var(--color-success-text)" }}>Correct</div>
                      <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-success-text)", marginTop: "2px" }}>
                        {summary.correct_answers}
                      </div>
                    </div>

                    <div className="stat-card" style={{ padding: "14px", textAlign: "center", background: "var(--color-danger-bg)", borderColor: "var(--color-danger-border)" }}>
                      <div className="stat-label" style={{ color: "var(--color-danger-text)" }}>Incorrect</div>
                      <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-danger-text)", marginTop: "2px" }}>
                        {summary.incorrect_answers}
                      </div>
                    </div>

                    <div className="stat-card" style={{ padding: "14px", textAlign: "center", background: "var(--color-warning-bg)", borderColor: "var(--color-warning-border)" }}>
                      <div className="stat-label" style={{ color: "var(--color-warning-text)" }}>Unanswered</div>
                      <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-warning-text)", marginTop: "2px" }}>
                        {summary.unanswered}
                      </div>
                    </div>

                    <div className="stat-card" style={{ padding: "14px", textAlign: "center" }}>
                      <div className="stat-label">Time Taken</div>
                      <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-text-main)", marginTop: "2px" }}>
                        ⏱ {formatTime(summary.time_taken)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex-between mb-3" style={{ alignItems: "center" }}>
                    <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Question Review & Solutions</h2>

                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className={`btn btn-sm ${activeFilter === "ALL" ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => setActiveFilter("ALL")}
                      >
                        All ({review?.length || 0})
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${activeFilter === "CORRECT" ? "btn-success" : "btn-secondary"}`}
                        onClick={() => setActiveFilter("CORRECT")}
                      >
                        Correct ({summary.correct_answers})
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${activeFilter === "INCORRECT" ? "btn-danger" : "btn-secondary"}`}
                        onClick={() => setActiveFilter("INCORRECT")}
                      >
                        Incorrect ({summary.incorrect_answers})
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${activeFilter === "UNANSWERED" ? "btn-secondary" : "btn-secondary"}`}
                        style={activeFilter === "UNANSWERED" ? { background: "var(--color-warning-bg)", color: "var(--color-warning-text)", borderColor: "var(--color-warning-border)", fontWeight: 700 } : {}}
                        onClick={() => setActiveFilter("UNANSWERED")}
                      >
                        Unanswered ({summary.unanswered})
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {filteredReview.map((q) => {
                      const isUnanswered = !q.selected_option;
                      const isCorrect = q.is_correct;

                      return (
                        <div key={q.question_id} className="card" style={{ padding: "20px" }}>
                          <div className="flex-between mb-2">
                            <span style={{ fontWeight: 700, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                              Question {q.question_number} ({q.marks} Mark{q.marks > 1 ? "s" : ""})
                            </span>

                            {isCorrect && <span className="badge badge-success">CORRECT (+{q.marks})</span>}
                            {!isCorrect && !isUnanswered && <span className="badge badge-danger">INCORRECT (0)</span>}
                            {isUnanswered && <span className="badge badge-warning">UNANSWERED (0)</span>}
                          </div>

                          <h3 style={{ fontSize: "1.05rem", lineHeight: 1.5, marginBottom: "16px", color: "var(--color-text-main)" }}>
                            {q.question_text}
                          </h3>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                              gap: "12px",
                              marginBottom: "16px",
                            }}
                          >
                            <div
                              style={{
                                padding: "12px 14px",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--color-border)",
                                background: isCorrect ? "var(--color-success-bg)" : isUnanswered ? "var(--color-warning-bg)" : "var(--color-danger-bg)",
                              }}
                            >
                              <div className="stat-label" style={{ fontSize: "0.72rem" }}>Your Selected Option</div>
                              <div style={{ fontWeight: 600, marginTop: "2px", color: "var(--color-text-main)" }}>
                                {q.selected_option ? `${q.selected_option.key}: ${q.selected_option.text}` : "Not Answered"}
                              </div>
                            </div>

                            <div
                              style={{
                                padding: "12px 14px",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--color-success-border)",
                                background: "var(--color-success-bg)",
                              }}
                            >
                              <div className="stat-label" style={{ fontSize: "0.72rem", color: "var(--color-success-text)" }}>Correct Option</div>
                              <div style={{ fontWeight: 700, marginTop: "2px", color: "var(--color-success-text)" }}>
                                {q.correct_option ? `${q.correct_option.key}: ${q.correct_option.text}` : "N/A"}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              padding: "12px 16px",
                              background: "var(--color-bg)",
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
              </>
            );
          })()
        )}
      </div>
    </StudentLayout>
  );
}
