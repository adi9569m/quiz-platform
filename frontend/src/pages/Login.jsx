import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login, loading } = useAuth();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.email.trim()) {
      nextErrors.email = "Email is required";
    }
    if (!form.password) {
      nextErrors.password = "Password is required";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) {
      return;
    }

    const result = await login(form.email.trim(), form.password);
    if (!result.ok) {
      setFormError(result.message);
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* Left Blue Hero Banner */}
      <div className="auth-hero-panel">
        <div className="auth-hero-content">
          <div className="auth-hero-icon">✳</div>
          <h1 className="auth-hero-title">
            Hello<br />
            QuizDesk! 👋
          </h1>
          <p className="auth-hero-desc">
            Master your exams with interactive quizzes, instant analytics, and smart performance tracking!
          </p>
        </div>

        <div className="auth-hero-footer">
          © 2026 QuizDesk. All rights reserved.
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-brand-logo">
          QuizDesk
        </div>

        <h2 className="auth-title">Welcome Back!</h2>
        <p className="auth-subtitle">
          Please enter your credentials to log in to your account.
        </p>

        {location.state?.registered && (
          <div className="alert alert-success">
            Registration successful. You can now log in.
          </div>
        )}

        {formError && <div className="alert alert-error">{formError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="auth-input-field"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              style={{
                borderColor: errors.email ? "var(--color-danger)" : undefined,
              }}
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>

          <div className="auth-input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="auth-input-field"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              style={{
                borderColor: errors.password ? "var(--color-danger)" : undefined,
              }}
            />
            {errors.password && <span className="error">{errors.password}</span>}
          </div>

          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? "Logging in..." : "Login Now"}
          </button>
        </form>

        {/* Create account link placed directly below Login Now button */}
        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "0.92rem", color: "#64748b" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "#0f172a", fontWeight: 700 }}>
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
