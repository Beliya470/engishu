const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { generateRefNumber } = require('../utils/refNumber');

const router = express.Router();
const prisma = new PrismaClient();

// Get all claims
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, clientId } = req.query;
    const where = {};
    if (req.user.role !== 'ADMIN') where.handlerId = req.user.id;
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    const claims = await prisma.claim.findMany({
      where,
      include: {
        policy: { select: { id: true, policyNumber: true, productType: true } },
        client: { select: { id: true, fullName: true, companyName: true } },
        handler: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single claim
router.get('/:id', authenticate, async (req, res) => {
  try {
    const claim = await prisma.claim.findUnique({
      where: { id: req.params.id },
      include: {
        policy: { include: { client: true } },
        client: true,
        handler: { select: { id: true, name: true } },
      },
    });
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create claim
router.post('/', authenticate, async (req, res) => {
  try {
    const { policyId, clientId, claimType, description, incidentDate, amountClaimed, notes } = req.body;
    if (!policyId || !clientId || !claimType || !description || !incidentDate) {
      return res.status(400).json({ error: 'Policy, client, claim type, description, and incident date are required' });
    }

    const claimNumber = await generateRefNumber('CLM');

    const claim = await prisma.claim.create({
      data: {
        claimNumber,
        policyId,
        clientId,
        claimType,
        description,
        incidentDate: new Date(incidentDate),
        amountClaimed: parseFloat(amountClaimed) || 0,
        handlerId: req.user.id,
        notes: notes || null,
      },
      include: {
        policy: { select: { id: true, policyNumber: true } },
        client: { select: { id: true, fullName: true } },
        handler: { select: { id: true, name: true } },
      },
    });

    if (req.audit) req.audit('CREATE', 'Claim', claim.id, { claimNumber, claimType, policyId });
    res.status(201).json(claim);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update claim
router.put('/:id', authenticate, async (req, res) => {
  try {
    const data = {};
    if (req.body.status) data.status = req.body.status;
    if (req.body.amountSettled !== undefined) data.amountSettled = parseFloat(req.body.amountSettled);
    if (req.body.notes !== undefined) data.notes = req.body.notes;
    if (req.body.handlerId) data.handlerId = req.body.handlerId;

    const claim = await prisma.claim.update({
      where: { id: req.params.id },
      data,
      include: {
        policy: { select: { id: true, policyNumber: true } },
        client: { select: { id: true, fullName: true } },
        handler: { select: { id: true, name: true } },
      },
    });

    if (req.audit) req.audit('UPDATE', 'Claim', claim.id, { status: data.status });
    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
