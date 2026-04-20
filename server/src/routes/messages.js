const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();
const prisma = new PrismaClient();

// Get conversations list (unique users I've messaged or who messaged me)
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all messages involving this user
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by the other person
    const convMap = {};
    for (const msg of messages) {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const other = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!convMap[otherId]) {
        const unread = await prisma.message.count({
          where: { senderId: otherId, receiverId: userId, read: false },
        });
        convMap[otherId] = {
          user: other,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unread,
        };
      }
    }

    const conversations = Object.values(convMap).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages with a specific user
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const myId = req.user.id;
    const otherId = req.params.userId;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: myId, receiverId: otherId },
          { senderId: otherId, receiverId: myId },
        ],
      },
      include: {
        sender: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    // Mark received messages as read
    await prisma.message.updateMany({
      where: { senderId: otherId, receiverId: myId, read: false },
      data: { read: true },
    });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Send a message
router.post('/', authenticate, async (req, res) => {
  try {
    const { receiverId, content, sendToEmail } = req.body;
    if (!receiverId || !content?.trim()) return res.status(400).json({ error: 'Receiver and content required' });

    const message = await prisma.message.create({
      data: {
        senderId: req.user.id,
        receiverId,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
    });

    // Create a notification for the receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        title: `Message from ${req.user.name}`,
        message: content.trim().substring(0, 100),
        type: 'MESSAGE',
        link: '/messages',
      },
    });

    // Optionally forward to email
    if (sendToEmail && message.receiver.email) {
      sendEmail(
        message.receiver.email,
        `Message from ${req.user.name} - Engishu Insurance`,
        `<p><strong>${req.user.name}</strong> sent you a message:</p>
         <blockquote style="border-left: 3px solid #1DB8A8; padding-left: 12px; color: #333;">${content}</blockquote>
         <p><small>Reply in the <a href="${process.env.FRONTEND_URL || 'http://127.0.0.1:9348'}/messages">Engishu Staff Portal</a></small></p>`
      ).catch(err => console.error('Message email error:', err));
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get unread count
router.get('/unread/count', authenticate, async (req, res) => {
  try {
    const count = await prisma.message.count({
      where: { receiverId: req.user.id, read: false },
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
