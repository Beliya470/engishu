const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get company settings
router.get('/company', authenticate, async (req, res) => {
  try {
    let settings = await prisma.companySettings.findFirst();
    if (!settings) {
      settings = await prisma.companySettings.create({ data: {} });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update company settings (admin only)
router.put('/company', authenticate, adminOnly, async (req, res) => {
  try {
    let settings = await prisma.companySettings.findFirst();
    if (!settings) {
      settings = await prisma.companySettings.create({ data: req.body });
    } else {
      settings = await prisma.companySettings.update({
        where: { id: settings.id },
        data: req.body,
      });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
