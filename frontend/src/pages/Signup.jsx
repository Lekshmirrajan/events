// frontend/src/pages/Signup.jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!name || !email || !password) {
      setServerError("All fields are required");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/api/auth/signup", { name, email, password });
      if (res?.data?.token) {
        localStorage.setItem("token", res.data.token);
        nav("/");
      } else {
        setServerError("Signup succeeded but no token returned");
        console.warn("Signup response:", res);
      }
    } catch (err) {
      console.error("Signup error:", err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Signup failed";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "24px auto" }}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2>Signup</h2>

        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="name" required style={{ padding: 8 }} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" type="email" required style={{ padding: 8 }} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" required style={{ padding: 8 }} />

        <button type="submit" disabled={loading} style={{ padding: 10 }}>
          {loading ? "Signing up..." : "Signup"}
        </button>

        {serverError && <div style={{ marginTop: 8, color: "crimson" }}>{serverError}</div>}
      </form>
    </div>
  );
}
