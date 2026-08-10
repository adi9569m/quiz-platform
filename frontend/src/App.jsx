import { Routes, Route, Navigate } from "react-router-dom";

import { useAuth } from "./context/AuthContext.jsx";
import { RequireAuth, RequireAdmin, RequireStudent } from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Home from "./pages/Home.jsx";
import AdminTest from "./pages/AdminTest.jsx";
import StudentTest from "./pages/StudentTest.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminUserList from "./pages/AdminUserList.jsx";
import AdminUserProfile from "./pages/AdminUserProfile.jsx";

function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="container">Loading...</div>;
  }
  if (user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <Login />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuthed>
            <Register />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Home />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAdmin>
            <AdminUserList />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/users/:id"
        element={
          <RequireAdmin>
            <AdminUserProfile />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/test"
        element={
          <RequireAdmin>
            <AdminTest />
          </RequireAdmin>
        }
      />
      <Route
        path="/student/test"
        element={
          <RequireStudent>
            <StudentTest />
          </RequireStudent>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

