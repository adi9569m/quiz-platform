import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="container">
      <div className="card">
        <h1>Welcome, {user?.name}!</h1>
        <p className="muted">You are logged in to the Quiz Platform.</p>
        <ul className="user-info">
          <li>
            <strong>Name:</strong> {user?.name}
          </li>
          <li>
            <strong>Email:</strong> {user?.email}
          </li>
          <li>
            <strong>Role:</strong> {user?.role}
          </li>
          <li>
            <strong>Status:</strong> {user?.status}
          </li>
        </ul>
        <button type="button" className="btn btn-secondary" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
}
