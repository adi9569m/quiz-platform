import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../api/client.js";

export default function StudentQuizResult() {
  const { quizId, attemptId } = useParams();

  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get(`/attempts/${attemptId}/result`);
      setResultData(response.data);
    } catch (err) {
      console.error("Error fetching result:", err);
      if (err.response?.status === 403) {
        setError("Access denied: You do not have permission to view this result.");
      } else if (err.response?.status === 404) {
        setError("Quiz attempt result not found.");
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Attempt is still in progress.");
      } else {
        setError(err.response?.data?.message || "Failed to load quiz result.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTimeTaken = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds === undefined) return "0:00";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const pad = (num) => String(num).padStart(2, "0");
    return `${minutes}:${pad(seconds)}`;
  };

  if (loading) {
    return (
      <div className="container">
        <h2>Quiz Result</h2>
        <p className="muted">Loading result and answer review...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <h2>Quiz Result</h2>
        <div className="alert alert-error mb-3" id="result-error">
          {error}
        </div>
        <Link to="/student/quizzes" className="btn btn-secondary">
          Back to Quizzes
        </Link>
      </div>
    );
  }

  if (!resultData) return null;

  const { quiz, summary, review } = resultData;

  return (
    <div className="container animate-fade-in" style={{ maxWidth: "900px" }}>
      {/* Page Title & Navigation */}
      <div className="flex-between mb-3">
        <div>
          <h2 style={{ margin: 0 }}>QUIZ RESULT</h2>
          <h4 style={{ margin: "0.25rem 0 0 0", color: "#4cc9f0" }}>{quiz?.title || "Quiz"}</h4>
          {quiz?.category && (
            <span className="muted" style={{ fontSize: "0.9rem" }}>
              Category: {quiz.category}
            </span>
          )}
        </div>
        <Link to="/student/quizzes" className="btn btn-secondary" id="back-to-quizzes-btn">
          Back to Quizzes
        </Link>
      </div>

      {/* Result Summary Card */}
      <div className="card mb-4" style={{ border: "1px solid #333", backgroundColor: "#161b22" }}>
        <div className="flex-between mb-3" style={{ borderBottom: "1px solid #333", paddingBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.3rem" }}>Result Summary</h3>
          <span
            id="result-status-badge"
            className={`badge ${
              summary.status === "PASSED"
                ? "badge-success"
                : summary.status === "FAILED"
                ? "badge-danger"
                : "badge-warning"
            }`}
            style={{
              fontSize: "1rem",
              padding: "0.4rem 1rem",
              textTransform: "uppercase",
              fontWeight: "bold",
            }}
          >
            {summary.status}
          </span>
        </div>

        {/* Metrics Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ padding: "1rem", backgroundColor: "#1a1e29", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ color: "#aaa", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Score</div>
            <div id="result-percentage" style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#4cc9f0" }}>
              {summary.percentage}%
            </div>
          </div>

          <div style={{ padding: "1rem", backgroundColor: "#1a1e29", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ color: "#aaa", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Obtained Marks</div>
            <div id="result-obtained-marks" style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#fff" }}>
              {summary.obtained_marks} / {summary.total_marks}
            </div>
          </div>

          <div style={{ padding: "1rem", backgroundColor: "#1a1e29", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ color: "#aaa", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Time Taken</div>
            <div id="result-time-taken" style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#fff" }}>
              {formatTimeTaken(summary.time_taken)}
            </div>
          </div>
        </div>

        {/* Breakdown Counts */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              padding: "0.85rem",
              backgroundColor: "rgba(46, 164, 79, 0.15)",
              borderRadius: "8px",
              border: "1px solid #2ea44f",
            }}
          >
            <div style={{ fontSize: "0.85rem", color: "#2ea44f", marginBottom: "0.2rem" }}>Correct</div>
            <div id="result-correct-count" style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#fff" }}>
              {summary.correct_answers}
            </div>
          </div>

          <div
            style={{
              padding: "0.85rem",
              backgroundColor: "rgba(230, 57, 70, 0.15)",
              borderRadius: "8px",
              border: "1px solid #e63946",
            }}
          >
            <div style={{ fontSize: "0.85rem", color: "#e63946", marginBottom: "0.2rem" }}>Incorrect</div>
            <div id="result-incorrect-count" style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#fff" }}>
              {summary.incorrect_answers}
            </div>
          </div>

          <div
            style={{
              padding: "0.85rem",
              backgroundColor: "rgba(255, 193, 7, 0.15)",
              borderRadius: "8px",
              border: "1px solid #ffc107",
            }}
          >
            <div style={{ fontSize: "0.85rem", color: "#ffc107", marginBottom: "0.2rem" }}>Unanswered</div>
            <div id="result-unanswered-count" style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#fff" }}>
              {summary.unanswered}
            </div>
          </div>
        </div>
      </div>

      {/* Question-by-Question Answer Review Section */}
      <h3 style={{ marginBottom: "1rem" }}>ANSWER REVIEW</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {review && review.length > 0 ? (
          review.map((qItem) => {
            const isUnanswered = qItem.selected_option === null;
            const isCorrect = qItem.is_correct;

            let statusLabel = "Incorrect";
            let badgeStyle = { backgroundColor: "rgba(230, 57, 70, 0.2)", color: "#ff4d4d", border: "1px solid #e63946" };

            if (isUnanswered) {
              statusLabel = "Unanswered";
              badgeStyle = { backgroundColor: "rgba(255, 193, 7, 0.2)", color: "#ffc107", border: "1px solid #ffc107" };
            } else if (isCorrect) {
              statusLabel = "Correct";
              badgeStyle = { backgroundColor: "rgba(46, 164, 79, 0.2)", color: "#2ea44f", border: "1px solid #2ea44f" };
            }

            return (
              <div
                key={qItem.question_id}
                className="card"
                style={{
                  border: "1px solid #333",
                  backgroundColor: "#161b22",
                  padding: "1.5rem",
                }}
                id={`review-question-${qItem.question_id}`}
              >
                {/* Header: Question Number & Status */}
                <div className="flex-between mb-2" style={{ borderBottom: "1px solid #222", paddingBottom: "0.75rem" }}>
                  <div>
                    <span style={{ fontWeight: "bold", color: "#4cc9f0", fontSize: "1.1rem" }}>
                      Question {qItem.question_number}
                    </span>
                    <span className="muted" style={{ marginLeft: "0.8rem", fontSize: "0.9rem" }}>
                      ({qItem.marks} Mark{qItem.marks > 1 ? "s" : ""})
                    </span>
                  </div>
                  <span
                    className="badge"
                    style={{
                      fontSize: "0.85rem",
                      padding: "0.3rem 0.8rem",
                      fontWeight: "bold",
                      ...badgeStyle,
                    }}
                  >
                    {statusLabel}
                  </span>
                </div>

                {/* Question Text */}
                <h4 style={{ marginTop: "0.5rem", marginBottom: "1.2rem", lineHeight: "1.5", fontSize: "1.1rem" }}>
                  {qItem.question_text}
                </h4>

                {/* Selected & Correct Answers Display */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "1rem",
                    marginBottom: "1.2rem",
                  }}
                >
                  {/* Your Answer */}
                  <div
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "6px",
                      backgroundColor: "#1a1e29",
                      border: isUnanswered
                        ? "1px solid #ffc107"
                        : isCorrect
                        ? "1px solid #2ea44f"
                        : "1px solid #e63946",
                    }}
                  >
                    <div style={{ fontSize: "0.8rem", color: "#aaa", textTransform: "uppercase", marginBottom: "0.3rem" }}>
                      Your Answer:
                    </div>
                    {isUnanswered ? (
                      <span style={{ color: "#ffc107", fontWeight: "bold", fontStyle: "italic" }}>
                        Unanswered
                      </span>
                    ) : (
                      <div style={{ color: "#fff", fontWeight: "500" }}>
                        <span style={{ color: "#4cc9f0", fontWeight: "bold", marginRight: "0.5rem" }}>
                          Option {qItem.selected_option.key}:
                        </span>
                        {qItem.selected_option.text}
                      </div>
                    )}
                  </div>

                  {/* Correct Answer */}
                  <div
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "6px",
                      backgroundColor: "#1a1e29",
                      border: "1px solid #2ea44f",
                    }}
                  >
                    <div style={{ fontSize: "0.8rem", color: "#aaa", textTransform: "uppercase", marginBottom: "0.3rem" }}>
                      Correct Answer:
                    </div>
                    {qItem.correct_option ? (
                      <div style={{ color: "#fff", fontWeight: "500" }}>
                        <span style={{ color: "#2ea44f", fontWeight: "bold", marginRight: "0.5rem" }}>
                          Option {qItem.correct_option.key}:
                        </span>
                        {qItem.correct_option.text}
                      </div>
                    ) : (
                      <span className="muted">N/A</span>
                    )}
                  </div>
                </div>

                {/* Explanation Card */}
                <div
                  style={{
                    padding: "0.85rem 1rem",
                    borderRadius: "6px",
                    backgroundColor: "#0d1117",
                    borderLeft: "4px solid #4cc9f0",
                  }}
                >
                  <div style={{ fontSize: "0.8rem", color: "#4cc9f0", fontWeight: "bold", textTransform: "uppercase", marginBottom: "0.3rem" }}>
                    Explanation:
                  </div>
                  <div style={{ color: "#ccc", fontSize: "0.95rem", lineHeight: "1.5" }}>
                    {qItem.explanation}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="card">No review items available.</div>
        )}
      </div>

      {/* Bottom Back Button */}
      <div className="mt-4 mb-4 text-center">
        <Link to="/student/quizzes" className="btn btn-secondary">
          &larr; Back to Quizzes
        </Link>
      </div>
    </div>
  );
}
