const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// All commission routes are admin-only
router.use(authenticate, adminOnly);

router.get('/', async (req, res) => {
  try {
    const { status, agentId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (agentId) where.policy = { agentId };

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        policy: {
          select: { id: true, policyNumber: true, agentId: true, assignedAgent: { select: { id: true, name: true } } },
        },
        client: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(commissions);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Commission summary
router.get('/summary', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [monthly, quarterly, yearly] = await Promise.all([
      prisma.commission.aggregate({ where: { createdAt: { gte: startOfMonth } }, _sum: { commissionAmount: true } }),
      prisma.commission.aggregate({ where: { createdAt: { gte: startOfQuarter } }, _sum: { commissionAmount: true } }),
      prisma.commission.aggregate({ where: { createdAt: { gte: startOfYear } }, _sum: { commissionAmount: true } }),
    ]);

    // Per-agent breakdown
    const agents = await prisma.user.findMany({ where: { role: 'AGENT', active: true }, select: { id: true, name: true } });
    const agentBreakdown = await Promise.all(
      agents.map(async (agent) => {
        const total = await prisma.commission.aggregate({
          where: { policy: { agentId: agent.id } },
          _sum: { commissionAmount: true },
          _count: true,
        });
        return { agentId: agent.id, agentName: agent.name, total: total._sum.commissionAmount || 0, count: total._count };
      })
    );

    res.json({
      thisMonth: monthly._sum.commissionAmount || 0,
      thisQuarter: quarterly._sum.commissionAmount || 0,
      thisYear: yearly._sum.commissionAmount || 0,
      agentBreakdown,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { policyId, clientId, underwriter, premium, commissionRate, notes } = req.body;
    const commissionAmount = (parseFloat(premium) * parseFloat(commissionRate)) / 100;

    const commission = await prisma.commission.create({
      data: {
        policyId,
        clientId,
        underwriter,
        premium: parseFloat(premium),
        commissionRate: parseFloat(commissionRate),
        commissionAmount,
        notes,
      },
      include: {
        policy: { select: { id: true, policyNumber: true } },
        client: { select: { id: true, fullName: true } },
      },
    });
    res.status(201).json(commission);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.premium && data.commissionRate) {
      data.premium = parseFloat(data.premium);
      data.commissionRate = parseFloat(data.commissionRate);
      data.commissionAmount = (data.premium * data.commissionRate) / 100;
    }
    if (data.paymentDate) data.paymentDate = new Date(data.paymentDate);

    const commission = await prisma.commission.update({
      where: { id: req.params.id },
      data,
      include: {
        policy: { select: { id: true, policyNumber: true } },
        client: { select: { id: true, fullName: true } },
      },
    });
    res.json(commission);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
