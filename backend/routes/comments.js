const express = require('express');
const { Comment, Task } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// List comments for a task
router.get('/:taskId/comments', async (req, res) => {
  try {
    const comments = await Comment.findAll({ where: { taskId: req.params.taskId }, order: [['createdAt','ASC']] });
    res.json(comments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add comment (protected)
router.post('/:taskId/comments', auth, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const comment = await Comment.create({ taskId: task.id, authorId: req.user.id, content: req.body.content });
    res.status(201).json(comment);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
