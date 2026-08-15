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
import AdminQuizList from "./pages/AdminQuizList.jsx";
import AdminQuizCreate from "./pages/AdminQuizCreate.jsx";
import AdminQuizEdit from "./pages/AdminQuizEdit.jsx";
import AdminCategoryList from "./pages/AdminCategoryList.jsx";
import AdminQuizQuestions from "./pages/AdminQuizQuestions.jsx";
import AdminQuestionCreate from "./pages/AdminQuestionCreate.jsx";
import AdminQuestionEdit from "./pages/AdminQuestionEdit.jsx";
import StudentQuizList from "./pages/StudentQuizList.jsx";
import StudentQuizDetail from "./pages/StudentQuizDetail.jsx";
import StudentQuizAttempt from "./pages/StudentQuizAttempt.jsx";
import StudentQuizResult from "./pages/StudentQuizResult.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";

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
        path="/student/dashboard"
        element={
          <RequireStudent>
            <StudentDashboard />
          </RequireStudent>
        }
      />
      <Route
        path="/student/quizzes"
        element={
          <RequireStudent>
            <StudentQuizList />
          </RequireStudent>
        }
      />
      <Route
        path="/student/quizzes/:quizId"
        element={
          <RequireStudent>
            <StudentQuizDetail />
          </RequireStudent>
        }
      />
      <Route
        path="/student/quizzes/:quizId/attempt/:attemptId"
        element={
          <RequireStudent>
            <StudentQuizAttempt />
          </RequireStudent>
        }
      />
      <Route
        path="/student/quizzes/:quizId/result/:attemptId"
        element={
          <RequireStudent>
            <StudentQuizResult />
          </RequireStudent>
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
        path="/admin/categories"
        element={
          <RequireAdmin>
            <AdminCategoryList />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/quizzes"
        element={
          <RequireAdmin>
            <AdminQuizList />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/quizzes/new"
        element={
          <RequireAdmin>
            <AdminQuizCreate />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/quizzes/:id/edit"
        element={
          <RequireAdmin>
            <AdminQuizEdit />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/quizzes/:quiz_id/questions"
        element={
          <RequireAdmin>
            <AdminQuizQuestions />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/quizzes/:quiz_id/questions/new"
        element={
          <RequireAdmin>
            <AdminQuestionCreate />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/questions/:id/edit"
        element={
          <RequireAdmin>
            <AdminQuestionEdit />
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
