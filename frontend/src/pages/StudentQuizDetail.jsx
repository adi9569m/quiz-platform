import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import apiClient from "../api/client.js";
import StudentLayout from "../components/StudentLayout.jsx";

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
      setError(
        err.response?.data?.message ||
          "Unable to start quiz attempt. You may have reached the maximum attempt limit."
      );
    } finally {
      setStarting(false);
    }
  };

  return (
    <StudentLayout
      title={quiz ? quiz.title : "Quiz Details"}
      subtitle="Review the examination instructions and parameters before starting your attempt."
      action={
        <Link to="/student/quizzes" className="btn btn-secondary btn-sm">
          &larr; Back to Quiz List
        </Link>
      }
    >
      <div className="container" style={{ paddingTop: "0" }}>
        {loading ? (
          <div className="card text-center" style={{ padding: "3rem 1rem", color: "var(--color-text-muted)" }}>
            <p style={{ margin: 0, fontSize: "1.05rem" }}>Loading quiz parameters...</p>
          </div>
        ) : error && !quiz ? (
          <div className="alert alert-error" style={{ display: "block" }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "1.1rem" }}>Error</h3>
            <p style={{ margin: 0 }}>{error}</p>
            <div style={{ marginTop: "1rem" }}>
              <Link to="/student/quizzes" className="btn btn-secondary btn-sm">
                Back to Quiz List
              </Link>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="alert alert-error mb-3" style={{ display: "block" }}>
                <div>{error}</div>
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div className="stat-card">
                <div className="stat-label">Category</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-main)", marginTop: "4px" }}>
                  {quiz?.category || "General"}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Duration</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-primary)", marginTop: "4px" }}>
                  {quiz?.duration} Mins
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Total Questions</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-main)", marginTop: "4px" }}>
                  {quiz?.questions_count || quiz?.question_count || 0}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Passing Score</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-success)", marginTop: "4px" }}>
                  {quiz?.passing_score}%
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Max Attempts</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-main)", marginTop: "4px" }}>
                  {quiz?.max_attempts}
                </div>
              </div>
            </div>

            <div className="card mb-4">
              <h3 style={{ marginTop: 0, borderBottom: "1px solid var(--color-border)", paddingBottom: "10px", fontSize: "1.1rem" }}>
                Examination Instructions
              </h3>

              <ul style={{ margin: "16px 0", paddingLeft: "1.25rem", lineHeight: 1.8, fontSize: "0.95rem", color: "var(--color-text-body)" }}>
                <li>The countdown timer starts immediately once you click <strong>Start Quiz</strong>.</li>
                <li>Each question has four options; only one option is correct.</li>
                <li>Your progress is saved automatically when you navigate or click <strong>Save & Next</strong>.</li>
                <li>You can mark questions for review and return to them using the question navigator palette.</li>
                <li>Once you submit, your score is calculated instantly and detailed answer solutions will be presented.</li>
              </ul>

              <div
                style={{
                  marginTop: "20px",
                  paddingTop: "16px",
                  borderTop: "1px solid var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <input
                  type="checkbox"
                  id="declaration-check"
                  checked={confirmedDeclaration}
                  onChange={(e) => setConfirmedDeclaration(e.target.checked)}
                  style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--color-primary)" }}
                />
                <label htmlFor="declaration-check" style={{ fontSize: "0.95rem", cursor: "pointer", fontWeight: 600, color: "var(--color-text-main)" }}>
                  I have read and understood all the instructions, and I am ready to begin.
                </label>
              </div>

              <div style={{ marginTop: "20px", textAlign: "right" }}>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={handleStartAttempt}
                  disabled={!confirmedDeclaration || starting}
                  id="start-quiz-btn"
                >
                  {starting ? "Initializing Quiz..." : "Start Quiz Attempt"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
