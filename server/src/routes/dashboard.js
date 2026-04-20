const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    const agentFilter = isAdmin ? {} : { agentId: req.user.id };
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalClients,
      activePolicies,
      leadsInPipeline,
      overdueTasks,
      renewingSoon,
      recentClients,
      recentLeads,
      recentPolicies,
    ] = await Promise.all([
      prisma.client.count({ where: { ...agentFilter, status: 'ACTIVE' } }),
      prisma.policy.count({ where: { ...agentFilter, status: 'ACTIVE' } }),
      prisma.lead.count({
        where: { ...agentFilter, status: { notIn: ['CONVERTED', 'LOST'] } },
      }),
      prisma.task.count({
        where: {
          ...(isAdmin ? {} : { assigneeId: req.user.id }),
          status: { not: 'DONE' },
          dueDate: { lt: now },
        },
      }),
      prisma.policy.count({
        where: { ...agentFilter, status: 'ACTIVE', renewalDate: { lte: thirtyDays, gte: now } },
      }),
      prisma.client.findMany({
        where: agentFilter,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, fullName: true, companyName: true, createdAt: true },
      }),
      prisma.lead.findMany({
        where: agentFilter,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, company: true, status: true, createdAt: true },
      }),
      prisma.policy.findMany({
        where: agentFilter,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, policyNumber: true, productType: true, status: true, createdAt: true, client: { select: { fullName: true } } },
      }),
    ]);

    const result = {
      totalClients,
      activePolicies,
      leadsInPipeline,
      overdueTasks,
      renewingSoon,
      recentActivity: { recentClients, recentLeads, recentPolicies },
    };

    // Admin-only: revenue this month and tasks due today for agents
    if (isAdmin) {
      const revenue = await prisma.policy.aggregate({
        where: { status: 'ACTIVE', createdAt: { gte: startOfMonth } },
        _sum: { annualPremium: true },
      });
      result.revenueThisMonth = revenue._sum.annualPremium || 0;
    } else {
      const tasksDueToday = await prisma.task.count({
        where: {
          assigneeId: req.user.id,
          status: { not: 'DONE' },
          dueDate: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          },
        },
      });
      result.tasksDueToday = tasksDueToday;
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
