// frontend/src/App.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./index.css";

/* ----------------- AuthPanel ----------------- */
function AuthPanel({ mode, onSwitch, onAuthSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    setServerError("");
  }, [mode]);

  const submit = async (e) => {
    e.preventDefault();
    setServerError("");
    setLoading(true);
    try {
      const url = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const body = mode === "signup" ? { name, email, password } : { email, password };
      const res = await axios.post(url, body);
      if (res && res.data && res.data.token) {
        localStorage.setItem("token", res.data.token);
        onAuthSuccess(res.data.user || { email });
      } else {
        setServerError("No token returned");
      }
    } catch (err) {
      console.error("Auth error:", err);
      const msg =
        err && err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : err && err.message
            ? err.message
            : "Auth failed";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h3 className="auth-title">{mode === "signup" ? "Create an account" : "Welcome back"}</h3>

      <form onSubmit={submit} className="auth-form">
        {mode === "signup" && (
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required />
        )}
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />
        <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required />

        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? (mode === "signup" ? "Signing up…" : "Logging in…") : (mode === "signup" ? "Sign up" : "Log in")}
        </button>

        {serverError && <div className="error">{serverError}</div>}
      </form>

      <div className="auth-footer">
        {mode === "signup" ? "Already have an account?" : "Don't have an account?"}
        <button className="link-btn" type="button" onClick={onSwitch}>
          {mode === "signup" ? "Log in" : "Sign up"}
        </button>
      </div>
    </div>
  );
}

