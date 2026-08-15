import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const { user, logout } = useAuth();

  if (user?.role === "ADMIN") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="container" style={{ maxWidth: "800px" }}>
      {/* Welcome Card */}
      <div className="card mb-4" style={{ padding: "2.2rem 2rem", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "#ffffff" }}>
        <h1 style={{ color: "#ffffff", fontSize: "1.8rem", margin: "0 0 8px 0" }}>
          Welcome back, {user?.name}!
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "0.98rem", margin: 0 }}>
          Access your quizzes, track your performance analytics, and attempt available quizzes.
        </p>

        <div style={{ display: "flex", gap: "12px", marginTop: "1.5rem", flexWrap: "wrap" }}>
          <Link to="/student/dashboard" className="btn btn-primary" style={{ padding: "10px 22px" }}>
            Student Dashboard
          </Link>
          <Link to="/student/quizzes" className="btn btn-secondary" style={{ padding: "10px 22px" }}>
            Browse Quizzes
          </Link>
        </div>
      </div>

      {/* User Info Card */}
      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: "1rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
          Account Details
        </h3>

        <ul className="user-info">
          <li>
            <strong className="muted">Name:</strong>
            <span>{user?.name}</span>
          </li>
          <li>
            <strong className="muted">Email:</strong>
            <span>{user?.email}</span>
          </li>
          <li>
            <strong className="muted">Role:</strong>
            <span className="badge badge-info">{user?.role}</span>
          </li>
          <li>
            <strong className="muted">Status:</strong>
            <span className="badge badge-success">{user?.status}</span>
          </li>
        </ul>

        <div style={{ textAlign: "right" }}>
          <button type="button" className="btn btn-outline" onClick={logout}>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
