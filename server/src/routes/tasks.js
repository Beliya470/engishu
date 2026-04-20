const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, priority, assigneeId } = req.query;
    const where = {};

    if (req.user.role !== 'ADMIN') {
      where.assigneeId = req.user.id;
    } else if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        relatedClient: { select: { id: true, fullName: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { priority: 'asc' }],
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        relatedClient: { select: { id: true, fullName: true } },
      },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (req.user.role !== 'ADMIN' && task.assigneeId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, assigneeId, dueDate, priority, status, clientId } = req.body;
    const data = {
      title,
      description: description || null,
      dueDate: new Date(dueDate),
      priority: priority || 'MEDIUM',
      status: status || 'PENDING',
      creatorId: req.user.id,
      assigneeId: req.user.role === 'ADMIN' ? (assigneeId || req.user.id) : req.user.id,
    };
    if (clientId) data.clientId = clientId;
    const task = await prisma.task.create({
      data,
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        relatedClient: { select: { id: true, fullName: true } },
      },
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    if (req.user.role !== 'ADMIN' && existing.assigneeId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const data = {};
    if (req.body.title !== undefined) data.title = req.body.title;
    if (req.body.description !== undefined) data.description = req.body.description;
    if (req.body.dueDate) data.dueDate = new Date(req.body.dueDate);
    if (req.body.priority) data.priority = req.body.priority;
    if (req.body.status) data.status = req.body.status;
    if (req.body.assigneeId) data.assigneeId = req.body.assigneeId;
    if (req.body.clientId !== undefined) data.clientId = req.body.clientId || null;

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data,
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        relatedClient: { select: { id: true, fullName: true } },
      },
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
