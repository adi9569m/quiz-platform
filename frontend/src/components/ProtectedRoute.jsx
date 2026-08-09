import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="container">Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="container">Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }
  return children;
}

export function RequireStudent({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="container">Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== "STUDENT") {
    return <Navigate to="/" replace />;
  }
  return children;
}
