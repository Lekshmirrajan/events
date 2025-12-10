const express = require('express');
const { Project, Task, Comment } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// List projects (optionally only mine)
router.get('/', async (req, res) => {
  try {
    const projects = await Project.findAll({ limit: 100, order: [['createdAt','DESC']] });
    res.json(projects);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create project (protected)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description } = req.body;
    const project = await Project.create({ title, description, ownerId: req.user.id });
    res.status(201).json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get a single project
router.get('/:projectId', async (req, res) => {
  try {
    const p = await Project.findByPk(req.params.projectId);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete project (protected)
router.delete('/:projectId', auth, async (req, res) => {
  try {
    const p = await Project.findByPk(req.params.projectId);
    if (!p) return res.status(404).json({ error: 'Not found' });
    // optional: only owner can delete
    if (p.ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await p.destroy();
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
