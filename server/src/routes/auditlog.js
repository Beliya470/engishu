const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Admin only — view audit trail
router.get('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { entity, userId, limit: lim } = req.query;
    const where = {};
    if (entity) where.entity = entity;
    if (userId) where.userId = userId;

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(lim) || 100,
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
