import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/client.js";
import AdminLayout from "../components/AdminLayout.jsx";

const PREDEFINED_CATEGORIES = [
  "Geography",
  "Indian History",
  "Programming",
  "General Knowledge (GK)",
  "Trivia",
];

export default function AdminQuizCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "Geography",
    difficulty: "EASY",
    duration: 30,
    passing_score: 40,
    max_attempts: 3,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await apiClient.post("/quizzes", {
        ...formData,
        duration: parseInt(formData.duration, 10),
        passing_score: parseInt(formData.passing_score, 10),
        max_attempts: parseInt(formData.max_attempts, 10),
      });

      navigate("/admin/quizzes");
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.errors && Array.isArray(resp.errors)) {
        setError(resp.errors.join(" "));
      } else {
        setError(resp?.message || "Failed to create quiz.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Create New Quiz">
      <div className="form-container card" style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <Link to="/admin/quizzes" className="text-link">
            &larr; Back to Quiz Management
          </Link>
          <h2 style={{ marginTop: "0.5rem" }}>Quiz Details</h2>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label htmlFor="title" className="form-label">
              Quiz Title <span className="text-danger">*</span>
            </label>
            <input
              id="title"
              type="text"
              name="title"
              className="form-input"
              placeholder="e.g. World Geography Challenge"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group mb-3">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              className="form-input"
              rows={3}
              placeholder="Brief description of the quiz..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group mb-3">
              <label htmlFor="category_id" className="form-label">
                Category <span className="text-danger">*</span>
              </label>
              <select
                id="category_id"
                name="category_id"
                className="form-input"
                value={formData.category_id}
                onChange={handleChange}
                required
              >
                {PREDEFINED_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group mb-3">
              <label htmlFor="difficulty" className="form-label">
                Difficulty Level <span className="text-danger">*</span>
              </label>
              <select
                id="difficulty"
                name="difficulty"
                className="form-input"
                value={formData.difficulty}
                onChange={handleChange}
                required
              >
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>
          </div>

          <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div className="form-group mb-3">
              <label htmlFor="duration" className="form-label">
                Duration (minutes) <span className="text-danger">*</span>
              </label>
              <input
                id="duration"
                type="number"
                name="duration"
                className="form-input"
                min="1"
                value={formData.duration}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="passing_score" className="form-label">
                Passing Score (%) <span className="text-danger">*</span>
              </label>
              <input
                id="passing_score"
                type="number"
                name="passing_score"
                className="form-input"
                min="0"
                max="100"
                value={formData.passing_score}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="max_attempts" className="form-label">
                Max Attempts <span className="text-danger">*</span>
              </label>
              <input
                id="max_attempts"
                type="number"
                name="max_attempts"
                className="form-input"
                min="1"
                value={formData.max_attempts}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1.5rem" }}>
            <Link to="/admin/quizzes" className="btn btn-outline">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Creating Quiz..." : "Create Quiz (Save Draft)"}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
