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
    <div className="container">
      <div className="card">
        <h1>Log in</h1>
        {location.state?.registered && (
          <div className="alert alert-success">
            Registration successful. You can now log in.
          </div>
        )}
        {formError && <div className="alert alert-error">{formError}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Your password"
            />
            {errors.password && <span className="error">{errors.password}</span>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
        <p className="muted">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
