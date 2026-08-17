import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import StudentLayout from "../components/StudentLayout.jsx";
import AdminLayout from "../components/AdminLayout.jsx";

export default function Leaderboard() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get("/categories");
      setCategories(res.data || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const url = selectedCategory
        ? `/leaderboard?category_id=${encodeURIComponent(selectedCategory)}`
        : "/leaderboard";

      const res = await apiClient.get(url);
      setLeaderboard(res.data?.leaderboard || []);
      setUserRank(res.data?.user_rank || null);
      setTotalParticipants(res.data?.total_participants || 0);
    } catch (err) {
      console.error("Error loading leaderboard:", err);
      if (err.response?.status === 401) {
        setError("Unauthorized: Please log in to view the leaderboard.");
      } else {
        setError("Unable to load leaderboard.");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            backgroundColor: "#fef3c7",
            color: "#b45309",
            fontWeight: "800",
            fontSize: "0.85rem",
          }}
          title="1st Place"
        >
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            backgroundColor: "#f1f5f9",
            color: "#475569",
            fontWeight: "800",
            fontSize: "0.85rem",
          }}
          title="2nd Place"
        >
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            backgroundColor: "#ffedd5",
            color: "#9a3412",
            fontWeight: "800",
            fontSize: "0.85rem",
          }}
          title="3rd Place"
        >
          3
        </span>
      );
    }
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "28px",
          height: "28px",
          fontWeight: "600",
          color: "var(--color-text-muted)",
          fontSize: "0.9rem",
        }}
      >
        #{rank}
      </span>
    );
  };

  const selectedCategoryObj = categories.find((c) => String(c.id) === String(selectedCategory));
  const categoryLabel = selectedCategoryObj ? selectedCategoryObj.name : "Overall";
  const isUserInTopList = leaderboard.some((entry) => entry.student_id === user?.id);

  const content = (
    <div className="container" style={{ paddingTop: "0" }}>
      <div
        className="card mb-4"
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          background: "var(--color-surface)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label htmlFor="category-select" style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text-main)" }}>
            Leaderboard Scope:
          </label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={handleCategoryChange}
            style={{
              padding: "8px 14px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              background: "var(--color-surface)",
              color: "var(--color-text-main)",
              cursor: "pointer",
              minWidth: "220px",
            }}
          >
            <option value="">Overall (All Categories)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Showing: <strong style={{ color: "var(--color-text-main)" }}>{categoryLabel} Leaderboard</strong>
          {totalParticipants > 0 && ` (${totalParticipants} active participants)`}
        </div>
      </div>

      {user?.role === "STUDENT" && userRank && !isUserInTopList && (
        <div
          className="card mb-4"
          style={{
            padding: "16px 20px",
            background: "linear-gradient(135deg, #f0f9ff 0%, #eff6ff 100%)",
            border: "1.5px solid #bfdbfe",
            color: "var(--color-text-main)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--color-primary)", fontWeight: 700 }}>
              Your Standings ({categoryLabel})
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: "2px", color: "var(--color-text-main)" }}>
              {user?.name} <span className="badge badge-primary" style={{ marginLeft: "6px" }}>YOU</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Your Rank</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-primary)" }}>#{userRank.rank}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Average Score</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-success)" }}>{userRank.average_score}%</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Quizzes</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-text-main)" }}>{userRank.quizzes_completed}</div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card text-center" style={{ padding: "3rem 1rem", color: "var(--color-text-muted)" }}>
          <p style={{ fontSize: "1.05rem", margin: 0 }}>Loading leaderboard rankings...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error mb-3" style={{ display: "block" }}>
          <div>{error}</div>
          <div style={{ marginTop: "0.8rem" }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={fetchLeaderboard}>
              Retry
            </button>
          </div>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="card text-center" style={{ padding: "3.5rem 1.5rem", color: "var(--color-text-muted)" }}>
          <h3 style={{ margin: "0 0 8px 0", color: "var(--color-text-main)", fontSize: "1.2rem" }}>
            {selectedCategory
              ? "No leaderboard data available for this category yet."
              : "No leaderboard data available yet."}
          </h3>
          <p style={{ margin: "0 auto 1.5rem", maxWidth: "420px", fontSize: "0.9rem" }}>
            Complete and finalize quiz attempts to appear on the official leaderboard.
          </p>
          {user?.role === "STUDENT" && (
            <Link to="/student/quizzes" className="btn btn-primary">
              Take a Quiz Now
            </Link>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: "90px" }}>Rank</th>
                  <th>Student Name</th>
                  <th style={{ textAlign: "center", width: "160px" }}>Average Score</th>
                  <th style={{ textAlign: "center", width: "160px" }}>Quizzes Completed</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => {
                  const isCurrentUser = user?.id === entry.student_id;
                  return (
                    <tr
                      key={entry.student_id}
                      style={{
                        backgroundColor: isCurrentUser ? "#eff6ff" : undefined,
                        fontWeight: isCurrentUser ? "600" : "normal",
                      }}
                    >
                      <td>{getRankBadge(entry.rank)}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ color: isCurrentUser ? "var(--color-primary-dark)" : "var(--color-text-main)" }}>
                            {entry.student_name}
                          </span>
                          {isCurrentUser && (
                            <span className="badge badge-primary">YOU</span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          className={`badge ${
                            entry.average_score >= 80
                              ? "badge-success"
                              : entry.average_score >= 50
                              ? "badge-info"
                              : "badge-danger"
                          }`}
                          style={{ fontSize: "0.85rem", padding: "4px 10px" }}
                        >
                          {entry.average_score.toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
                        <strong style={{ color: "var(--color-text-main)" }}>{entry.quizzes_completed}</strong> {entry.quizzes_completed === 1 ? "quiz" : "quizzes"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
        Rankings are updated automatically as quiz attempts are completed and scored.
      </div>
    </div>
  );

  if (user?.role === "ADMIN") {
    return (
      <AdminLayout title="Global & Category Leaderboard">
        {content}
      </AdminLayout>
    );
  }

  return (
    <StudentLayout
      title="Platform Leaderboard"
      subtitle="Top student rankings based on finalized quiz performance and overall accuracy."
      action={
        <div className="flex-gap">
          <Link to="/student/dashboard" className="btn btn-secondary btn-sm">
            My Dashboard
          </Link>
          <Link to="/student/quizzes" className="btn btn-primary btn-sm">
            Browse Quizzes
          </Link>
        </div>
      }
    >
      {content}
    </StudentLayout>
  );
}