/* ----------------- Landing ----------------- */
function Landing({ onGetStarted }) {
  return (
    <div className="hero">
      <div className="hero-inner">
        <div>
          <h1 className="hero-title">Simple, beautiful Task Manager</h1>
          <p className="hero-sub">Create projects, add tasks, collaborate — quick demo for your submission.</p>
          <div style={{ marginTop: 18 }}>
            <button className="btn primary" type="button" onClick={() => onGetStarted("signup")}>Get started</button>
            <button className="btn ghost" type="button" onClick={() => onGetStarted("login")}>Login</button>
          </div>
        </div>
        <div className="hero-preview">
          <div className="card-preview">
            <h4>Project</h4>
            <p className="muted">Add project title, then tasks. Status: todo → in-progress → done</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------- AppMain (full) ----------------- */
function AppMain({ onLogout }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [activeProject, setActiveProject] = useState(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/projects");
      setProjects(res.data || []);
    } catch (err) {
      console.error("Load projects:", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newTitle.trim()) return alert("Add a project title");
    try {
      const res = await axios.post("/api/projects", { title: newTitle, description: newDesc });
      setProjects((p) => [...p, res.data]);
      setNewTitle("");
      setNewDesc("");
    } catch (err) {
      console.error("Create project error:", err);
      alert(err && err.response && err.response.data && err.response.data.error ? err.response.data.error : "Could not create project");
    }
  };

  const openProject = async (p) => {
    setActiveProject({ ...p, tasks: [] });
    try {
      const res = await axios.get(`/api/projects/${p.id}/tasks`);
      setActiveProject((prev) => ({ ...prev, tasks: res.data || [] }));
    } catch (err) {
      console.error("Load tasks error:", err);
      setActiveProject((prev) => ({ ...prev, tasks: [] }));
    }
  };

  const createTask = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!taskTitle.trim()) return alert("Add task title");
    try {
      const res = await axios.post(`/api/projects/${activeProject.id}/tasks`, { title: taskTitle, description: taskDesc });
      setActiveProject((ap) => ({ ...ap, tasks: [...(ap.tasks || []), res.data] }));
      setTaskTitle("");
      setTaskDesc("");
    } catch (err) {
      console.error("Create task error:", err);
      alert(err && err.response && err.response.data && err.response.data.error ? err.response.data.error : "Could not create task");
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      await axios.patch(`/api/projects/${activeProject.id}/tasks/${taskId}`, { status });
      // reload tasks
      const res = await axios.get(`/api/projects/${activeProject.id}/tasks`);
      setActiveProject((ap) => ({ ...ap, tasks: res.data || [] }));
    } catch (err) {
      console.error("Update status error:", err);
      alert(err && err.response && err.response.data && err.response.data.error ? err.response.data.error : "Update failed");
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    try {
      await axios.delete(`/api/projects/${id}`);
      setProjects((p) => p.filter(x => x.id !== id));
      setActiveProject(null);
    } catch (err) {
      console.error("Delete project error:", err);
      alert(err && err.response && err.response.data && err.response.data.error ? err.response.data.error : "Delete failed");
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <h3>Your Projects</h3>
          <div className="projects-list">
            {loading ? <div>Loading…</div> :
              projects.length === 0 ? <div className="muted">No projects yet</div> :
              projects.map(p => (
                <div key={p.id} className="project-card" onClick={() => openProject(p)}>
                  <div className="proj-title">{p.title}</div>
                  <div className="proj-sub muted">{p.description}</div>
                </div>
              ))
            }
          </div>
        </div>

        <div className="sidebar-bottom">
          <form onSubmit={createProject} className="create-project-form">
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Project title" />
            <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Project description (optional)"></textarea>
            <button className="btn primary small" type="submit">Add Project</button>
          </form>

          <button className="btn ghost small" onClick={() => { localStorage.removeItem("token"); onLogout(); }}>Logout</button>
        </div>
      </aside>

      <main className="main">
        {!activeProject ? (
          <div className="empty-state">
            <h2>Pick or create a project</h2>
            <p className="muted">Click a project on the left or create a new one to start adding tasks.</p>
          </div>
        ) : (
          <div className="project-detail">
            <header className="project-header">
              <h2>{activeProject.title}</h2>
              <div>
                <button className="btn ghost" onClick={() => deleteProject(activeProject.id)}>Delete Project</button>
              </div>
            </header>

            <p className="muted">{activeProject.description}</p>

            <section className="task-form">
              <h3>Add Task</h3>
              <form onSubmit={createTask} style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task title" />
                <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="Task description (optional)"></textarea>
                <button className="btn primary small" type="submit">Add Task</button>
              </form>
            </section>

            <section className="task-list">
              <h3>Tasks</h3>
              {(!activeProject.tasks || activeProject.tasks.length === 0) ? <div className="muted">No tasks yet</div> :
                activeProject.tasks.map(t => (
                  <div key={t.id} className="task-item">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong>{t.title}</strong>
                        <div className="muted">{t.description}</div>
                      </div>
                      <div className="task-actions">
                        <button className="btn small" onClick={() => updateStatus(t.id, "todo")}>Todo</button>
                        <button className="btn small" onClick={() => updateStatus(t.id, "in-progress")}>In progress</button>
                        <button className="btn small" onClick={() => updateStatus(t.id, "done")}>Done</button>
                      </div>
                    </div>
                    <div className="task-meta muted">Status: {t.status || "todo"}</div>
                  </div>
                ))
              }
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

/* ----------------- Top-level App ----------------- */
export default function App() {
  const [view, setView] = useState("landing"); // landing | auth | app
  const [authMode, setAuthMode] = useState("signup"); // signup | login
  const [user, setUser] = useState(null);

  useEffect(() => {
    // check token presence
    const token = localStorage.getItem("token");
    if (token) {
      setUser({});
      setView("app");
    }
  }, []);

  const handleGetStarted = (mode) => {
    setAuthMode(mode);
    setView("auth");
  };

  const handleAuthSuccess = (u) => {
    setUser(u || {});
    setView("app");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setView("landing");
  };

  return (
    <div>
      {view === "landing" && <Landing onGetStarted={handleGetStarted} />}
      {view === "auth" && (
        <div className="page-center">
          <AuthPanel
            mode={authMode}
            onSwitch={() => setAuthMode(authMode === "signup" ? "login" : "signup")}
            onAuthSuccess={handleAuthSuccess}
          />
        </div>
      )}
      {view === "app" && <AppMain onLogout={handleLogout} />}
    </div>
  );
}
