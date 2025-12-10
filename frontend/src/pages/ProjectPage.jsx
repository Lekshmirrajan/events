// frontend/src/pages/ProjectPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function ProjectPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    load();
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const load = async () => {
    try {
      const res = await axios.get(`/api/projects/${id}`);
      setProject(res.data);
    } catch (err) {
      console.error("Failed to load project:", err);
      setProject(null);
      alert("Could not load project. Check console for details.");
    }
  };

  const loadTasks = async () => {
    try {
      const res = await axios.get(`/api/projects/${id}/tasks`);
      setTasks(res.data || []);
    } catch (err) {
      console.error("Failed to load tasks:", err);
      setTasks([]);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("Please enter a task title");
    const payload = { title, description: desc };
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    try {
      const res = await axios.post(`/api/projects/${id}/tasks`, payload, { headers });
      setTasks((prev) => [...prev, res.data]);
      setTitle(""); setDesc("");
    } catch (err) {
      console.error("Create task error:", err);
      const status = err?.response?.status;
      if (status === 401 && token) {
        // try fallback without auth
        try {
          const res2 = await axios.post(`/api/projects/${id}/tasks`, payload);
          setTasks((prev) => [...prev, res2.data]);
          setTitle(""); setDesc("");
          return;
        } catch (err2) {
          console.error("Fallback failed:", err2);
        }
      }
      alert(err?.response?.data?.error || "Error creating task");
    }
  };

  const updateStatus = async (taskId, status) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    try {
      await axios.patch(`/api/projects/${id}/tasks/${taskId}`, { status }, { headers });
      await loadTasks();
    } catch (err) {
      console.error("Update status error:", err);
      alert(err?.response?.data?.error || "Error updating task status");
    }
  };

  if (!project) return <div>Loading project…</div>;

  return (
    <>
      <h2>{project.title}</h2>
      <p>{project.description}</p>

      <section>
        <h3>Add Task</h3>
        <form onSubmit={createTask} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" required />
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Task description" />
          <button type="submit">Add Task</button>
        </form>
      </section>

      <section style={{ marginTop: 16 }}>
        <h3>Tasks</h3>
        <ul>
          {tasks.length === 0 && <div>No tasks yet</div>}
          {tasks.map((t) => (
            <li key={t.id} style={{ marginBottom: 10 }}>
              <strong>{t.title}</strong> <small>({t.status || "todo"})</small>
              <div>{t.description}</div>
              <div style={{ marginTop: 6 }}>
                <button onClick={() => updateStatus(t.id, "todo")}>Todo</button>{" "}
                <button onClick={() => updateStatus(t.id, "in-progress")}>In Progress</button>{" "}
                <button onClick={() => updateStatus(t.id, "done")}>Done</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
