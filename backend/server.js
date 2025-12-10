// backend/index.js (in-memory demo)
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let projects = [
  { id: 1, title: "Sample Project", description: "Demo", createdAt: new Date() }
];
let tasks = [];
let nextProjectId = 2;
let nextTaskId = 1;

app.get('/', (req, res) => res.json({ message: 'Backend running (in-memory)' }));

app.get('/api/projects', (req, res) => res.json(projects));
app.post('/api/projects', (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const p = { id: nextProjectId++, title, description, createdAt: new Date() };
  projects.push(p);
  res.status(201).json(p);
});

app.get('/api/projects/:projectId/tasks', (req, res) => {
  const pid = Number(req.params.projectId);
  res.json(tasks.filter(t => t.projectId === pid));
});
app.post('/api/projects/:projectId/tasks', (req, res) => {
  const pid = Number(req.params.projectId);
  const project = projects.find(p => p.id === pid);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Task title required' });
  const t = { id: nextTaskId++, projectId: pid, title, description, status: 'todo', createdAt: new Date() };
  tasks.push(t);
  res.status(201).json(t);
});

app.listen(process.env.PORT || 5000, () => console.log('Backend running (in-memory) on port', process.env.PORT || 5000));
