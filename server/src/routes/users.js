const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all users (for dropdowns and admin management)
router.get('/', authenticate, async (req, res) => {
  try {
    const select = { id: true, name: true, email: true, role: true, phone: true, active: true, createdAt: true };
    if (req.user.role === 'ADMIN') {
      const users = await prisma.user.findMany({ select, orderBy: { name: 'asc' } });
      res.json(users);
    } else {
      // Agents only see agent list for reference
      const users = await prisma.user.findMany({ where: { active: true }, select: { id: true, name: true, role: true } });
      res.json(users);
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create user (admin only)
router.post('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role || 'AGENT', phone },
      select: { id: true, name: true, email: true, role: true, phone: true, active: true },
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user (admin only)
router.put('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, role: true, phone: true, active: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
