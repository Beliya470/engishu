const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { sendEmail } = require('../utils/email');
const { generateRefNumber } = require('../utils/refNumber');
const { sendConfirmationEmail } = require('../utils/confirmationEmail');
const { authRateLimiter } = require('../middleware/security');
const { configured: cloudinaryReady, uploadToCloudinary } = require('../utils/cloudinary');

const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];

// Use memory storage when Cloudinary is configured; disk otherwise (local dev)
const motorDocsStorage = cloudinaryReady
  ? multer.memoryStorage()
  : multer.diskStorage({
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

const uploadMotorDocs = multer({
  storage: motorDocsStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_DOC_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only PDF and images are allowed.'));
  },
});

const router = express.Router();
const prisma = new PrismaClient();

// Public quote request
router.post('/quote', authRateLimiter(), async (req, res) => {
  try {
    const { name, phone, email, productInterest, message } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required' });

    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN', active: true } });
    if (!admin) return res.status(500).json({ error: 'No admin user found' });

    const refNumber = await generateRefNumber('ENG');

    const lead = await prisma.lead.create({
      data: {
        refNumber,
        name,
        phone,
        email: email || null,
        productInterest: productInterest || null,
        source: 'WEBSITE',
        status: 'NEW',
        notes: message || null,
        agentId: admin.id,
      },
    });

    // Admin notification
    const adminEmail = process.env.ADMIN_EMAIL || 'cover@engishu.com';
    sendEmail(
      adminEmail,
      `New Quote Request ${refNumber}: ${name}`,
      `<h3>New Quote Request from Website</h3>
       <p><strong>Ref:</strong> ${refNumber}</p>
       <p><strong>Name:</strong> ${name}</p>
       <p><strong>Phone:</strong> ${phone}</p>
       <p><strong>Email:</strong> ${email || 'N/A'}</p>
       <p><strong>Product Interest:</strong> ${productInterest || 'N/A'}</p>
       <p><strong>Message:</strong> ${message || 'N/A'}</p>
       <hr>
       <p><em>This lead has been saved to the ERP system.</em></p>`
    ).catch(err => console.error('Quote admin email error:', err));

    // Confirmation email to the person who submitted
    sendConfirmationEmail(email, {
      refNumber,
      name,
      type: 'Quote Request',
      product: productInterest,
    }).catch(err => console.error('Quote confirmation email error:', err));

    res.status(201).json({
      message: `Quote request submitted successfully. Your reference number is ${refNumber}. We will contact you within 24 hours.`,
      refNumber,
    });
  } catch (err) {
    console.error('Quote submission error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Public contact form
router.post('/contact', authRateLimiter(), async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !message) return res.status(400).json({ error: 'Name and message are required' });

    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN', active: true } });
    const refNumber = await generateRefNumber('ENQ');

    if (admin) {
      await prisma.lead.create({
        data: {
          refNumber,
          name,
          phone: phone || null,
          email: email || null,
          source: 'WEBSITE',
          status: 'NEW',
          notes: `[Contact Form] ${message}`,
          agentId: admin.id,
        },
      });
    }

    // Admin notification
    const adminEmail = process.env.ADMIN_EMAIL || 'cover@engishu.com';
    sendEmail(
      adminEmail,
      `Contact Form ${refNumber}: ${name}`,
      `<h3>New Contact Form Submission</h3>
       <p><strong>Ref:</strong> ${refNumber}</p>
       <p><strong>Name:</strong> ${name}</p>
       <p><strong>Email:</strong> ${email || 'N/A'}</p>
       <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
       <p><strong>Message:</strong></p>
       <p>${message}</p>
       <hr>
       <p><em>This message has been saved as a lead in the ERP system.</em></p>`
    ).catch(err => console.error('Contact admin email error:', err));

    // Confirmation email to the person
    sendConfirmationEmail(email, {
      refNumber,
      name,
      type: 'Enquiry',
      product: null,
    }).catch(err => console.error('Contact confirmation email error:', err));

    res.status(201).json({
      message: `Message sent successfully. Your reference number is ${refNumber}. We will get back to you soon.`,
      refNumber,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Motor insurance document upload (public — no auth required)
router.post(
  '/motor-docs',
  authRateLimiter(),
  uploadMotorDocs.fields([
    { name: 'id_photo', maxCount: 2 },
    { name: 'logbook', maxCount: 1 },
    { name: 'kra_pin', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { name, mpesaCode, email, quoteRef } = req.body;
      if (!name || !mpesaCode) {
        return res.status(400).json({ error: 'Name and MPESA code are required' });
      }

      const files = req.files || {};
      const idPhotos = files.id_photo || [];
      const logbook = (files.logbook || [])[0];
      const kraPin = (files.kra_pin || [])[0];

      const docRef = await generateRefNumber('DOC');

      // Upload files to Cloudinary if configured, otherwise keep disk reference
      const resolveFile = async (file, label) => {
        if (!file) return null;
        if (cloudinaryReady && file.buffer) {
          const { url } = await uploadToCloudinary(file.buffer, file.originalname, 'engishu/motor-docs');
          return { name: file.originalname, size: Math.round(file.size / 1024), url };
        }
        return { name: file.originalname, size: Math.round(file.size / 1024), url: null };
      };

      const [logbookInfo, kraPinInfo] = await Promise.all([
        resolveFile(logbook, 'logbook'),
        resolveFile(kraPin, 'kra_pin'),
      ]);
      const idPhotoInfos = await Promise.all(idPhotos.map(f => resolveFile(f, 'id_photo')));

      const fileLines = [
        ...idPhotoInfos.map(f => `ID Photo: ${f.name} (${f.size} KB)${f.url ? ` — <a href="${f.url}">view</a>` : ''}`),
        logbookInfo ? `Logbook: ${logbookInfo.name} (${logbookInfo.size} KB)${logbookInfo.url ? ` — <a href="${logbookInfo.url}">view</a>` : ''}` : 'Logbook: not provided',
        kraPinInfo ? `KRA PIN: ${kraPinInfo.name} (${kraPinInfo.size} KB)${kraPinInfo.url ? ` — <a href="${kraPinInfo.url}">view</a>` : ''}` : 'KRA PIN: not provided',
      ];

      const fileNotesLines = [
        ...idPhotoInfos.map(f => `ID Photo: ${f.name}${f.url ? ` ${f.url}` : ''}`),
        logbookInfo ? `Logbook: ${logbookInfo.name}${logbookInfo.url ? ` ${logbookInfo.url}` : ''}` : 'Logbook: not provided',
        kraPinInfo ? `KRA PIN: ${kraPinInfo.name}${kraPinInfo.url ? ` ${kraPinInfo.url}` : ''}` : 'KRA PIN: not provided',
      ];

      const notes = `Motor Document Submission [${docRef}]\nMPESA Code: ${mpesaCode}\nQuote Ref: ${quoteRef || 'N/A'}\n\n${fileNotesLines.join('\n')}`;

      // If a quote ref was supplied, append docs note to that lead; otherwise create a new lead
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN', active: true } });
      let linked = false;
      if (quoteRef) {
        const existingLead = await prisma.lead.findFirst({ where: { refNumber: quoteRef } });
        if (existingLead) {
          await prisma.lead.update({
            where: { id: existingLead.id },
            data: { notes: `${existingLead.notes || ''}\n\n${notes}` },
          });
          linked = true;
        }
      }
      if (!linked && admin) {
        await prisma.lead.create({
          data: {
            refNumber: docRef,
            name,
            phone: null,
            email: null,
            productInterest: 'Motor Insurance (ICPAK) — Document Upload',
            source: 'WEBSITE',
            status: 'NEW',
            notes,
            agentId: admin.id,
          },
        });
      }

      // Admin notification email
      const adminEmail = process.env.ADMIN_EMAIL || 'cover@engishu.com';
      sendEmail(
        adminEmail,
        `Motor Insurance Documents Received [${docRef}]: ${name}`,
        `<h3>Motor Insurance Document Submission</h3>
         <p><strong>Ref:</strong> ${docRef}</p>
         <p><strong>Name:</strong> ${name}</p>
         <p><strong>MPESA Code:</strong> ${mpesaCode}</p>
         <p><strong>Quote Ref:</strong> ${quoteRef || 'N/A'}</p>
         <h4>Uploaded Files:</h4>
         <ul>${fileLines.map(l => `<li>${l}</li>`).join('')}</ul>
         <p><em>Reference: ${docRef}</em></p>`
      ).catch(err => console.error('Motor docs admin email error:', err));

      // Confirmation email to submitter
      sendConfirmationEmail(email || null, {
        refNumber: docRef,
        name,
        type: 'Document Upload',
        product: null,
      }).catch(err => console.error('Motor docs confirmation email error:', err));

      res.status(201).json({ message: 'Documents submitted successfully.', refNumber: docRef });
    } catch (err) {
      console.error('Motor docs upload error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;
