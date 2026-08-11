import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import apiClient from "../api/client.js";

export default function AdminQuestionCreate() {
  const { quiz_id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [questionText, setQuestionText] = useState("");
  const [marks, setMarks] = useState(1);
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctKey, setCorrectKey] = useState("A");

  useEffect(() => {
    fetchQuiz();
  }, [quiz_id]);

  const fetchQuiz = async () => {
    try {
      const res = await apiClient.get(`/quizzes/${quiz_id}`);
      setQuiz(res.data.quiz);
    } catch (err) {
      setError(err.response?.data?.message || "Quiz not found.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!questionText.trim()) {
      setError("Question text is required.");
      return;
    }

    if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
      setError("All four options (A, B, C, D) are required.");
      return;
    }

    if (marks <= 0) {
      setError("Marks must be a positive integer greater than 0.");
      return;
    }

    const payload = {
      question_text: questionText.trim(),
      question_type: "MCQ",
      marks: parseInt(marks, 10),
      options: [
        { key: "A", text: optionA.trim(), is_correct: correctKey === "A" },
        { key: "B", text: optionB.trim(), is_correct: correctKey === "B" },
        { key: "C", text: optionC.trim(), is_correct: correctKey === "C" },
        { key: "D", text: optionD.trim(), is_correct: correctKey === "D" },
      ],
    };

    setSaving(true);
    try {
      await apiClient.post(`/quizzes/${quiz_id}/questions`, payload);
      navigate(`/admin/quizzes/${quiz_id}/questions`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create question.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title={quiz ? `Add Question — ${quiz.title}` : "Add Question"}>
      <div className="card" style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ marginBottom: "1rem" }}>
          <Link to={`/admin/quizzes/${quiz_id}/questions`} style={{ color: "var(--color-primary)", textDecoration: "none" }}>
            &larr; Back to Quiz Questions
          </Link>
        </div>

        <h2>Add Multiple Choice Question (MCQ)</h2>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
          Provide the question text, four options, select the single correct answer, and set the question marks.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <p>Loading quiz details...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Question Text */}
            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label className="form-label">Question Text *</label>
              <textarea
                className="form-control"
                rows="4"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="e.g. What is the capital of India?"
                required
              />
            </div>

            {/* Marks & Type Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div className="form-group">
                <label className="form-label">Question Type</label>
                <input type="text" className="form-control" value="MCQ" disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Marks *</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* MCQ Options */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label className="form-label" style={{ marginBottom: "0.75rem", display: "block" }}>
                Multiple Choice Options (Select Correct Answer) *
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {/* Option A */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <input
                    type="radio"
                    id="correct_A"
                    name="correct_option"
                    checked={correctKey === "A"}
                    onChange={() => setCorrectKey("A")}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <label htmlFor="correct_A" style={{ fontWeight: "bold", width: "80px", cursor: "pointer" }}>
                    Option A
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={optionA}
                    onChange={(e) => setOptionA(e.target.value)}
                    placeholder="Enter Option A text"
                    required
                  />
                </div>

                {/* Option B */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <input
                    type="radio"
                    id="correct_B"
                    name="correct_option"
                    checked={correctKey === "B"}
                    onChange={() => setCorrectKey("B")}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <label htmlFor="correct_B" style={{ fontWeight: "bold", width: "80px", cursor: "pointer" }}>
                    Option B
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={optionB}
                    onChange={(e) => setOptionB(e.target.value)}
                    placeholder="Enter Option B text"
                    required
                  />
                </div>

                {/* Option C */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <input
                    type="radio"
                    id="correct_C"
                    name="correct_option"
                    checked={correctKey === "C"}
                    onChange={() => setCorrectKey("C")}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <label htmlFor="correct_C" style={{ fontWeight: "bold", width: "80px", cursor: "pointer" }}>
                    Option C
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={optionC}
                    onChange={(e) => setOptionC(e.target.value)}
                    placeholder="Enter Option C text"
                    required
                  />
                </div>

                {/* Option D */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <input
                    type="radio"
                    id="correct_D"
                    name="correct_option"
                    checked={correctKey === "D"}
                    onChange={() => setCorrectKey("D")}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <label htmlFor="correct_D" style={{ fontWeight: "bold", width: "80px", cursor: "pointer" }}>
                    Option D
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={optionD}
                    onChange={(e) => setOptionD(e.target.value)}
                    placeholder="Enter Option D text"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <Link to={`/admin/quizzes/${quiz_id}/questions`} className="btn btn-outline">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving Question..." : "Save Question"}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
