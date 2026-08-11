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
  const isQuizzesActive = location.pathname.startsWith("/admin/quizzes");

  return (
    <div className="admin-layout">
      <header className="admin-navbar">
        <div className="navbar-brand">
          <Link to="/admin/dashboard" className="brand-logo">
            <span className="logo-icon">📊</span>
            <span className="logo-text">QuizAdmin</span>
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
            to="/admin/users"
            className={`nav-link ${isUsersActive ? "active" : ""}`}
          >
            Users
          </Link>
        </nav>
        <div className="navbar-user">
          <div className="user-badge">
            <span className="user-name">{user?.name}</span>
            <span className="role-tag">{user?.role}</span>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
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
              <span className="icon">📈</span> Dashboard Overview
            </Link>
            <Link
              to="/admin/quizzes"
              className={`sidebar-item ${isQuizzesActive ? "active" : ""}`}
            >
              <span className="icon">📝</span> Quiz Management
            </Link>
            <Link
              to="/admin/users"
              className={`sidebar-item ${isUsersActive ? "active" : ""}`}
            >
              <span className="icon">👥</span> User Management
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
