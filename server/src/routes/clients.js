const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all clients (filtered by agent for non-admins)
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, status, agentId } = req.query;
    const where = {};

    if (req.user.role !== 'ADMIN') {
      where.agentId = req.user.id;
    } else if (agentId) {
      where.agentId = agentId;
    }

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { fullName: { contains: search,  } },
        { phone: { contains: search } },
        { companyName: { contains: search,  } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      include: { assignedAgent: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single client with related data
router.get('/:id', authenticate, async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        assignedAgent: { select: { id: true, name: true } },
        policies: true,
        documents: true,
        quotations: true,
      },
    });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    if (req.user.role !== 'ADMIN' && client.agentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create client
router.post('/', authenticate, async (req, res) => {
  try {
    const data = {
      ...req.body,
      agentId: req.user.role === 'ADMIN' ? (req.body.agentId || req.user.id) : req.user.id,
    };
    const client = await prisma.client.create({
      data,
      include: { assignedAgent: { select: { id: true, name: true } } },
    });
    res.status(201).json(client);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update client
router.put('/:id', authenticate, async (req, res) => {
  try {
    const existing = await prisma.client.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Client not found' });
    if (req.user.role !== 'ADMIN' && existing.agentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: req.body,
      include: { assignedAgent: { select: { id: true, name: true } } },
    });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
