import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import StudentLayout from "../components/StudentLayout.jsx";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState({ leaderboard: [], user_rank: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      const [dashRes, quizRes, leadRes] = await Promise.all([
        apiClient.get("/student/dashboard"),
        apiClient.get("/student/quizzes").catch(() => ({ data: [] })),
        apiClient.get("/leaderboard").catch(() => ({ data: { leaderboard: [], user_rank: null } })),
      ]);
      setDashboardData(dashRes.data);
      setQuizzes(quizRes.data || []);
      setLeaderboardData(leadRes.data || { leaderboard: [], user_rank: null });
    } catch (err) {
      console.error("Error loading student dashboard:", err);
      if (err.response?.status === 403) {
        setError("Access forbidden: Only student accounts can view the student dashboard.");
      } else if (err.response?.status === 401) {
        setError("Unauthorized: Please log in as a student.");
      } else {
        setError(err.response?.data?.message || "Unable to load dashboard. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyBadge = (diff) => {
    const d = String(diff || "MEDIUM").toUpperCase();
    if (d === "EASY") return <span className="badge badge-success" style={{ fontSize: "0.68rem", padding: "1px 6px" }}>EASY</span>;
    if (d === "MEDIUM") return <span className="badge badge-warning" style={{ fontSize: "0.68rem", padding: "1px 6px" }}>MEDIUM</span>;
    if (d === "HARD") return <span className="badge badge-danger" style={{ fontSize: "0.68rem", padding: "1px 6px" }}>HARD</span>;
    return <span className="badge badge-info" style={{ fontSize: "0.68rem", padding: "1px 6px" }}>{d}</span>;
  };

  const getStatusBadge = (status) => {
    if (status === "PASSED") {
      return <span className="badge badge-success" style={{ fontSize: "0.68rem", padding: "1px 6px" }}>PASSED</span>;
    }
    if (status === "FAILED") {
      return <span className="badge badge-danger" style={{ fontSize: "0.68rem", padding: "1px 6px" }}>FAILED</span>;
    }
    if (status === "EXPIRED") {
      return <span className="badge badge-warning" style={{ fontSize: "0.68rem", padding: "1px 6px" }}>EXPIRED</span>;
    }
    return <span className="badge badge-neutral" style={{ fontSize: "0.68rem", padding: "1px 6px" }}>{status}</span>;
  };

  const getRankBadge = (rank) => {
    return <span style={{ fontWeight: 800, color: "var(--color-text-main)", fontSize: "0.82rem" }}>#{rank}</span>;
  };

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  const { statistics, recent_attempts } = dashboardData || {};
  const topLeaderboard = (leaderboardData.leaderboard || []).slice(0, 5);

  return (
    <StudentLayout>
      <div className="container" style={{ paddingTop: "12px", paddingBottom: "32px" }}>
        {loading ? (
          <div className="card text-center" style={{ padding: "3rem 1rem", color: "var(--color-text-muted)" }}>
            <p style={{ margin: 0, fontSize: "1rem" }}>Loading your dashboard & available quizzes...</p>
          </div>
        ) : error ? (
          <div className="alert alert-error" style={{ display: "block" }}>
            <div>{error}</div>
            <div style={{ marginTop: "0.8rem" }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={fetchDashboardData}>
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="dashboard-layout-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div
                className="card"
                style={{
                  padding: "16px 20px",
                  background: "#ffffff",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div className="flex-between" style={{ alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--color-primary), #1d4ed8)",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.05rem",
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "1.08rem", fontWeight: 800, color: "var(--color-text-main)", lineHeight: 1.2 }}>
                          {user?.name}
                        </span>
                        <span className="badge badge-success" style={{ fontSize: "0.68rem", padding: "1px 7px" }}>
                          {user?.status || "ACTIVE"}
                        </span>
                      </div>
                      <div style={{ color: "var(--color-text-muted)", fontSize: "0.82rem", marginTop: "1px" }}>
                        {user?.email}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Link to="/leaderboard" className="btn btn-secondary btn-sm" style={{ padding: "5px 12px", fontSize: "0.8rem" }}>
                      Leaderboard
                    </Link>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(95px, 1fr))",
                    gap: "8px",
                    marginTop: "14px",
                    paddingTop: "14px",
                    borderTop: "1px solid var(--color-border)",
                  }}
                >
                  <div
                    style={{
                      padding: "8px 6px",
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>
                      Attempted
                    </div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-primary)", marginTop: "1px" }}>
                      {statistics?.total_attempted ?? 0}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "8px 6px",
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>
                      Avg Score
                    </div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", marginTop: "1px" }}>
                      {statistics?.average_score ?? 0}%
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "8px 6px",
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>
                      Highest
                    </div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-success)", marginTop: "1px" }}>
                      {statistics?.highest_score ?? 0}%
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "8px 6px",
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>
                      Passed
                    </div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-success)", marginTop: "1px" }}>
                      {statistics?.total_passed ?? 0}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "8px 6px",
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>
                      Questions
                    </div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", marginTop: "1px" }}>
                      {statistics?.total_questions_answered ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex-between mb-3" style={{ alignItems: "flex-end" }}>
                  <div>
                    <h2 style={{ fontSize: "1.25rem", margin: 0, fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", color: "var(--color-text-main)" }}>
                      Available Quizzes to Attempt
                    </h2>
                    <p className="muted" style={{ margin: "2px 0 0", fontSize: "0.82rem" }}>
                      Choose a quiz below to start practicing, evaluate your knowledge, and track your performance.
                    </p>
                  </div>
                  <Link to="/student/quizzes" className="btn btn-link btn-sm" style={{ fontSize: "0.82rem", padding: 0, whiteSpace: "nowrap" }}>
                    View Full Catalog &rarr;
                  </Link>
                </div>

                {quizzes.length === 0 ? (
                  <div className="card text-center" style={{ padding: "3rem 1.5rem" }}>
                    <h3 style={{ margin: "0 0 4px 0" }}>No Published Quizzes Available</h3>
                    <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
                      There are no quizzes currently active. Please check back shortly.
                    </p>
                  </div>
                ) : (
                  <div className="dashboard-quiz-grid">
                    {quizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="card card-hover"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          padding: "16px",
                          height: "100%",
                          background: "#ffffff",
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--radius-lg)",
                          boxShadow: "var(--shadow-sm)",
                        }}
                      >
                        <div>
                          <div className="flex-between mb-2">
                            <span className="badge badge-info" style={{ fontSize: "0.7rem", padding: "1px 6px" }}>
                              {quiz.category || "General"}
                            </span>
                            {getDifficultyBadge(quiz.difficulty)}
                          </div>

                          <h3 style={{ fontSize: "0.98rem", margin: "0 0 4px 0", color: "var(--color-text-main)", fontWeight: 700, lineHeight: 1.3 }}>
                            {quiz.title}
                          </h3>

                          <p
                            className="muted"
                            style={{
                              fontSize: "0.8rem",
                              margin: "0 0 12px 0",
                              lineHeight: 1.4,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              minHeight: "2.8em",
                            }}
                          >
                            {quiz.description || "Test your knowledge and evaluate your performance."}
                          </p>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(3, 1fr)",
                              gap: "4px",
                              padding: "6px 2px",
                              background: "var(--color-bg)",
                              border: "1px solid var(--color-border)",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.7rem",
                              textAlign: "center",
                              marginBottom: "14px",
                            }}
                          >
                            <div>
                              <div className="muted" style={{ fontSize: "0.62rem", textTransform: "uppercase" }}>Duration</div>
                              <div style={{ fontWeight: 700, marginTop: "1px" }}>{quiz.duration}m</div>
                            </div>
                            <div>
                              <div className="muted" style={{ fontSize: "0.62rem", textTransform: "uppercase" }}>Questions</div>
                              <div style={{ fontWeight: 700, marginTop: "1px" }}>{quiz.questions_count || quiz.question_count || 0}</div>
                            </div>
                            <div>
                              <div className="muted" style={{ fontSize: "0.62rem", textTransform: "uppercase" }}>Passing</div>
                              <div style={{ fontWeight: 700, marginTop: "1px" }}>{quiz.passing_score}%</div>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-primary btn-full btn-sm"
                          style={{ marginTop: "auto", height: "36px", fontSize: "0.85rem", fontWeight: 700 }}
                          onClick={() => navigate(`/student/quizzes/${quiz.id}`)}
                        >
                          Start Quiz &rarr;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div
                className="card"
                style={{
                  padding: "16px 18px",
                  background: "#ffffff",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div className="flex-between mb-3" style={{ alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
                    Recent Examination Attempts
                  </h3>
                  <Link to="/student/quizzes" className="btn btn-link btn-sm" style={{ fontSize: "0.78rem", padding: 0, whiteSpace: "nowrap" }}>
                    View All &rarr;
                  </Link>
                </div>

                {!recent_attempts || recent_attempts.length === 0 ? (
                  <div style={{ padding: "16px 8px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                    No quiz attempts recorded yet.
                  </div>
                ) : (
                  <div className="table-responsive" style={{ overflowX: "auto" }}>
                    <table className="table" style={{ fontSize: "0.8rem", width: "100%" }}>
                      <thead>
                        <tr>
                          <th style={{ fontSize: "0.66rem", textTransform: "uppercase", padding: "6px 4px" }}>QUIZ TITLE</th>
                          <th style={{ fontSize: "0.66rem", textTransform: "uppercase", padding: "6px 4px", textAlign: "center", whiteSpace: "nowrap" }}>SCORE</th>
                          <th style={{ fontSize: "0.66rem", textTransform: "uppercase", padding: "6px 4px", textAlign: "center", whiteSpace: "nowrap" }}>STATUS</th>
                          <th style={{ fontSize: "0.66rem", textTransform: "uppercase", padding: "6px 4px", textAlign: "right", whiteSpace: "nowrap" }}>DATE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recent_attempts.slice(0, 5).map((attempt) => (
                          <tr
                            key={attempt.attempt_id}
                            style={{ cursor: "pointer" }}
                            onClick={() => navigate(`/student/quizzes/${attempt.quiz_id}/result/${attempt.attempt_id}`)}
                            title="Click to view scorecard"
                          >
                            <td style={{ fontWeight: 600, color: "var(--color-text-main)", padding: "7px 4px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {attempt.quiz_title}
                            </td>
                            <td style={{ fontWeight: 700, padding: "7px 4px", textAlign: "center", whiteSpace: "nowrap" }}>
                              {attempt.percentage != null ? `${attempt.percentage}%` : "0%"}
                            </td>
                            <td style={{ padding: "7px 4px", textAlign: "center", whiteSpace: "nowrap" }}>
                              {getStatusBadge(attempt.status)}
                            </td>
                            <td className="muted" style={{ fontSize: "0.74rem", padding: "7px 4px", textAlign: "right", whiteSpace: "nowrap" }}>
                              {formatDate(attempt.completed_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div
                className="card"
                style={{
                  padding: "16px 18px",
                  background: "#ffffff",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div className="flex-between mb-3" style={{ alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
                    Leaderboard (Top Students)
                  </h3>
                  <Link to="/leaderboard" className="btn btn-link btn-sm" style={{ fontSize: "0.78rem", padding: 0, whiteSpace: "nowrap" }}>
                    Full Rankings &rarr;
                  </Link>
                </div>

                {topLeaderboard.length === 0 ? (
                  <div style={{ padding: "16px 8px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                    No leaderboard rankings available yet.
                  </div>
                ) : (
                  <div className="table-responsive" style={{ overflowX: "auto" }}>
                    <table className="table" style={{ fontSize: "0.8rem", width: "100%" }}>
                      <thead>
                        <tr>
                          <th style={{ fontSize: "0.66rem", textTransform: "uppercase", padding: "6px 2px", textAlign: "center", width: "28px", whiteSpace: "nowrap" }}>RANK</th>
                          <th style={{ fontSize: "0.66rem", textTransform: "uppercase", padding: "6px 4px" }}>STUDENT</th>
                          <th style={{ fontSize: "0.66rem", textTransform: "uppercase", padding: "6px 4px", textAlign: "center", whiteSpace: "nowrap" }}>AVG SCORE</th>
                          <th style={{ fontSize: "0.66rem", textTransform: "uppercase", padding: "6px 4px", textAlign: "center", whiteSpace: "nowrap" }}>COMPLETED</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topLeaderboard.map((entry) => {
                          const isCurrentUser = user?.id === entry.student_id;
                          return (
                            <tr
                              key={entry.student_id}
                              style={{
                                background: isCurrentUser ? "#eff6ff" : "transparent",
                              }}
                            >
                              <td style={{ textAlign: "center", padding: "7px 2px", whiteSpace: "nowrap" }}>
                                {getRankBadge(entry.rank)}
                              </td>
                              <td style={{ fontWeight: isCurrentUser ? 700 : 600, color: isCurrentUser ? "var(--color-primary)" : "var(--color-text-main)", padding: "7px 4px", maxWidth: "115px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {isCurrentUser ? `You (${entry.student_name})` : entry.student_name}
                              </td>
                              <td style={{ fontWeight: 700, padding: "7px 4px", textAlign: "center", whiteSpace: "nowrap", color: entry.average_score >= 50 ? "var(--color-success)" : "var(--color-danger)" }}>
                                {entry.average_score.toFixed(1)}%
                              </td>
                              <td style={{ textAlign: "center", fontWeight: 600, padding: "7px 4px", whiteSpace: "nowrap" }}>
                                {entry.quizzes_completed}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <p style={{ margin: "10px 0 0", fontSize: "0.7rem", color: "var(--color-text-muted)", textAlign: "center", lineHeight: 1.35 }}>
                  Rankings are based on average score. More quizzes completed is used as tie-breaker.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
