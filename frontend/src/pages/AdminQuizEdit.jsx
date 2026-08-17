import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import apiClient from "../api/client.js";
import AdminLayout from "../components/AdminLayout.jsx";

const PREDEFINED_CATEGORIES = [
  "Geography",
  "Indian History",
  "Programming",
  "General Knowledge (GK)",
  "Trivia",
];

export default function AdminQuizEdit() {
  const { id } = useParams();
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

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(`/quizzes/${id}`);
      const quiz = data.quiz;
      setFormData({
        title: quiz.title || "",
        description: quiz.description || "",
        category_id: quiz.category || quiz.category_id || "Geography",
        difficulty: quiz.difficulty || "EASY",
        duration: quiz.duration || 30,
        passing_score: quiz.passing_score || 40,
        max_attempts: quiz.max_attempts || 3,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load quiz details.");
    } finally {
      setLoading(false);
    }
  };

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
      await apiClient.put(`/quizzes/${id}`, {
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
        setError(resp?.message || "Failed to update quiz.");
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
              Edit Quiz Details
            </h1>
            <p className="muted" style={{ margin: "3px 0 0", fontSize: "0.84rem" }}>
              Update title, description, category, and evaluation settings for this quiz.
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

          {loading ? (
            <div className="loading-spinner" style={{ padding: "3rem 0" }}>
              Loading quiz data...
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h2 className="form-section-title">Quiz Information</h2>
                <p className="form-section-desc">
                  Update the title and description for this examination.
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
                  Changes will update the existing quiz configuration immediately.
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
                    {submitting ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
