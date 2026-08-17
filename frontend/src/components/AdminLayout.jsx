import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminLayout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isDashboardActive = location.pathname === "/admin/dashboard";
  const isUsersActive = location.pathname.startsWith("/admin/users");
  const isQuizzesActive = location.pathname.startsWith("/admin/quizzes") || location.pathname.startsWith("/admin/questions");
  const isCategoriesActive = location.pathname.startsWith("/admin/categories");

  return (
    <div className="admin-layout">
      <header className="admin-navbar">
        <div className="navbar-brand">
          <Link to="/admin/dashboard" className="brand-logo">
            <span>
              Quizzz <span style={{ color: "var(--color-primary)" }}>Up</span> <span style={{ fontSize: "0.8rem", color: "#334155", fontWeight: 600 }}>Admin</span>
            </span>
          </Link>
        </div>
        <nav className="navbar-menu">
          <Link
            to="/admin/dashboard"
            className={`nav-link ${isDashboardActive ? "active" : ""}`}
          >
            Dashboard
          </Link>
          <Link
            to="/admin/quizzes"
            className={`nav-link ${isQuizzesActive ? "active" : ""}`}
          >
            Quizzes
          </Link>
          <Link
            to="/admin/categories"
            className={`nav-link ${isCategoriesActive ? "active" : ""}`}
          >
            Categories
          </Link>
          <Link
            to="/admin/users"
            className={`nav-link ${isUsersActive ? "active" : ""}`}
          >
            Users
          </Link>
          <Link
            to="/leaderboard"
            className={`nav-link ${location.pathname === "/leaderboard" ? "active" : ""}`}
          >
            Leaderboard
          </Link>
        </nav>
        <div className="navbar-user" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="user-badge" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1.2 }}>
            <span className="user-name" style={{ fontSize: "0.86rem", fontWeight: 700, color: "#000000" }}>
              {user?.name}
            </span>
            <span className="role-tag" style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", background: "#eff6ff", padding: "1px 6px", borderRadius: "4px", border: "1px solid #bfdbfe", marginTop: "2px" }}>
              {user?.role}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ padding: "4px 10px", fontSize: "0.78rem", cursor: "pointer" }}
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </header>

      <div className="admin-body">
        <aside className="admin-sidebar">
          <nav className="sidebar-nav">
            <div className="sidebar-section-title">Central Control Panel</div>
            <Link
              to="/admin/dashboard"
              className={`sidebar-item ${isDashboardActive ? "active" : ""}`}
            >
              Dashboard Overview
            </Link>
            <Link
              to="/admin/quizzes"
              className={`sidebar-item ${isQuizzesActive ? "active" : ""}`}
            >
              Quiz Management
            </Link>
            <Link
              to="/admin/categories"
              className={`sidebar-item ${isCategoriesActive ? "active" : ""}`}
            >
              Categories
            </Link>
            <Link
              to="/admin/users"
              className={`sidebar-item ${isUsersActive ? "active" : ""}`}
            >
              User Management
            </Link>
            <Link
              to="/leaderboard"
              className={`sidebar-item ${location.pathname === "/leaderboard" ? "active" : ""}`}
            >
              Leaderboard
            </Link>
          </nav>
        </aside>

        <main className="admin-content">
          {title && (
            <div className="content-header">
              <h1>{title}</h1>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
