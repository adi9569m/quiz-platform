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
      <div className="auth-hero-panel">
        <div className="auth-hero-content">
          <h1 className="auth-hero-title">
            Master Every<br />
            Quiz & Exam!
          </h1>
          <p className="auth-hero-desc">
            Quizzz Up provides interactive examinations, instant scoring, question reviews, and competitive leaderboards.
          </p>
        </div>

        <div className="auth-hero-footer">
          © 2026 Quizzz Up — Online Quiz & Assessment Platform
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-box">
          <div className="auth-brand-logo">
            Quizzz <span style={{ color: "var(--color-primary)" }}>Up</span>
          </div>

          <h2 className="auth-title">Welcome Back!</h2>
          <p className="auth-subtitle">
            Please enter your credentials to log in to your account.
          </p>

          {location.state?.registered && (
            <div className="alert alert-success" style={{ marginBottom: "16px" }}>
              Registration successful. You can now log in.
            </div>
          )}

          {formError && (
            <div className="alert alert-error" style={{ marginBottom: "16px" }}>
              {formError}
            </div>
          )}

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

          <div style={{ marginTop: "24px", textAlign: "center", fontSize: "0.92rem", color: "#64748b" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "var(--color-primary)", fontWeight: 700 }}>
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
