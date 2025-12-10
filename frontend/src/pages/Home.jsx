// frontend/src/pages/Home.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // optional: set axios base url if you deployed backend or need absolute path
  // axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || "";

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await axios.get("/api/projects");
      setProjects(res.data || []);
    } catch (err) {
      console.error("GET /api/projects failed:", err);
      setErrorMsg("Could not load projects (see console).");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const create = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const token = localStorage.getItem("token");

    if (!title.trim()) return alert("Please add a project title");

    const payload = { title, description: desc };

    // try with token if present; otherwise try without (useful for in-memory backend)
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    try {
      const res = await axios.post("/api/projects", payload, { headers });
      setProjects(prev => [...prev, res.data]);
      setTitle("");
      setDesc("");
    } catch (err) {
      console.error("POST /api/projects failed:", err);

      // if 401 and we tried with token, fallback to try without token
      const status = err?.response?.status;
      if (status === 401 && token) {
        try {
          const res2 = await axios.post("/api/projects", payload);
          setProjects(prev => [...prev, res2.data]);
          setTitle(""); setDesc("");
          return;
        } catch (err2) {
          console.error("Fallback create (no token) failed:", err2);
        }
      }

      const msg = err?.response?.data?.error || err?.message || "Error creating project";
      setErrorMsg(msg);
      alert(msg);
    }
  };

  return (
    <>
      <section>
        <h2>Create Project</h2>
        <form onSubmit={create} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" />
          <button type="submit">Create</button>
        </form>
        {errorMsg && <div style={{ color: "crimson", marginTop: 8 }}>{errorMsg}</div>}
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>Projects</h2>
        {loading ? (
          <div>Loading…</div>
        ) : projects.length === 0 ? (
          <div>No projects yet</div>
        ) : (
          <ul>
            {projects.map(p => (
              <li key={p.id}><Link to={`/projects/${p.id}`}>{p.title}</Link></li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
