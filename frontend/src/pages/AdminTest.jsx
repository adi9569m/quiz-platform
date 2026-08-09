import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import apiClient from "../api/client.js";

export default function AdminTest() {
  const { user } = useAuth();
  const [responseMsg, setResponseMsg] = useState("");
  const [status, setStatus] = useState(null);

  useEffect(() => {
    apiClient
      .get("/admin/test")
      .then((res) => {
        setResponseMsg(res.data.message);
        setStatus(res.status);
      })
      .catch((err) => {
        setResponseMsg(err.response?.data?.message || "Request failed");
        setStatus(err.response?.status || 500);
      });
  }, []);

  return (
    <div className="container">
      <div className="card">
        <h1>Admin Authorization Test Route</h1>
        <p>Logged in as: {user?.name} ({user?.role})</p>
        <div>
          <p><strong>API Response Code:</strong> {status}</p>
          <p><strong>API Message:</strong> {responseMsg}</p>
        </div>
      </div>
    </div>
  );
}
