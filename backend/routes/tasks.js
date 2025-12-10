const express = require('express');
const { Task, Project } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// List tasks for a project
router.get('/:projectId/tasks', async (req, res) => {
  try {
    const tasks = await Task.findAll({ where: { projectId: req.params.projectId }, order: [['createdAt','ASC']] });
    res.json(tasks);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create task for project (protected)
router.post('/:projectId/tasks', auth, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const task = await Task.create({ projectId: project.id, title: req.body.title, description: req.body.description });
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update task (status, title, description) (protected)
router.patch('/:projectId/tasks/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (req.body.status) task.status = req.body.status;
    if (req.body.title) task.title = req.body.title;
    if (req.body.description) task.description = req.body.description;
    await task.save();
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete task (protected)
router.delete('/:projectId/tasks/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    await task.destroy();
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
