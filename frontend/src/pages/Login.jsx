// frontend/src/pages/Login.jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const nav = useNavigate();

  // optional: set baseURL if your frontend needs it in production
  // axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || "";

  const submit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!email || !password) {
      setServerError("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      if (res?.data?.token) {
        localStorage.setItem("token", res.data.token);
        nav("/");
      } else {
        setServerError("Login succeeded but no token returned");
        console.warn("Login response:", res);
      }
    } catch (err) {
      console.error("Login error:", err);

      // user-friendly message from server if available
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Login failed";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "24px auto" }}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2>Login</h2>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
          type="email"
          required
          style={{ padding: 8 }}
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          type="password"
          required
          style={{ padding: 8 }}
        />

        <button type="submit" disabled={loading} style={{ padding: 10 }}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {serverError && (
          <div style={{ marginTop: 8, color: "crimson" }}>
            {serverError}
          </div>
        )}
      </form>
    </div>
  );
}
