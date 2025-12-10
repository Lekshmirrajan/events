// backend/index.js
// In-memory backend with JWT auth (signup/login) + protected project/task creation
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";
const PORT = process.env.PORT || 5000;

// In-memory storage
let users = []; // { id, name, email, password_hash }
let nextUserId = 1;

let projects = [
  { id: 1, title: "Sample Project", description: "Demo", ownerId: null, createdAt: new Date() }
];
let nextProjectId = 2;

let tasks = []; // { id, projectId, title, description, status, createdAt, ownerId }
let nextTaskId = 1;

// Helper: create JWT
function makeToken(user) {
  // minimal payload
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
}

// Auth middleware
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No authorization header" });
  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return res.status(401).json({ error: "Invalid authorization format" });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // attach user object (without password hash)
    const user = users.find((u) => u.id === payload.id);
    if (!user) return res.status(401).json({ error: "Invalid token (user not found)" });
    req.user = { id: user.id, name: user.name, email: user.email };
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* ---------- AUTH ROUTES ---------- */

// Signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const exists = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (exists) return res.status(400).json({ error: "Email already in use" });

    const hash = await bcrypt.hash(password, 10);
    const user = { id: nextUserId++, name: name || "", email: String(email).toLowerCase(), password_hash: hash };
    users.push(user);

    const token = makeToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = users.find((u) => u.email === String(email).toLowerCase());
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    const token = makeToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

/* ---------- PROJECT + TASK ROUTES ---------- */

// Basic health
app.get("/", (req, res) => res.json({ message: "Backend running (in-memory + auth)" }));

// Get projects (public)
app.get("/api/projects", (req, res) => res.json(projects));

// Create project (protected)
app.post("/api/projects", authMiddleware, (req, res) => {
  try {
    const { title, description } = req.body || {};
    if (!title || String(title).trim() === "") return res.status(400).json({ error: "Title required" });
    const proj = { id: nextProjectId++, title: String(title), description: description || "", ownerId: req.user.id, createdAt: new Date() };
    projects.push(proj);
    res.status(201).json(proj);
  } catch (err) {
    console.error("Create project error:", err);
    res.status(500).json({ error: "Could not create project" });
  }
});

// Get a single project (public)
app.get("/api/projects/:projectId", (req, res) => {
  const pid = Number(req.params.projectId);
  const p = projects.find((x) => x.id === pid);
  if (!p) return res.status(404).json({ error: "Project not found" });
  res.json(p);
});

// Get tasks for a project (public)
app.get("/api/projects/:projectId/tasks", (req, res) => {
  const pid = Number(req.params.projectId);
  const list = tasks.filter((t) => t.projectId === pid);
  res.json(list);
});

// Create task for a project (protected)
app.post("/api/projects/:projectId/tasks", authMiddleware, (req, res) => {
  try {
    const pid = Number(req.params.projectId);
    const project = projects.find((p) => p.id === pid);
    if (!project) return res.status(404).json({ error: "Project not found" });
    const { title, description } = req.body || {};
    if (!title || String(title).trim() === "") return res.status(400).json({ error: "Task title required" });
    const t = { id: nextTaskId++, projectId: pid, title: String(title), description: description || "", status: "todo", createdAt: new Date(), ownerId: req.user.id };
    tasks.push(t);
    res.status(201).json(t);
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ error: "Could not create task" });
  }
});

// Update task status (protected, simplified)
app.patch("/api/projects/:projectId/tasks/:taskId", authMiddleware, (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    const { status, title, description } = req.body || {};
    if (status) task.status = status;
    if (title) task.title = title;
    if (description) task.description = description;
    res.json(task);
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ error: "Could not update task" });
  }
});

// Delete task (protected)
app.delete("/api/projects/:projectId/tasks/:taskId", authMiddleware, (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return res.status(404).json({ error: "Task not found" });
    tasks.splice(idx, 1);
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ error: "Could not delete task" });
  }
});

// Delete project (protected, owner-only)
app.delete("/api/projects/:projectId", authMiddleware, (req, res) => {
  try {
    const pid = Number(req.params.projectId);
    const idx = projects.findIndex(p => p.id === pid);
    if (idx === -1) return res.status(404).json({ error: "Project not found" });
    const project = projects[idx];
    if (project.ownerId !== req.user.id) return res.status(403).json({ error: "Forbidden" });
    projects.splice(idx, 1);
    // remove related tasks
    tasks = tasks.filter(t => t.projectId !== pid);
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ error: "Could not delete project" });
  }
});

app.listen(PORT, () => console.log(`Backend running (in-memory + auth) on port ${PORT}`));
