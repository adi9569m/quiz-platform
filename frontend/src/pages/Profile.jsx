import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import StudentLayout from "../components/StudentLayout.jsx";
import AdminLayout from "../components/AdminLayout.jsx";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(user);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [initialData, setInitialData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (user) {
      setProfileData(user);
      setFormData({ name: user.name || "", email: user.email || "" });
      setInitialData({ name: user.name || "", email: user.email || "" });
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setErrorMsg("");
      let response;
      try {
        response = await apiClient.get("/profile");
      } catch {
        response = await apiClient.get("/auth/profile");
      }
      const u = response.data?.user || user;
      if (u) {
        setProfileData(u);
        setFormData({ name: u.name || "", email: u.email || "" });
        setInitialData({ name: u.name || "", email: u.email || "" });
        updateUser(u);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setErrorMsg("Session expired. Please log in again.");
      } else if (!user) {
        setErrorMsg(err.response?.data?.message || "Failed to load account profile.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setErrorMsg("");
    setSuccessMsg("");
  };

  const validate = () => {
    const errors = {};
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedName) {
      errors.name = "Name is required.";
    } else if (trimmedName.length > 120) {
      errors.name = "Name must not exceed 120 characters.";
    }

    if (!trimmedEmail) {
      errors.email = "Email is required.";
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
      errors.email = "Please enter a valid email address.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!validate()) {
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
      };

      let response;
      try {
        response = await apiClient.put("/profile", payload);
      } catch (e1) {
        if (e1.response?.status === 404) {
          response = await apiClient.put("/auth/profile", payload);
        } else {
          throw e1;
        }
      }
      const updated = response.data?.user;

      if (updated) {
        setProfileData(updated);
        setFormData({ name: updated.name, email: updated.email });
        setInitialData({ name: updated.name, email: updated.email });
        updateUser(updated);
      }

      setSuccessMsg(response.data?.message || "Profile updated successfully!");
    } catch (err) {
      if (err.response?.status === 409) {
        setErrorMsg("The specified email address is already registered to another account.");
      } else if (err.response?.status === 401) {
        setErrorMsg("Unauthorized. Please log in again.");
      } else if (err.response?.status === 422 || err.response?.status === 400) {
        setErrorMsg(err.response?.data?.message || "Invalid profile data submitted.");
      } else {
        setErrorMsg(err.response?.data?.message || "An unexpected error occurred while updating your profile.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ ...initialData });
    setFieldErrors({});
    setErrorMsg("");
    setSuccessMsg("");
  };

  const formatMemberSince = (isoString) => {
    if (!isoString) return "-";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  const Layout = user?.role === "ADMIN" ? AdminLayout : StudentLayout;
  const currentStatus = profileData?.status || user?.status || "ACTIVE";
  const currentRole = profileData?.role || user?.role || "STUDENT";
  const memberSince = formatMemberSince(profileData?.created_at || user?.created_at);

  return (
    <Layout
      title="My Profile"
      subtitle="Manage your personal account details and preferences."
      action={
        user?.role === "STUDENT" ? (
          <Link to="/student/dashboard" className="btn btn-secondary btn-sm">
            &larr; Back to Dashboard
          </Link>
        ) : null
      }
    >
      <div className="container" style={{ paddingTop: user?.role === "ADMIN" ? "0" : "4px", paddingBottom: "36px", maxWidth: "800px" }}>
        {loading ? (
          <div className="card text-center" style={{ padding: "3.5rem 1rem", color: "var(--color-text-muted)" }}>
            <p style={{ margin: 0, fontSize: "1rem" }}>Loading account profile...</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {errorMsg && (
              <div className="alert alert-error" style={{ display: "block" }}>
                <div>{errorMsg}</div>
              </div>
            )}

            {successMsg && (
              <div className="alert alert-success" style={{ display: "block" }}>
                <div>{successMsg}</div>
              </div>
            )}

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
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", paddingBottom: "18px", borderBottom: "1px solid var(--color-border)" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: user?.role === "ADMIN" ? "linear-gradient(135deg, #2563eb, #1e40af)" : "linear-gradient(135deg, var(--color-primary), #1d4ed8)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.4rem",
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {(formData.name || profileData?.name || user?.name || "U").charAt(0).toUpperCase()}
                </div>

                <div>
                  <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", lineHeight: 1.2 }}>
                    {profileData?.name || user?.name}
                  </h2>
                  <div style={{ color: "var(--color-text-muted)", fontSize: "0.86rem", marginTop: "3px" }}>
                    {profileData?.email || user?.email}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "18px" }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="profile-name" style={{ display: "block", marginBottom: "6px", fontWeight: 700, fontSize: "0.88rem", color: "var(--color-text-main)" }}>
                      Full Name <span style={{ color: "var(--color-danger)" }}>*</span>
                    </label>
                    <input
                      id="profile-name"
                      name="name"
                      type="text"
                      className="auth-input-field"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      style={{
                        borderColor: fieldErrors.name ? "var(--color-danger)" : undefined,
                        width: "100%",
                      }}
                    />
                    {fieldErrors.name && (
                      <span className="error" style={{ display: "block", marginTop: "4px", fontSize: "0.8rem", color: "var(--color-danger)" }}>
                        {fieldErrors.name}
                      </span>
                    )}
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="profile-email" style={{ display: "block", marginBottom: "6px", fontWeight: 700, fontSize: "0.88rem", color: "var(--color-text-main)" }}>
                      Email Address <span style={{ color: "var(--color-danger)" }}>*</span>
                    </label>
                    <input
                      id="profile-email"
                      name="email"
                      type="email"
                      className="auth-input-field"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email address"
                      style={{
                        borderColor: fieldErrors.email ? "var(--color-danger)" : undefined,
                        width: "100%",
                      }}
                    />
                    {fieldErrors.email && (
                      <span className="error" style={{ display: "block", marginTop: "4px", fontSize: "0.8rem", color: "var(--color-danger)" }}>
                        {fieldErrors.email}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "14px",
                    marginTop: "24px",
                    padding: "16px 18px",
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.74rem", textTransform: "uppercase", fontWeight: 700, color: "var(--color-text-muted)", letterSpacing: "0.03em" }}>
                      Role
                    </div>
                    <div style={{ marginTop: "4px" }}>
                      <span
                        className="badge"
                        style={{
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                        }}
                      >
                        {currentRole}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.74rem", textTransform: "uppercase", fontWeight: 700, color: "var(--color-text-muted)", letterSpacing: "0.03em" }}>
                      Status
                    </div>
                    <div style={{ marginTop: "4px" }}>
                      <span
                        className={`badge ${currentStatus === "ACTIVE" ? "badge-success" : "badge-danger"}`}
                        style={{ fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px" }}
                      >
                        {currentStatus}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.74rem", textTransform: "uppercase", fontWeight: 700, color: "var(--color-text-muted)", letterSpacing: "0.03em" }}>
                      Member Since
                    </div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--color-text-main)", marginTop: "4px" }}>
                      {memberSince}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "24px",
                    paddingTop: "18px",
                    borderTop: "1px solid var(--color-border)",
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                    id="save-profile-btn"
                  >
                    {saving ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
