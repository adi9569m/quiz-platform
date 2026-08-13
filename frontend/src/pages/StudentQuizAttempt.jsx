import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import apiClient from "../api/client.js";

export default function StudentQuizAttempt() {
  const { quizId, attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    fetchAttemptDetails();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [attemptId]);

  const fetchAttemptDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get(`/attempts/${attemptId}`);
      const data = response.data;

      setAttempt(data);
      setQuestions(data.questions || []);
      setAnswers(data.answers || {});

      if (data.status !== "IN_PROGRESS") {
        setIsSubmitted(true);
        if (data.status === "EXPIRED") {
          setIsExpired(true);
        }
      } else {
        initTimer(data.expires_at);
      }
    } catch (err) {
      console.error("Error loading attempt:", err);
      if (err.response?.status === 403) {
        setError("Access denied: You do not have permission to view this quiz attempt.");
      } else if (err.response?.status === 404) {
        setError("Attempt not found.");
      } else {
        setError(err.response?.data?.message || "Failed to load quiz attempt.");
      }
    } finally {
      setLoading(false);
    }
  };

  const initTimer = (expiresAtStr) => {
    if (!expiresAtStr) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const updateTimer = () => {
      const expiresAt = new Date(expiresAtStr).getTime();
      const now = new Date().getTime();
      const diffInSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));

      setRemainingSeconds(diffInSeconds);

      if (diffInSeconds <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleTimeExpired();
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
  };

  const handleTimeExpired = async () => {
    setIsExpired(true);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const res = await apiClient.post(`/attempts/${attemptId}/timeout`);
      setAttempt(res.data);
      setIsSubmitted(true);
    } catch (err) {
      console.error("Error timing out attempt:", err);
    }
  };

  const handleSelectOption = async (questionId, optionId) => {
    if (isExpired || isSubmitted || attempt?.status !== "IN_PROGRESS") return;

    // Optimistic update of local answer state
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));

    try {
      setSavingAnswer(true);
      await apiClient.post(`/attempts/${attemptId}/answers`, {
        question_id: questionId,
        selected_option_id: optionId,
      });
    } catch (err) {
      console.error("Failed to save answer to backend:", err);
    } finally {
      setSavingAnswer(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (isExpired || isSubmitted || submitting || attempt?.status !== "IN_PROGRESS") return;

    const confirmSubmit = window.confirm("Are you sure you want to finish and submit your quiz attempt?");
    if (!confirmSubmit) return;

    try {
      setSubmitting(true);
      const res = await apiClient.post(`/attempts/${attemptId}/submit`);
      setAttempt(res.data);
      setIsSubmitted(true);
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (err) {
      console.error("Error submitting attempt:", err);
      setError(err.response?.data?.message || "Failed to submit quiz attempt.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds === undefined) return "--:--";

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num) => String(num).padStart(2, "0");

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  if (loading) {
    return (
      <div className="container">
        <h2>Quiz Attempt</h2>
        <p className="muted">Loading question interface...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error mb-3">{error}</div>
        <Link to="/student/quizzes" className="btn btn-secondary">
          Back to Quiz List
        </Link>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const isFinished = isSubmitted || isExpired || (attempt && attempt.status !== "IN_PROGRESS");

  return (
    <div className="container" style={{ maxWidth: "900px" }}>
      {/* Header bar with title and timer */}
      <div
        className="card mb-3"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#1a1e29",
          border: "1px solid #333",
          padding: "1rem 1.5rem",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: "1.3rem" }}>Student Quiz Attempt</h3>
          <span className="muted" style={{ fontSize: "0.9rem" }}>
            Quiz ID: {quizId} | Attempt #{attemptId}
          </span>
        </div>
        {!isFinished && (
          <div
            style={{
              textAlign: "right",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              backgroundColor: remainingSeconds !== null && remainingSeconds < 300 ? "#4a151b" : "#0d2b45",
              border: remainingSeconds !== null && remainingSeconds < 300 ? "1px solid #e63946" : "1px solid #1d3557",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "#aaa", textTransform: "uppercase", letterSpacing: "1px" }}>
              Time Remaining
            </div>
            <div
              id="quiz-timer"
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: remainingSeconds !== null && remainingSeconds < 300 ? "#ff4d4d" : "#4cc9f0",
                fontFamily: "monospace",
              }}
            >
              {formatTimer(remainingSeconds)}
            </div>
          </div>
        )}
      </div>

      {/* Submission Result Summary Component */}
      {isFinished && attempt && (
        <div className="card mb-3" style={{ border: "1px solid #333", backgroundColor: "#161b22" }}>
          <div className="flex-between mb-3" style={{ borderBottom: "1px solid #333", paddingBottom: "1rem" }}>
            <h3 style={{ margin: 0, color: "#4cc9f0" }}>Quiz Submission Summary</h3>
            <span
              className={`badge ${
                attempt.status === "PASSED"
                  ? "badge-success"
                  : attempt.status === "FAILED"
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
              {attempt.status}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ padding: "1rem", backgroundColor: "#1a1e29", borderRadius: "8px" }}>
              <div style={{ color: "#aaa", fontSize: "0.85rem" }}>Obtained Marks</div>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#fff" }}>
                {attempt.obtained_marks} / {attempt.total_marks}
              </div>
            </div>

            <div style={{ padding: "1rem", backgroundColor: "#1a1e29", borderRadius: "8px" }}>
              <div style={{ color: "#aaa", fontSize: "0.85rem" }}>Percentage</div>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#4cc9f0" }}>
                {attempt.percentage}%
              </div>
            </div>

            <div style={{ padding: "1rem", backgroundColor: "#1a1e29", borderRadius: "8px" }}>
              <div style={{ color: "#aaa", fontSize: "0.85rem" }}>Passing Score</div>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#aaa" }}>
                {attempt.passing_score}%
              </div>
            </div>

            <div style={{ padding: "1rem", backgroundColor: "#1a1e29", borderRadius: "8px" }}>
              <div style={{ color: "#aaa", fontSize: "0.85rem" }}>Time Taken</div>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#fff" }}>
                {formatTimer(attempt.time_taken)}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1rem",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}
          >
            <div style={{ padding: "0.75rem", backgroundColor: "rgba(46, 164, 79, 0.15)", borderRadius: "6px", border: "1px solid #2ea44f" }}>
              <div style={{ fontSize: "0.85rem", color: "#2ea44f" }}>Correct Answers</div>
              <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#fff" }}>{attempt.correct_answers}</div>
            </div>

            <div style={{ padding: "0.75rem", backgroundColor: "rgba(230, 57, 70, 0.15)", borderRadius: "6px", border: "1px solid #e63946" }}>
              <div style={{ fontSize: "0.85rem", color: "#e63946" }}>Incorrect Answers</div>
              <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#fff" }}>{attempt.incorrect_answers}</div>
            </div>

            <div style={{ padding: "0.75rem", backgroundColor: "rgba(255, 193, 7, 0.15)", borderRadius: "6px", border: "1px solid #ffc107" }}>
              <div style={{ fontSize: "0.85rem", color: "#ffc107" }}>Unanswered</div>
              <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#fff" }}>{attempt.unanswered}</div>
            </div>
          </div>

          <div className="flex-between">
            <Link to="/student/quizzes" className="btn btn-secondary">
              &larr; Back to Quiz List
            </Link>
          </div>
        </div>
      )}

      {/* Main Question Display */}
      {!isFinished && currentQuestion && (
        <div className="card mb-3">
          <div className="flex-between mb-2" style={{ borderBottom: "1px solid #333", pb: "0.75rem" }}>
            <span style={{ fontWeight: "bold", color: "#4cc9f0", fontSize: "1.1rem" }}>
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span className="badge badge-info">{currentQuestion.marks} Mark{currentQuestion.marks > 1 ? "s" : ""}</span>
          </div>

          <h3 style={{ marginTop: "1rem", marginBottom: "1.5rem", fontSize: "1.2rem", lineHeight: "1.5" }}>
            {currentQuestion.question_text}
          </h3>

          <div className="options-list" style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {currentQuestion.options &&
              currentQuestion.options.map((opt) => {
                const isSelected = answers[currentQuestion.id] === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                    style={{
                      padding: "0.85rem 1.2rem",
                      borderRadius: "8px",
                      border: isSelected ? "2px solid #4cc9f0" : "1px solid #333",
                      backgroundColor: isSelected ? "rgba(76, 201, 240, 0.12)" : "#161b22",
                      cursor: isFinished ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.8rem",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        border: isSelected ? "2px solid #4cc9f0" : "2px solid #555",
                        backgroundColor: isSelected ? "#4cc9f0" : "transparent",
                        color: isSelected ? "#000" : "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                        flexShrink: 0,
                      }}
                    >
                      {opt.key || opt.option_key}
                    </div>
                    <span style={{ fontSize: "1rem" }}>{opt.text || opt.option_text}</span>
                  </div>
                );
              })}
          </div>

          {/* Navigation Control Buttons */}
          <div className="flex-between mt-4" style={{ paddingTop: "1rem", borderTop: "1px solid #333" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
            >
              &larr; Previous
            </button>

            {currentIndex < totalQuestions - 1 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
              >
                Next &rarr;
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-success"
                onClick={handleSubmitQuiz}
                disabled={isFinished || submitting}
                style={{ backgroundColor: "#2ea44f", borderColor: "#2ea44f" }}
              >
                {submitting ? "Submitting..." : "Submit Quiz"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Question Navigator Grid */}
      {!isFinished && questions.length > 0 && (
        <div className="card">
          <h4 style={{ marginTop: 0, marginBottom: "1rem" }}>Question Navigator</h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))",
              gap: "0.5rem",
            }}
          >
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null;

              let bgColor = "#161b22";
              let borderColor = "#333";
              let textColor = "#aaa";

              if (isCurrent) {
                borderColor = "#4cc9f0";
                bgColor = "rgba(76, 201, 240, 0.25)";
                textColor = "#fff";
              } else if (isAnswered) {
                bgColor = "#1f402b";
                borderColor = "#2ea44f";
                textColor = "#fff";
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  style={{
                    height: "42px",
                    borderRadius: "6px",
                    border: isCurrent ? "2px solid #4cc9f0" : `1px solid ${borderColor}`,
                    backgroundColor: bgColor,
                    color: textColor,
                    fontWeight: isCurrent || isAnswered ? "bold" : "normal",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    transition: "all 0.15s ease",
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem", fontSize: "0.85rem", color: "#aaa" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "3px", border: "2px solid #4cc9f0", backgroundColor: "rgba(76, 201, 240, 0.25)" }}></span>
              Current
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#1f402b", border: "1px solid #2ea44f" }}></span>
              Answered
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#161b22", border: "1px solid #333" }}></span>
              Unanswered
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

