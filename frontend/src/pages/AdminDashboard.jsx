import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import apiClient from "../api/client.js";
import AdminLayout from "../components/AdminLayout.jsx";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState("attempts");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, quizRes, analyticsRes] = await Promise.all([
        apiClient.get("/admin/dashboard/stats"),
        apiClient.get("/quizzes").catch(() => ({ data: [] })),
        apiClient.get("/admin/analytics").catch(() => ({ data: null })),
      ]);
      setStats(statsRes.data);
      setQuizzes(quizRes.data || []);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
      setAnalyticsLoading(false);
    }
  };

  const handlePublishQuiz = async (quiz) => {
    setActionLoadingId(quiz.id);
    setActionMsg(null);
    try {
      const { data } = await apiClient.patch(`/quizzes/${quiz.id}/publish`, {
        status: "PUBLISHED",
      });
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quiz.id ? { ...q, status: data.status } : q))
      );
      if (stats) {
        setStats({
          ...stats,
          published_quizzes: (stats.published_quizzes || 0) + 1,
          draft_quizzes: Math.max(0, (stats.draft_quizzes || 1) - 1),
        });
      }
      setActionMsg(`Quiz "${quiz.title}" has been published!`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to publish quiz.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const passFailData = analytics?.pass_fail_ratio
    ? [
        { name: "Passed", value: analytics.pass_fail_ratio.passed || 0, color: "#10b981" },
        { name: "Failed", value: analytics.pass_fail_ratio.failed || 0, color: "#ef4444" },
      ]
    : [];

  const isPassFailEmpty = !passFailData.some((d) => d.value > 0);

  const draftQuizzes = quizzes.filter((q) => q.status === "DRAFT");
  const displayQuizzes = draftQuizzes.length > 0 ? draftQuizzes : quizzes.slice(0, 5);

  return (
    <AdminLayout>
      <div style={{ marginBottom: "12px" }}>
        <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: "#000000", lineHeight: 1.2 }}>
          Admin Dashboard
        </h1>
        <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#334155" }}>
          Manage quizzes, monitor activity, and track platform performance.
        </p>
      </div>

      {loading && <div className="loading-spinner">Loading dashboard data...</div>}

      {error && (
        <div className="alert alert-error mb-2">
          {error}
          <button type="button" className="btn btn-secondary btn-sm" style={{ marginLeft: "10px" }} onClick={fetchDashboardData}>
            Retry
          </button>
        </div>
      )}

      {actionMsg && (
        <div className="alert alert-success mb-2">
          {actionMsg}
        </div>
      )}

      {!loading && stats && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Total Students</span>
              </div>
              <div className="admin-stat-value">{stats.total_students}</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Total Quizzes</span>
              </div>
              <div className="admin-stat-value">{stats.total_quizzes}</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Published</span>
              </div>
              <div className="admin-stat-value">{stats.published_quizzes}</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Questions</span>
              </div>
              <div className="admin-stat-value">{stats.total_questions}</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Attempts</span>
              </div>
              <div className="admin-stat-value">{stats.total_attempts}</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Avg Score</span>
              </div>
              <div className="admin-stat-value">{stats.average_score}%</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Passed</span>
              </div>
              <div className="admin-stat-value">{stats.passed_attempts}</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Failed</span>
              </div>
              <div className="admin-stat-value">{stats.failed_attempts}</div>
            </div>
          </div>

          <div className="admin-dashboard-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="admin-quick-bar">
                <div className="quick-bar-left" style={{ color: "#000000" }}>
                  Quick Actions:
                </div>
                <div className="quick-bar-actions">
                  <Link to="/admin/quizzes/new" className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
                    + Create Quiz
                  </Link>
                  <Link to="/admin/quizzes" className="btn btn-secondary btn-sm">
                    Manage Quizzes
                  </Link>
                  <Link to="/admin/categories" className="btn btn-secondary btn-sm">
                    Categories
                  </Link>
                  <Link to="/admin/users" className="btn btn-secondary btn-sm">
                    Manage Students
                  </Link>
                </div>
              </div>

              <div
                className="card"
                style={{
                  padding: "18px 20px",
                  background: "#ffffff",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div className="flex-between mb-3" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "#000000" }}>
                      Quiz Management
                    </h2>
                    <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#334155" }}>
                      Create, publish, and manage your quizzes.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Link to="/admin/quizzes/new" className="btn btn-primary btn-sm">
                      + Create New Quiz
                    </Link>
                    <Link to="/admin/quizzes" className="btn btn-outline btn-sm">
                      Manage All Quizzes &rarr;
                    </Link>
                  </div>
                </div>

                {displayQuizzes.length === 0 ? (
                  <div style={{ padding: "24px 16px", textAlign: "center", background: "var(--color-bg)", borderRadius: "var(--radius-sm)", border: "1px dashed var(--color-border)" }}>
                    <p style={{ margin: "0 0 12px 0", fontSize: "0.88rem", color: "#334155" }}>
                      No draft or unpublished quizzes.
                    </p>
                    <Link to="/admin/quizzes/new" className="btn btn-primary btn-sm">
                      + Create New Quiz
                    </Link>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table" style={{ fontSize: "0.84rem", width: "100%" }}>
                      <thead>
                        <tr>
                          <th style={{ fontSize: "0.68rem", textTransform: "uppercase", padding: "8px 6px", color: "#000000" }}>Quiz Title</th>
                          <th style={{ fontSize: "0.68rem", textTransform: "uppercase", padding: "8px 6px", color: "#000000" }}>Category</th>
                          <th style={{ fontSize: "0.68rem", textTransform: "uppercase", padding: "8px 6px", textAlign: "center", color: "#000000" }}>Difficulty</th>
                          <th style={{ fontSize: "0.68rem", textTransform: "uppercase", padding: "8px 6px", textAlign: "center", color: "#000000" }}>Questions</th>
                          <th style={{ fontSize: "0.68rem", textTransform: "uppercase", padding: "8px 6px", textAlign: "center", color: "#000000" }}>Status</th>
                          <th style={{ fontSize: "0.68rem", textTransform: "uppercase", padding: "8px 6px", textAlign: "right", color: "#000000" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayQuizzes.map((quiz) => (
                          <tr key={quiz.id}>
                            <td style={{ fontWeight: 600, color: "#000000", padding: "8px 6px" }}>
                              {quiz.title}
                            </td>
                            <td style={{ padding: "8px 6px" }}>
                              <span className="badge badge-info" style={{ fontSize: "0.68rem", padding: "1px 6px" }}>
                                {quiz.category || "General"}
                              </span>
                            </td>
                            <td style={{ textAlign: "center", padding: "8px 6px" }}>
                              <span
                                className={`badge ${
                                  quiz.difficulty === "EASY"
                                    ? "badge-success"
                                    : quiz.difficulty === "HARD"
                                    ? "badge-danger"
                                    : "badge-warning"
                                }`}
                                style={{ fontSize: "0.68rem", padding: "1px 6px" }}
                              >
                                {quiz.difficulty || "MEDIUM"}
                              </span>
                            </td>
                            <td style={{ textAlign: "center", fontWeight: 700, padding: "8px 6px", color: "#000000" }}>
                              {quiz.questions_count || quiz.question_count || 0}
                            </td>
                            <td style={{ textAlign: "center", padding: "8px 6px" }}>
                              <span
                                className={`badge ${
                                  quiz.status === "PUBLISHED" ? "badge-success" : "badge-warning"
                                }`}
                                style={{ fontSize: "0.68rem", padding: "1px 6px" }}
                              >
                                {quiz.status}
                              </span>
                            </td>
                            <td style={{ textAlign: "right", padding: "8px 6px", whiteSpace: "nowrap" }}>
                              <div style={{ display: "inline-flex", gap: "4px" }}>
                                <Link to={`/admin/quizzes/${quiz.id}/edit`} className="btn btn-secondary btn-sm" style={{ padding: "3px 8px", fontSize: "0.76rem" }}>
                                  Edit
                                </Link>
                                <Link to={`/admin/quizzes/${quiz.id}/questions`} className="btn btn-secondary btn-sm" style={{ padding: "3px 8px", fontSize: "0.76rem" }}>
                                  Questions
                                </Link>
                                {quiz.status === "DRAFT" && (
                                  <button
                                    type="button"
                                    className="btn btn-success btn-sm"
                                    style={{ padding: "3px 8px", fontSize: "0.76rem" }}
                                    disabled={actionLoadingId === quiz.id}
                                    onClick={() => handlePublishQuiz(quiz)}
                                  >
                                    {actionLoadingId === quiz.id ? "Publishing..." : "Publish"}
                                  </button>
                                )}
                              </div>
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
                  padding: "18px 20px",
                  background: "#ffffff",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div className="flex-between mb-3" style={{ alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "#000000" }}>
                      Platform Analytics
                    </h2>
                    <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#334155" }}>
                      Monitor key platform trends.
                    </p>
                  </div>

                  <div>
                    <select
                      value={selectedMetric}
                      onChange={(e) => setSelectedMetric(e.target.value)}
                      style={{
                        padding: "6px 12px",
                        fontSize: "0.84rem",
                        fontWeight: 600,
                        borderRadius: "var(--radius-sm)",
                        border: "1.5px solid var(--color-border)",
                        background: "#ffffff",
                        color: "#000000",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      <option value="attempts">Quiz Attempts Over Time</option>
                      <option value="registrations">Student Registrations</option>
                      <option value="scores">Average Quiz Scores</option>
                      <option value="pass_fail">Pass / Fail Ratio</option>
                      <option value="popular_quizzes">Most Popular Quizzes</option>
                      <option value="popular_categories">Most Popular Categories</option>
                    </select>
                  </div>
                </div>

                {analyticsLoading ? (
                  <div className="loading-spinner">Loading analytics...</div>
                ) : analyticsError ? (
                  <div className="alert alert-error">{analyticsError}</div>
                ) : (
                  <div>
                    {selectedMetric === "attempts" && (
                      <div>
                        {analytics?.attempts_over_time?.length > 0 ? (
                          <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={analytics.attempts_over_time} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="attemptsGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#000000" }} />
                              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#000000" }} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#1e293b",
                                  border: "none",
                                  borderRadius: "6px",
                                  color: "#ffffff",
                                  fontSize: "12px",
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="attempts"
                                stroke="#2563eb"
                                strokeWidth={2.5}
                                fill="url(#attemptsGrad)"
                                dot={{ r: 3, fill: "#ffffff", stroke: "#2563eb", strokeWidth: 2 }}
                                name="Attempts"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="empty-chart-state" style={{ minHeight: "200px", color: "#334155" }}>No attempt trends recorded yet.</div>
                        )}
                      </div>
                    )}

                    {selectedMetric === "registrations" && (
                      <div>
                        {analytics?.student_registrations?.length > 0 ? (
                          <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={analytics.student_registrations} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#000000" }} />
                              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#000000" }} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#1e293b",
                                  border: "none",
                                  borderRadius: "6px",
                                  color: "#ffffff",
                                  fontSize: "12px",
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="registrations"
                                stroke="#10b981"
                                strokeWidth={2.5}
                                fill="url(#regGrad)"
                                dot={{ r: 3, fill: "#ffffff", stroke: "#10b981", strokeWidth: 2 }}
                                name="Registrations"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="empty-chart-state" style={{ minHeight: "200px", color: "#334155" }}>No student registration data recorded yet.</div>
                        )}
                      </div>
                    )}

                    {selectedMetric === "scores" && (
                      <div>
                        {analytics?.average_quiz_scores?.length > 0 ? (
                          <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={analytics.average_quiz_scores} margin={{ top: 10, right: 15, left: -20, bottom: 25 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="quiz_title" tick={{ fontSize: 10, fill: "#000000" }} interval={0} angle={-15} textAnchor="end" />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#000000" }} />
                              <Tooltip
                                formatter={(value) => [`${value}%`, "Avg Score"]}
                                contentStyle={{
                                  backgroundColor: "#1e293b",
                                  border: "none",
                                  borderRadius: "6px",
                                  color: "#ffffff",
                                  fontSize: "12px",
                                }}
                              />
                              <Bar dataKey="average_score" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Avg Score (%)" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="empty-chart-state" style={{ minHeight: "200px", color: "#334155" }}>No score records available yet.</div>
                        )}
                      </div>
                    )}

                    {selectedMetric === "pass_fail" && (
                      <div>
                        {!isPassFailEmpty ? (
                          <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                              <Pie
                                data={passFailData}
                                cx="50%"
                                cy="45%"
                                innerRadius={50}
                                outerRadius={75}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {passFailData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#1e293b",
                                  border: "none",
                                  borderRadius: "6px",
                                  color: "#ffffff",
                                  fontSize: "12px",
                                }}
                              />
                              <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontSize: "12px", color: "#000000" }} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="empty-chart-state" style={{ minHeight: "200px", color: "#334155" }}>No finalized attempts recorded yet.</div>
                        )}
                      </div>
                    )}

                    {selectedMetric === "popular_quizzes" && (
                      <div>
                        {analytics?.popular_quizzes?.length > 0 ? (
                          <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={analytics.popular_quizzes} margin={{ top: 10, right: 15, left: -20, bottom: 25 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="quiz_title" tick={{ fontSize: 10, fill: "#000000" }} interval={0} angle={-15} textAnchor="end" />
                              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#000000" }} />
                              <Tooltip
                                formatter={(value) => [value, "Attempts"]}
                                contentStyle={{
                                  backgroundColor: "#1e293b",
                                  border: "none",
                                  borderRadius: "6px",
                                  color: "#ffffff",
                                  fontSize: "12px",
                                }}
                              />
                              <Bar dataKey="attempt_count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Attempts" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="empty-chart-state" style={{ minHeight: "200px", color: "#334155" }}>No quiz attempt rankings available yet.</div>
                        )}
                      </div>
                    )}

                    {selectedMetric === "popular_categories" && (
                      <div>
                        {analytics?.popular_categories?.length > 0 ? (
                          <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={analytics.popular_categories} margin={{ top: 10, right: 15, left: -20, bottom: 25 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="category" tick={{ fontSize: 10, fill: "#000000" }} interval={0} angle={-15} textAnchor="end" />
                              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#000000" }} />
                              <Tooltip
                                formatter={(value) => [value, "Attempts"]}
                                contentStyle={{
                                  backgroundColor: "#1e293b",
                                  border: "none",
                                  borderRadius: "6px",
                                  color: "#ffffff",
                                  fontSize: "12px",
                                }}
                              />
                              <Bar dataKey="attempt_count" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Attempts" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="empty-chart-state" style={{ minHeight: "200px", color: "#334155" }}>No category attempt data available yet.</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                className="card"
                style={{
                  padding: "16px 18px",
                  background: "#ffffff",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div className="flex-between mb-3" style={{ alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#000000" }}>
                    Quizzes Needing Attention
                  </h3>
                </div>

                {draftQuizzes.length === 0 ? (
                  <div
                    style={{
                      padding: "14px 10px",
                      textAlign: "center",
                      background: "var(--color-bg)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px dashed var(--color-border)",
                      color: "#334155",
                      fontSize: "0.82rem",
                    }}
                  >
                    All quizzes are published.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {draftQuizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          background: "var(--color-bg)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1, marginRight: "8px" }}>
                          <div style={{ fontWeight: 700, fontSize: "0.84rem", color: "#000000", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {quiz.title}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "#334155", marginTop: "2px" }}>
                            {quiz.category || "General"} · <span className="badge badge-warning" style={{ fontSize: "0.6rem", padding: "0 4px" }}>Draft</span>
                          </div>
                        </div>
                        <Link
                          to={`/admin/quizzes/${quiz.id}/edit`}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: "0.74rem", padding: "3px 8px", whiteSpace: "nowrap" }}
                        >
                          Edit &rarr;
                        </Link>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: "12px", textAlign: "right" }}>
                  <Link to="/admin/quizzes" className="btn btn-link btn-sm" style={{ fontSize: "0.78rem", padding: 0 }}>
                    View All Quizzes &rarr;
                  </Link>
                </div>
              </div>

              <div
                className="card"
                style={{
                  padding: "16px 18px",
                  background: "#ffffff",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <h3 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", fontWeight: 700, color: "#000000" }}>
                  Platform Health
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.82rem" }}>
                  <div className="flex-between" style={{ padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ color: "#334155" }}>Published Ratio</span>
                    <span style={{ fontWeight: 700, color: "#000000" }}>
                      {stats.published_quizzes} / {stats.total_quizzes} Quizzes
                    </span>
                  </div>

                  <div className="flex-between" style={{ padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ color: "#334155" }}>Pass Rate</span>
                    <span style={{ fontWeight: 700, color: "#000000" }}>
                      {stats.total_attempts > 0
                        ? `${((stats.passed_attempts / stats.total_attempts) * 100).toFixed(1)}%`
                        : "0%"}
                    </span>
                  </div>

                  <div className="flex-between" style={{ padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ color: "#334155" }}>Total Question Bank</span>
                    <span style={{ fontWeight: 700, color: "#000000" }}>
                      {stats.total_questions} Questions
                    </span>
                  </div>

                  <div className="flex-between" style={{ padding: "6px 0" }}>
                    <span style={{ color: "#334155" }}>Total Students</span>
                    <span style={{ fontWeight: 700, color: "#000000" }}>
                      {stats.total_students} Registered
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
