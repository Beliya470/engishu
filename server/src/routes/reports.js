const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Admin only — analytics
router.use(authenticate, adminOnly);

// Overview stats
router.get('/overview', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalClients, totalPolicies, activePolicies,
      totalLeads, convertedLeads, websiteLeads,
      monthlyPremium, yearlyPremium,
      totalClaims, pendingClaims,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.policy.count(),
      prisma.policy.count({ where: { status: 'ACTIVE' } }),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: 'CONVERTED' } }),
      prisma.lead.count({ where: { source: 'WEBSITE' } }),
      prisma.policy.aggregate({ where: { createdAt: { gte: startOfMonth } }, _sum: { annualPremium: true } }),
      prisma.policy.aggregate({ where: { createdAt: { gte: startOfYear } }, _sum: { annualPremium: true } }),
      prisma.claim.count().catch(() => 0),
      prisma.claim.count({ where: { status: { in: ['REPORTED', 'UNDER_REVIEW', 'APPROVED'] } } }).catch(() => 0),
    ]);

    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    res.json({
      totalClients,
      totalPolicies,
      activePolicies,
      totalLeads,
      convertedLeads,
      websiteLeads,
      conversionRate,
      monthlyPremium: monthlyPremium._sum.annualPremium || 0,
      yearlyPremium: yearlyPremium._sum.annualPremium || 0,
      totalClaims,
      pendingClaims,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Monthly premium trend (last 12 months)
router.get('/premium-trend', async (req, res) => {
  try {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const result = await prisma.policy.aggregate({
        where: { createdAt: { gte: start, lt: end } },
        _sum: { annualPremium: true },
        _count: true,
      });
      months.push({
        month: start.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        premium: result._sum.annualPremium || 0,
        count: result._count,
      });
    }
    res.json(months);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Agent performance
router.get('/agent-performance', async (req, res) => {
  try {
    const agents = await prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, role: true },
    });

    const performance = await Promise.all(agents.map(async (agent) => {
      const [clients, leads, converted, policies, tasks] = await Promise.all([
        prisma.client.count({ where: { agentId: agent.id } }),
        prisma.lead.count({ where: { agentId: agent.id } }),
        prisma.lead.count({ where: { agentId: agent.id, status: 'CONVERTED' } }),
        prisma.policy.count({ where: { agentId: agent.id, status: 'ACTIVE' } }),
        prisma.task.count({ where: { assigneeId: agent.id, status: 'DONE' } }),
      ]);
      return {
        ...agent,
        clients,
        leads,
        converted,
        conversionRate: leads > 0 ? Math.round((converted / leads) * 100) : 0,
        activePolicies: policies,
        tasksCompleted: tasks,
      };
    }));

    res.json(performance);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Lead sources breakdown
router.get('/lead-sources', async (req, res) => {
  try {
    const sources = ['WEBSITE', 'REFERRAL', 'WALK_IN', 'COLD_CALL', 'CLIENT_LIST'];
    const breakdown = await Promise.all(sources.map(async (source) => ({
      source,
      count: await prisma.lead.count({ where: { source } }),
      converted: await prisma.lead.count({ where: { source, status: 'CONVERTED' } }),
    })));
    res.json(breakdown);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Product breakdown
router.get('/product-breakdown', async (req, res) => {
  try {
    const policies = await prisma.policy.findMany({ select: { productType: true, annualPremium: true, status: true } });
    const breakdown = {};
    for (const p of policies) {
      if (!breakdown[p.productType]) breakdown[p.productType] = { count: 0, premium: 0, active: 0 };
      breakdown[p.productType].count++;
      breakdown[p.productType].premium += p.annualPremium;
      if (p.status === 'ACTIVE') breakdown[p.productType].active++;
    }
    res.json(Object.entries(breakdown).map(([product, data]) => ({ product, ...data })).sort((a, b) => b.premium - a.premium));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
