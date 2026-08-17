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
    <AdminLayout>
      <div className="form-card-container">
        <div style={{ marginBottom: "16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800, color: "var(--color-text-main)", lineHeight: 1.2 }}>
              Create New Quiz
            </h1>
            <p className="muted" style={{ margin: "3px 0 0", fontSize: "0.84rem" }}>
              Create a quiz, configure its settings, and save it as a draft.
            </p>
          </div>
          <div>
            <Link to="/admin/quizzes" className="btn btn-outline btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              &larr; Back to Quiz Management
            </Link>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "24px 28px",
            background: "#ffffff",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {error && (
            <div className="alert alert-error" style={{ marginBottom: "20px" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h2 className="form-section-title">Quiz Information</h2>
              <p className="form-section-desc">
                Provide a clear title and an optional summary of what this examination covers.
              </p>

              <div className="form-group">
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

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="form-input"
                  placeholder="Briefly describe what this quiz covers..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-section">
              <h2 className="form-section-title">Quiz Settings</h2>
              <p className="form-section-desc">
                Configure the subject category, difficulty level, examination timer, passing threshold, and attempt limits.
              </p>

              <div className="form-grid-2col" style={{ marginBottom: "18px" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
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

                <div className="form-group" style={{ marginBottom: 0 }}>
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

              <div className="form-grid-3col">
                <div className="form-group" style={{ marginBottom: 0 }}>
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

                <div className="form-group" style={{ marginBottom: 0 }}>
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

                <div className="form-group" style={{ marginBottom: 0 }}>
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
            </div>

            <div className="form-footer-bar">
              <span className="muted" style={{ fontSize: "0.82rem" }}>
                New quizzes are saved as drafts and can be published from Quiz Management.
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Link to="/admin/quizzes" className="btn btn-outline" style={{ height: "44px", padding: "0 18px", display: "inline-flex", alignItems: "center" }}>
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ height: "44px", padding: "0 20px", fontWeight: 700 }}
                  disabled={submitting}
                >
                  {submitting ? "Creating Quiz..." : "Create Quiz · Save Draft"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
