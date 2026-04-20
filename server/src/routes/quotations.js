const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, agentId } = req.query;
    const where = {};
    if (req.user.role !== 'ADMIN') where.agentId = req.user.id;
    else if (agentId) where.agentId = agentId;
    if (status) where.status = status;

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        client: { select: { id: true, fullName: true } },
        requestedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(quotations);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        requestedBy: { select: { id: true, name: true } },
      },
    });
    if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
    if (req.user.role !== 'ADMIN' && quotation.agentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(quotation);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const data = {
      ...req.body,
      agentId: req.user.role === 'ADMIN' ? (req.body.agentId || req.user.id) : req.user.id,
    };
    const quotation = await prisma.quotation.create({
      data,
      include: {
        client: { select: { id: true, fullName: true } },
        requestedBy: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(quotation);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const existing = await prisma.quotation.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Quotation not found' });
    if (req.user.role !== 'ADMIN' && existing.agentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const quotation = await prisma.quotation.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        client: { select: { id: true, fullName: true } },
        requestedBy: { select: { id: true, name: true } },
      },
    });
    res.json(quotation);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Convert approved quotation to policy
router.post('/:id/to-policy', authenticate, async (req, res) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: { client: true },
    });
    if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
    if (quotation.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Only approved quotations can be converted' });
    }

    const policy = await prisma.policy.create({
      data: {
        policyNumber: req.body.policyNumber,
        clientId: quotation.clientId,
        productType: quotation.productType,
        underwriter: quotation.underwriterPreference || req.body.underwriter,
        coverAmount: parseFloat(req.body.coverAmount) || 0,
        annualPremium: parseFloat(req.body.annualPremium) || 0,
        startDate: new Date(req.body.startDate),
        renewalDate: new Date(req.body.renewalDate),
        agentId: quotation.agentId,
        notes: `Created from quotation. ${quotation.coverDetails || ''}`,
      },
    });
    res.status(201).json(policy);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
