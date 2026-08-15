import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/client.js";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) {
      nextErrors.name = "Name is required";
    }
    if (!form.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address";
    }
    if (!form.password) {
      nextErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }
    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Passwords do not match";
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

    setSubmitting(true);
    try {
      await apiClient.post("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate("/login", { state: { registered: true } });
    } catch (error) {
      setFormError(
        error.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* Left Blue Hero Banner */}
      <div className="auth-hero-panel">
        <div className="auth-hero-content">
          <div className="auth-hero-icon">✳</div>
          <h1 className="auth-hero-title">
            Join<br />
            QuizDesk! 🚀
          </h1>
          <p className="auth-hero-desc">
            Create your account to access published tests, review solutions, and boost your exam performance!
          </p>
        </div>

        <div className="auth-hero-footer">
          © 2026 QuizDesk. All rights reserved.
        </div>
      </div>

      {/* Right Registration Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-brand-logo">
          QuizDesk
        </div>

        <h2 className="auth-title">Create Account!</h2>
        <p className="auth-subtitle">
          Already have an account?{" "}
          <Link to="/login">Log in to your account now.</Link>
        </p>

        {formError && <div className="alert alert-error">{formError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-input-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              className="auth-input-field"
              value={form.name}
              onChange={handleChange}
              placeholder="Full name"
              style={{
                borderColor: errors.name ? "var(--color-danger)" : undefined,
              }}
            />
            {errors.name && <span className="error">{errors.name}</span>}
          </div>

          <div className="auth-input-group">
            <label htmlFor="email">Email Address</label>
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
              placeholder="At least 8 characters"
              style={{
                borderColor: errors.password ? "var(--color-danger)" : undefined,
              }}
            />
            {errors.password && <span className="error">{errors.password}</span>}
          </div>

          <div className="auth-input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="auth-input-field"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              style={{
                borderColor: errors.confirmPassword ? "var(--color-danger)" : undefined,
              }}
            />
            {errors.confirmPassword && (
              <span className="error">{errors.confirmPassword}</span>
            )}
          </div>

          <button type="submit" className="btn-auth-submit" disabled={submitting}>
            {submitting ? "Creating Account..." : "Create Account Now"}
          </button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "0.92rem", color: "#64748b" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#0f172a", fontWeight: 700 }}>
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
