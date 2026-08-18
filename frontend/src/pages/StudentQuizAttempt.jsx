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
  const [markedForReview, setMarkedForReview] = useState({});
  const [visited, setVisited] = useState({ 0: true });
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

    const parseUtcMs = (str) => {
      if (!str) return 0;
      let s = String(str).trim();
      if (!s.endsWith("Z") && !s.includes("+") && !s.includes("-", 11)) {
        s += "Z";
      }
      return new Date(s).getTime();
    };

    const updateTimer = () => {
      const expiresAt = parseUtcMs(expiresAtStr);
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
    }
  };

  const handleSelectOption = async (questionId, optionId) => {
    if (isSubmitted || isExpired || submitting) return;

    const previousOptionId = answers[questionId];
    const newOptionId = previousOptionId === optionId ? null : optionId;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: newOptionId,
    }));

    try {
      setSavingAnswer(true);
      await apiClient.post(`/attempts/${attemptId}/answers`, {
        question_id: questionId,
        selected_option_id: newOptionId,
      });
    } catch (err) {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: previousOptionId,
      }));
    } finally {
      setSavingAnswer(false);
    }
  };

  const handleClearResponse = async (questionId) => {
    if (isSubmitted || isExpired || submitting || !answers[questionId]) return;
    handleSelectOption(questionId, answers[questionId]);
  };

  const toggleMarkForReview = (index) => {
    setMarkedForReview((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleNextQuestion = () => {
    const nextIdx = Math.min(questions.length - 1, currentIndex + 1);
    setCurrentIndex(nextIdx);
    setVisited((prev) => ({ ...prev, [nextIdx]: true }));
  };

  const handlePrevQuestion = () => {
    const prevIdx = Math.max(0, currentIndex - 1);
    setCurrentIndex(prevIdx);
    setVisited((prev) => ({ ...prev, [prevIdx]: true }));
  };

  const jumpToQuestion = (index) => {
    setCurrentIndex(index);
    setVisited((prev) => ({ ...prev, [index]: true }));
  };

  const handleSubmitQuiz = async () => {
    if (isSubmitted || submitting) return;

    const confirmSubmit = window.confirm(
      "Are you sure you want to submit your test? Once submitted, answers cannot be modified."
    );
    if (!confirmSubmit) return;

    try {
      setSubmitting(true);
      setError("");
      if (timerRef.current) clearInterval(timerRef.current);
      const res = await apiClient.post(`/attempts/${attemptId}/submit`);
      setAttempt(res.data);
      setIsSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit quiz attempt.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (secs) => {
    if (secs === null || secs === undefined) return "--:--";
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="exam-layout flex-between" style={{ justifyContent: "center", alignItems: "center" }}>
        <div className="card text-center" style={{ padding: "3rem" }}>
          <h2>Loading Mock Test Environment...</h2>
          <p className="muted">Preparing examination engine and questions.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error" style={{ display: "block", marginTop: "2rem" }}>
          <h3>Examination Error</h3>
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

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const isFinished = isSubmitted || isExpired;

  let answeredCount = 0;
  let notAnsweredCount = 0;
  let markedCount = 0;
  let notVisitedCount = 0;

  questions.forEach((q, idx) => {
    const hasAns = answers[q.id] !== undefined && answers[q.id] !== null;
    const isMrk = markedForReview[idx];
    const isVst = visited[idx];

    if (hasAns) {
      answeredCount++;
    } else if (isMrk) {
      markedCount++;
    } else if (isVst) {
      notAnsweredCount++;
    } else {
      notVisitedCount++;
    }
  });

  return (
    <div className="exam-layout">
      <header className="exam-header-bar">
        <div className="exam-title-badge">
          <h2>{attempt?.quiz?.title || "Quiz Attempt"}</h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {!isFinished && (
            <div className={`timer-box ${remainingSeconds !== null && remainingSeconds < 300 ? "timer-warning" : ""}`}>
              <span>⏱ TIME LEFT:</span>
              <span>{formatTimer(remainingSeconds)}</span>
            </div>
          )}
          {isFinished && (
            <span className="badge badge-warning" style={{ fontSize: "1rem", padding: "6px 14px" }}>
              COMPLETED ({attempt?.status})
            </span>
          )}
        </div>
      </header>

      {isFinished && (
        <div className="container" style={{ maxWidth: "800px", marginTop: "2rem" }}>
          <div className="card text-center" style={{ padding: "2.5rem 2rem" }}>
            <h2 style={{ fontSize: "1.8rem", margin: 0, color: "var(--color-primary)" }}>
              {isExpired ? "Time Expired — Test Submitted" : "Examination Completed"}
            </h2>
            <p className="muted" style={{ marginTop: "0.5rem" }}>
              Your response has been recorded in the database.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "1rem",
                margin: "2rem 0",
              }}
            >
              <div className="stat-card">
                <span className="stat-label">Score</span>
                <span className="stat-value" style={{ color: "var(--color-primary)" }}>
                  {attempt.obtained_marks} / {attempt.total_marks}
                </span>
              </div>

              <div className="stat-card">
                <span className="stat-label">Percentage</span>
                <span className="stat-value">{attempt.percentage}%</span>
              </div>

              <div className="stat-card">
                <span className="stat-label">Status</span>
                <span
                  className="stat-value"
                  style={{
                    color:
                      attempt.status === "PASSED"
                        ? "var(--color-answered)"
                        : "var(--color-not-answered)",
                  }}
                >
                  {attempt.status}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <Link to="/student/quizzes" className="btn btn-secondary">
                Back to Quizzes
              </Link>
              <Link
                to={`/student/quizzes/${quizId}/result/${attemptId}`}
                className="btn btn-primary"
                id="view-result-btn"
              >
                View Detailed Scorecard & Solutions &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {!isFinished && currentQuestion && (
        <div className="exam-grid-container">
          <main className="question-panel">
            <div className="question-header">
              <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--color-primary)" }}>
                Question No. {currentIndex + 1} of {totalQuestions}
              </span>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span className="badge badge-info">Marks: +{currentQuestion.marks || 1}</span>
                {savingAnswer && <span className="muted" style={{ fontSize: "0.8rem" }}>Saving...</span>}
              </div>
            </div>

            <div className="question-content">
              <h3 style={{ fontSize: "1.15rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                {currentQuestion.question_text}
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {currentQuestion.options &&
                  currentQuestion.options.map((opt) => {
                    const isSelected = answers[currentQuestion.id] === opt.id;
                    return (
                      <div
                        key={opt.id}
                        className={`option-card-item ${isSelected ? "selected" : ""}`}
                        onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                      >
                        <div className="option-key-bubble">{opt.key || opt.option_key}</div>
                        <span style={{ fontSize: "1rem", fontWeight: isSelected ? 600 : 400 }}>
                          {opt.text || opt.option_text}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div
              style={{
                padding: "16px 24px",
                background: "#f8fafc",
                borderTop: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleClearResponse(currentQuestion.id)}
                  disabled={!answers[currentQuestion.id]}
                >
                  Clear Response
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={() => {
                    toggleMarkForReview(currentIndex);
                    handleNextQuestion();
                  }}
                >
                  {markedForReview[currentIndex] ? "Unmark Review" : "Mark for Review & Next"}
                </button>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handlePrevQuestion}
                  disabled={currentIndex === 0}
                >
                  &larr; Previous
                </button>

                {currentIndex < totalQuestions - 1 ? (
                  <button type="button" className="btn btn-primary" onClick={handleNextQuestion}>
                    Save & Next &rarr;
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleSubmitQuiz}
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Test"}
                  </button>
                )}
              </div>
            </div>
          </main>

          <aside className="palette-sidebar">
            <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem" }}>Question Palette</h3>

            <div className="palette-legend-grid">
              <div className="legend-item">
                <span className="legend-badge" style={{ background: "var(--color-answered)" }}>
                  {answeredCount}
                </span>
                <span>Answered</span>
              </div>
              <div className="legend-item">
                <span className="legend-badge" style={{ background: "var(--color-not-answered)" }}>
                  {notAnsweredCount}
                </span>
                <span>Not Answered</span>
              </div>
              <div className="legend-item">
                <span className="legend-badge" style={{ background: "var(--color-marked-review)" }}>
                  {markedCount}
                </span>
                <span>Marked Review</span>
              </div>
              <div className="legend-item">
                <span className="legend-badge" style={{ background: "#e2e8f0", color: "#475569" }}>
                  {notVisitedCount}
                </span>
                <span>Not Visited</span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              <div className="palette-btn-grid">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const hasAns = answers[q.id] !== undefined && answers[q.id] !== null;
                  const isMrk = markedForReview[idx];
                  const isVst = visited[idx];

                  let btnClass = "";
                  if (hasAns) {
                    btnClass = "btn-answered";
                  } else if (isMrk) {
                    btnClass = "btn-marked-review";
                  } else if (isVst) {
                    btnClass = "btn-not-answered";
                  }

                  if (isCurrent) {
                    btnClass += " btn-active";
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      className={`palette-num-btn ${btnClass}`}
                      onClick={() => jumpToQuestion(idx)}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--color-border)" }}>
              <button
                type="button"
                className="btn btn-success"
                style={{ width: "100%", padding: "12px" }}
                onClick={handleSubmitQuiz}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Test"}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
