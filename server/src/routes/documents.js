const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { configured: cloudinaryReady, uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../utils/cloudinary');

const router = express.Router();
const prisma = new PrismaClient();

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Use memory storage when Cloudinary is configured; disk otherwise (local dev)
const storage = cloudinaryReady
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        cb(null, crypto.randomBytes(16).toString('hex') + path.extname(file.originalname));
      },
    });

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    ALLOWED_TYPES.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type.'));
  },
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { clientId, documentType } = req.query;
    const where = {};
    if (clientId) where.clientId = clientId;
    if (documentType) where.documentType = documentType;
    if (req.user.role !== 'ADMIN') where.client = { agentId: req.user.id };

    const documents = await prisma.document.findMany({
      where,
      include: {
        client: { select: { id: true, fullName: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(documents);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    let filePath;
    if (cloudinaryReady) {
      const { url } = await uploadToCloudinary(req.file.buffer, req.file.originalname, 'engishu/documents');
      filePath = url;
    } else {
      filePath = req.file.filename;
    }

    const document = await prisma.document.create({
      data: {
        documentType: req.body.documentType,
        fileName: req.file.originalname,
        filePath,
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
    console.error('Document upload error:', err);
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

    // Cloudinary URL — redirect directly to it
    if (doc.filePath.startsWith('http')) {
      return res.redirect(doc.filePath);
    }

    // Local disk file
    const localPath = path.join(__dirname, '../../uploads', doc.filePath);
    if (!fs.existsSync(localPath)) return res.status(404).json({ error: 'File not found' });
    res.download(localPath, doc.fileName);
  } catch {
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

    if (doc.filePath.startsWith('http')) {
      // Delete from Cloudinary
      const publicId = extractPublicId(doc.filePath);
      await deleteFromCloudinary(publicId);
    } else {
      // Delete from local disk
      const localPath = path.join(__dirname, '../../uploads', doc.filePath);
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    }

    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ message: 'Document deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
