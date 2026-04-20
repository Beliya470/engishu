const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get payments for a policy
router.get('/', authenticate, async (req, res) => {
  try {
    const { policyId } = req.query;
    const where = {};
    if (policyId) where.policyId = policyId;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        policy: { select: { id: true, policyNumber: true, client: { select: { fullName: true } } } },
      },
      orderBy: { paymentDate: 'desc' },
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Record a payment
router.post('/', authenticate, async (req, res) => {
  try {
    const { policyId, amount, paymentDate, paymentMethod, receiptNumber, notes } = req.body;
    if (!policyId || !amount || !paymentDate || !paymentMethod) {
      return res.status(400).json({ error: 'Policy, amount, date and method are required' });
    }

    const payment = await prisma.payment.create({
      data: {
        policyId,
        amount: parseFloat(amount),
        paymentDate: new Date(paymentDate),
        paymentMethod,
        receiptNumber: receiptNumber || null,
        notes: notes || null,
      },
      include: {
        policy: { select: { id: true, policyNumber: true } },
      },
    });

    if (req.audit) req.audit('CREATE', 'Payment', payment.id, { policyId, amount, paymentMethod });
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
