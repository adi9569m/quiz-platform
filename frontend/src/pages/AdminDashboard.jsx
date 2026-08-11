import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client.js";
import AdminLayout from "../components/AdminLayout.jsx";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
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
              <span className="stat-tag muted">Not Implemented Yet</span>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✍️</div>
              <div className="stat-details">
                <span className="stat-value">{stats.total_attempts}</span>
                <span className="stat-label">Total Quiz Attempts</span>
              </div>
              <span className="stat-tag muted">Not Implemented Yet</span>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-details">
                <span className="stat-value">{stats.average_score}%</span>
                <span className="stat-label">Average Score</span>
              </div>
              <span className="stat-tag muted">Not Implemented Yet</span>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-details">
                <span className="stat-value">{stats.passed_attempts}</span>
                <span className="stat-label">Passed Attempts</span>
              </div>
              <span className="stat-tag muted">Not Implemented Yet</span>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⚠️</div>
              <div className="stat-details">
                <span className="stat-value">{stats.failed_attempts}</span>
                <span className="stat-label">Failed Attempts</span>
              </div>
              <span className="stat-tag muted">Not Implemented Yet</span>
            </div>
          </div>

          <div className="quick-actions-card card mt-4">
            <h2>Quick Actions</h2>
            <div className="actions-buttons">
              <Link to="/admin/users" className="btn btn-primary btn-auto">
                👥 View & Manage Students
              </Link>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
