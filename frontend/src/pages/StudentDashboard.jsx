import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/client.js";

function PerformanceChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="card text-center" style={{ padding: "2.5rem 1rem", color: "var(--color-text-muted)" }}>
        <p style={{ margin: 0, fontSize: "0.95rem" }}>No performance data available yet.</p>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem" }}>Complete a quiz to track your progress score trend.</p>
      </div>
    );
  }

  const width = 600;
  const height = 220;
  const paddingLeft = 45;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = data.map((item, idx) => {
    const x =
      data.length === 1
        ? paddingLeft + chartWidth / 2
        : paddingLeft + (idx / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (item.percentage / 100) * chartHeight;
    return { x, y, title: item.quiz_title, percentage: item.percentage };
  });

  const linePath =
    points.length === 1
      ? ""
      : points.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`, "");

  const gridYValues = [0, 25, 50, 75, 100];

  return (
    <div className="card mb-4" style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Score Trend</h3>
        <span className="muted" style={{ fontSize: "0.85rem" }}>Latest {data.length} attempts</span>
      </div>
      <div style={{ width: "100%", minWidth: "500px" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
          {/* Y-axis gridlines & labels */}
          {gridYValues.map((val) => {
            const y = paddingTop + chartHeight - (val / 100) * chartHeight;
            return (
              <g key={val}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeDasharray={val === 0 || val === 100 ? "0" : "3,3"}
                  strokeWidth={val === 0 ? "1.5" : "1"}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="var(--color-text-muted)"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Line Path */}
          {points.length > 1 && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Point Markers & Tooltips */}
          {points.map((pt, idx) => (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="5"
                fill="var(--color-surface)"
                stroke="var(--color-primary)"
                strokeWidth="2.5"
              />
              <text
                x={pt.x}
                y={pt.y - 10}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="var(--color-text-main)"
              >
                {Math.round(pt.percentage)}%
              </text>
              <text
                x={pt.x}
                y={height - 12}
                textAnchor="middle"
                fontSize="10"
                fill="var(--color-text-muted)"
              >
                {pt.title.length > 12 ? pt.title.substring(0, 10) + "…" : pt.title}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/student/dashboard");
      setDashboardData(response.data);
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

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: "880px" }}>
        <h2>Student Dashboard</h2>
        <p className="muted">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ maxWidth: "880px" }}>
        <h2>Student Dashboard</h2>
        <div className="alert alert-error mb-3" style={{ display: "block", marginTop: "1rem" }}>
          <div>{error}</div>
          <div style={{ marginTop: "0.8rem" }}>
            <button type="button" className="btn btn-secondary" onClick={fetchDashboard}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { statistics, recent_attempts, performance } = dashboardData || {};

  const getStatusBadge = (status) => {
    if (status === "PASSED") {
      return <span className="badge badge-success">PASSED</span>;
    }
    if (status === "FAILED") {
      return <span className="badge badge-danger">FAILED</span>;
    }
    if (status === "EXPIRED") {
      return <span className="badge badge-warning">EXPIRED</span>;
    }
    return <span className="badge">{status}</span>;
  };

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="container" style={{ maxWidth: "880px" }}>
      {/* Header Bar */}
      <div className="flex-between mb-4" style={{ alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem" }}>Student Dashboard</h1>
          <p className="muted" style={{ margin: "0.25rem 0 0" }}>
            Overview of your quiz performance and recent attempts.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link to="/student/quizzes" className="btn btn-primary">
            Browse Quizzes
          </Link>
          <Link to="/" className="btn btn-secondary">
            Home
          </Link>
        </div>
      </div>

      {/* STATISTICS GRID */}
      <div className="mb-4">
        <h2 style={{ fontSize: "1.15rem", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>
          STATISTICS
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "1rem",
          }}
        >
          <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 600 }}>
              Quizzes Attempted
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: "0.3rem", color: "var(--color-primary)" }}>
              {statistics?.total_attempted ?? 0}
            </div>
          </div>

          <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 600 }}>
              Average Score
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: "0.3rem" }}>
              {statistics?.average_score ?? 0}%
            </div>
          </div>

          <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 600 }}>
              Highest Score
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: "0.3rem", color: "var(--color-success)" }}>
              {statistics?.highest_score ?? 0}%
            </div>
          </div>

          <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 600 }}>
              Passed
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: "0.3rem", color: "var(--color-success)" }}>
              {statistics?.total_passed ?? 0}
            </div>
          </div>

          <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 600 }}>
              Failed
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: "0.3rem", color: "var(--color-danger)" }}>
              {statistics?.total_failed ?? 0}
            </div>
          </div>

          <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 600 }}>
              Questions Answered
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: "0.3rem" }}>
              {statistics?.total_questions_answered ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* PERFORMANCE CHART */}
      <div className="mb-4">
        <h2 style={{ fontSize: "1.15rem", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>
          PERFORMANCE
        </h2>
        <PerformanceChart data={performance || []} />
      </div>

      {/* RECENT ATTEMPTS */}
      <div className="mb-4">
        <h2 style={{ fontSize: "1.15rem", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>
          RECENT ATTEMPTS
        </h2>

        {!recent_attempts || recent_attempts.length === 0 ? (
          <div className="card text-center" style={{ padding: "2.5rem 1rem", color: "var(--color-text-muted)" }}>
            <p style={{ margin: 0, fontSize: "1rem" }}>No quiz attempts yet.</p>
            <div style={{ marginTop: "1rem" }}>
              <Link to="/student/quizzes" className="btn btn-primary">
                Browse Quizzes to Start
              </Link>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: "0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Quiz</th>
                  <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Category</th>
                  <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Score</th>
                  <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Status</th>
                  <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Date</th>
                  <th style={{ padding: "12px 16px", fontSize: "0.85rem", textAlign: "right", color: "var(--color-text-muted)" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recent_attempts.map((attempt) => (
                  <tr key={attempt.attempt_id} style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600 }}>{attempt.quiz_title}</td>
                    <td style={{ padding: "12px 16px", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                      {attempt.category || "General"}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                      {attempt.percentage != null ? `${attempt.percentage}%` : "-"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>{getStatusBadge(attempt.status)}</td>
                    <td style={{ padding: "12px 16px", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                      {formatDate(attempt.completed_at)}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                        onClick={() => navigate(`/student/quizzes/${attempt.quiz_id}/result/${attempt.attempt_id}`)}
                      >
                        View Result
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer / Browse CTA */}
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <Link to="/student/quizzes" className="btn btn-primary" style={{ padding: "10px 24px" }}>
          Browse All Quizzes
        </Link>
      </div>
    </div>
  );
}
