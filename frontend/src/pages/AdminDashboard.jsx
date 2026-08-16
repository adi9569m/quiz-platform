import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchAnalytics();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get("/admin/dashboard/stats");
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const { data } = await apiClient.get("/admin/analytics");
      setAnalytics(data);
    } catch (err) {
      setAnalyticsError(err.response?.data?.message || "Unable to load analytics.");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const passFailData = analytics?.pass_fail_ratio
    ? [
        { name: "Passed", value: analytics.pass_fail_ratio.passed || 0, color: "#10b981" },
        { name: "Failed", value: analytics.pass_fail_ratio.failed || 0, color: "#ef4444" },
      ]
    : [];

  const isPassFailEmpty = !passFailData.some((d) => d.value > 0);

  return (
    <AdminLayout title="Admin Dashboard">
      {loading && <div className="loading-spinner">Loading stats...</div>}

      {error && (
        <div className="alert alert-error">
          {error}
          <button type="button" className="btn-retry" onClick={fetchStats}>
            Retry
          </button>
        </div>
      )}

      {!loading && stats && (
        <div className="dashboard-container">
          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-icon">🎓</div>
              <div className="stat-details">
                <span className="stat-value">{stats.total_students}</span>
                <span className="stat-label">Total Students</span>
              </div>
              <Link to="/admin/users" className="stat-link">
                Manage Students &rarr;
              </Link>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-details">
                <span className="stat-value">{stats.total_quizzes}</span>
                <span className="stat-label">Total Quizzes</span>
              </div>
              <Link to="/admin/quizzes" className="stat-link">
                Manage Quizzes &rarr;
              </Link>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-details">
                <span className="stat-value">{stats.published_quizzes}</span>
                <span className="stat-label">Published Quizzes</span>
              </div>
              <Link to="/admin/quizzes" className="stat-link">
                View Published &rarr;
              </Link>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-details">
                <span className="stat-value">{stats.draft_quizzes}</span>
                <span className="stat-label">Draft Quizzes</span>
              </div>
              <Link to="/admin/quizzes" className="stat-link">
                View Drafts &rarr;
              </Link>
            </div>

            <div className="stat-card">
              <div className="stat-icon">❓</div>
              <div className="stat-details">
                <span className="stat-value">{stats.total_questions}</span>
                <span className="stat-label">Total Questions</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✍️</div>
              <div className="stat-details">
                <span className="stat-value">{stats.total_attempts}</span>
                <span className="stat-label">Total Quiz Attempts</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-details">
                <span className="stat-value">{stats.average_score}%</span>
                <span className="stat-label">Average Score</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-details">
                <span className="stat-value">{stats.passed_attempts}</span>
                <span className="stat-label">Passed Attempts</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⚠️</div>
              <div className="stat-details">
                <span className="stat-value">{stats.failed_attempts}</span>
                <span className="stat-label">Failed Attempts</span>
              </div>
            </div>
          </div>

          <div className="quick-actions-card card mt-4">
            <h2>Quick Actions</h2>
            <div className="actions-buttons">
              <Link to="/admin/users" className="btn btn-primary btn-auto">
                👥 View & Manage Students
              </Link>
              <Link to="/admin/quizzes" className="btn btn-secondary btn-auto">
                📚 Manage Quizzes
              </Link>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="analytics-section mt-5">
            <div className="analytics-header mb-4">
              <h2>Platform Analytics</h2>
              <p className="muted">Real-time metrics and charts derived from database records</p>
            </div>

            {analyticsLoading && <div className="loading-spinner">Loading analytics...</div>}

            {analyticsError && (
              <div className="alert alert-error">
                {analyticsError}
                <button type="button" className="btn-retry" onClick={fetchAnalytics}>
                  Retry
                </button>
              </div>
            )}

            {!analyticsLoading && analytics && (
              <div className="analytics-grid">
                {/* 1. Quiz Attempts Over Time */}
                <div className="chart-card card">
                  <h3 className="chart-title">Quiz Attempts Over Time</h3>
                  {analytics.attempts_over_time?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={analytics.attempts_over_time} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="attempts" stroke="#2563eb" strokeWidth={2.5} activeDot={{ r: 6 }} name="Attempts" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-chart-state">No data available yet.</div>
                  )}
                </div>

                {/* 2. Student Registrations Over Time */}
                <div className="chart-card card">
                  <h3 className="chart-title">Student Registrations</h3>
                  {analytics.student_registrations?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={analytics.student_registrations} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="registrations" stroke="#7c3aed" strokeWidth={2.5} activeDot={{ r: 6 }} name="Registrations" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-chart-state">No data available yet.</div>
                  )}
                </div>

                {/* 3. Average Quiz Scores */}
                <div className="chart-card card">
                  <h3 className="chart-title">Average Quiz Scores (%)</h3>
                  {analytics.average_quiz_scores?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={analytics.average_quiz_scores} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="quiz_title" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Bar dataKey="average_score" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Avg Score (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-chart-state">No data available yet.</div>
                  )}
                </div>

                {/* 4. Pass / Fail Ratio */}
                <div className="chart-card card">
                  <h3 className="chart-title">Pass / Fail Ratio</h3>
                  {!isPassFailEmpty ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={passFailData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {passFailData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-chart-state">No data available yet.</div>
                  )}
                </div>

                {/* 5. Most Popular Quizzes */}
                <div className="chart-card card">
                  <h3 className="chart-title">Most Popular Quizzes</h3>
                  {analytics.popular_quizzes?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={analytics.popular_quizzes} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="quiz_title" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="attempt_count" fill="#10b981" radius={[4, 4, 0, 0]} name="Attempts" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-chart-state">No data available yet.</div>
                  )}
                </div>

                {/* 6. Most Popular Categories */}
                <div className="chart-card card">
                  <h3 className="chart-title">Most Popular Categories</h3>
                  {analytics.popular_categories?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={analytics.popular_categories} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="attempt_count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Attempts" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-chart-state">No data available yet.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
