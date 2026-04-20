const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  try {
    const { search, status, agentId, underwriter, productType, clientId } = req.query;
    const where = {};

    if (req.user.role !== 'ADMIN') where.agentId = req.user.id;
    else if (agentId) where.agentId = agentId;

    if (status) where.status = status;
    if (underwriter) where.underwriter = underwriter;
    if (productType) where.productType = productType;
    if (clientId) where.clientId = clientId;
    if (search) {
      where.OR = [
        { policyNumber: { contains: search,  } },
        { client: { fullName: { contains: search,  } } },
      ];
    }

    const policies = await prisma.policy.findMany({
      where,
      include: {
        client: { select: { id: true, fullName: true, companyName: true } },
        assignedAgent: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(policies);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const policy = await prisma.policy.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        assignedAgent: { select: { id: true, name: true } },
        commissions: true,
      },
    });
    if (!policy) return res.status(404).json({ error: 'Policy not found' });
    if (req.user.role !== 'ADMIN' && policy.agentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(policy);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const data = {
      ...req.body,
      startDate: new Date(req.body.startDate),
      renewalDate: new Date(req.body.renewalDate),
      coverAmount: parseFloat(req.body.coverAmount) || 0,
      annualPremium: parseFloat(req.body.annualPremium) || 0,
      agentId: req.user.role === 'ADMIN' ? (req.body.agentId || req.user.id) : req.user.id,
    };
    const policy = await prisma.policy.create({
      data,
      include: {
        client: { select: { id: true, fullName: true } },
        assignedAgent: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(policy);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const existing = await prisma.policy.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Policy not found' });
    if (req.user.role !== 'ADMIN' && existing.agentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const data = { ...req.body };
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.renewalDate) data.renewalDate = new Date(data.renewalDate);
    if (data.coverAmount) data.coverAmount = parseFloat(data.coverAmount);
    if (data.annualPremium) data.annualPremium = parseFloat(data.annualPremium);

    const policy = await prisma.policy.update({
      where: { id: req.params.id },
      data,
      include: {
        client: { select: { id: true, fullName: true } },
        assignedAgent: { select: { id: true, name: true } },
      },
    });
    res.json(policy);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
