const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { sendNewLeadAlert } = require('../utils/email');

const router = express.Router();
const prisma = new PrismaClient();

// Get all leads
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, status, agentId, source } = req.query;
    const where = {};

    if (req.user.role !== 'ADMIN') where.agentId = req.user.id;
    else if (agentId) where.agentId = agentId;

    if (status) where.status = status;
    if (source) where.source = source;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { company: { contains: search } },
        { refNumber: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      include: { assignedAgent: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single lead
router.get('/:id', authenticate, async (req, res) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: { assignedAgent: { select: { id: true, name: true } } },
    });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    if (req.user.role !== 'ADMIN' && lead.agentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create lead
router.post('/', authenticate, async (req, res) => {
  try {
    const data = {
      ...req.body,
      agentId: req.user.role === 'ADMIN' ? (req.body.agentId || req.user.id) : req.user.id,
    };
    const lead = await prisma.lead.create({
      data,
      include: { assignedAgent: { select: { id: true, name: true } } },
    });

    // Send email alert
    sendNewLeadAlert(lead).catch(err => console.error('Lead alert email error:', err));

    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update lead
router.put('/:id', authenticate, async (req, res) => {
  try {
    const existing = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Lead not found' });
    if (req.user.role !== 'ADMIN' && existing.agentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: req.body,
      include: { assignedAgent: { select: { id: true, name: true } } },
    });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete lead
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const existing = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Lead not found' });
    if (req.user.role !== 'ADMIN' && existing.agentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await prisma.lead.delete({ where: { id: req.params.id } });
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Convert lead to client
router.post('/:id/convert', authenticate, async (req, res) => {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    if (req.user.role !== 'ADMIN' && lead.agentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const client = await prisma.client.create({
      data: {
        fullName: lead.name,
        companyName: lead.company,
        phone: lead.phone || '',
        email: lead.email,
        agentId: lead.agentId,
        source: lead.source.toLowerCase().replace('_', '-'),
        notes: `Converted from lead. Product interest: ${lead.productInterest || 'N/A'}`,
      },
    });

    await prisma.lead.update({
      where: { id: req.params.id },
      data: { status: 'CONVERTED' },
    });

    // Send alert for conversion
    sendNewLeadAlert({ ...lead, name: `${lead.name} (Converted to Client)` })
      .catch(err => console.error('Conversion alert email error:', err));

    res.json({ client, message: 'Lead converted to client' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
