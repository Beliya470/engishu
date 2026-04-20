const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Secure file storage - randomize filenames to prevent path traversal
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = crypto.randomBytes(16).toString('hex') + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and Word documents allowed.'));
    }
  },
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { clientId, documentType } = req.query;
    const where = {};
    if (clientId) where.clientId = clientId;
    if (documentType) where.documentType = documentType;

    // Agents can only see documents for their own clients
    if (req.user.role !== 'ADMIN') {
      where.client = { agentId: req.user.id };
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        client: { select: { id: true, fullName: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(documents);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const document = await prisma.document.create({
      data: {
        documentType: req.body.documentType,
        fileName: req.file.originalname,
        filePath: req.file.filename,
        fileSize: req.file.size,
        userId: req.user.id,
        clientId: req.body.clientId,
      },
      include: {
        client: { select: { id: true, fullName: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(document);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/download/:id', authenticate, async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: { client: true },
    });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (req.user.role !== 'ADMIN' && doc.client.agentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filePath = path.join(__dirname, '../../uploads', doc.filePath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
    res.download(filePath, doc.fileName);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: { client: true },
    });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (req.user.role !== 'ADMIN' && doc.client.agentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete file from disk
    const filePath = path.join(__dirname, '../../uploads', doc.filePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
