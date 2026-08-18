import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function StudentLayout({ children, title, subtitle, action }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isHomeActive = location.pathname === "/";
  const isDashboardActive = location.pathname === "/student/dashboard";
  const isQuizzesActive = location.pathname.startsWith("/student/quizzes");
  const isLeaderboardActive = location.pathname === "/leaderboard";

  return (
    <div className="student-shell">
      <header className="student-navbar">
        <div className="student-nav-container">
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "1.25rem", color: "var(--color-text-main)", letterSpacing: "-0.03em" }}>
                Quizzz <span style={{ color: "var(--color-primary)" }}>Up</span>
              </span>
            </Link>

            <nav className="student-nav-menu" style={{ display: "flex", gap: "4px" }}>
              <Link to="/student/dashboard" className={`student-nav-link ${isDashboardActive ? "active" : ""}`}>
                Dashboard
              </Link>
              <Link to="/student/quizzes" className={`student-nav-link ${isQuizzesActive ? "active" : ""}`}>
                Browse Quizzes
              </Link>
              <Link to="/leaderboard" className={`student-nav-link ${isLeaderboardActive ? "active" : ""}`}>
                Leaderboard
              </Link>
              <Link to="/profile" className={`student-nav-link ${location.pathname === "/profile" ? "active" : ""}`}>
                Profile
              </Link>
            </nav>
          </div>

          <div className="student-user-chip" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link
              to="/profile"
              style={{
                textAlign: "right",
                textDecoration: "none",
                color: "inherit",
                cursor: "pointer",
                padding: "2px 4px",
                borderRadius: "var(--radius-sm)",
              }}
              title="View & edit your profile"
            >
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                {user?.name}
              </div>
              <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--color-primary)", textTransform: "uppercase" }}>
                {user?.role}
              </div>
            </Link>
            <Link
              to="/profile"
              className="btn btn-secondary btn-sm"
              style={{ padding: "4px 8px", fontSize: "0.78rem" }}
              title="My Profile"
            >
              Profile
            </Link>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleLogout}
              title="Log out"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="student-content">
        {(title || action) && (
          <div className="container" style={{ paddingBottom: "0" }}>
            <div className="flex-between" style={{ alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                {title && <h1 style={{ margin: 0, fontSize: "1.65rem" }}>{title}</h1>}
                {subtitle && <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.92rem" }}>{subtitle}</p>}
              </div>
              {action && <div>{action}</div>}
            </div>
          </div>
        )}
        {children}
      </main>

      <footer className="student-footer">
        <div>Quizzz Up — Online Quiz & Assessment Platform</div>
      </footer>
    </div>
  );
}
