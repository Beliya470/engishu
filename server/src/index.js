require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const { sendRenewalAlerts } = require('./utils/email');
const { createRenewalTasks } = require('./utils/renewalTasks');

const { rateLimiter, securityHeaders } = require('./middleware/security');
const { auditMiddleware } = require('./middleware/audit');

const app = express();
const PORT = process.env.PORT || 9247;

// Security middleware
app.use(securityHeaders);
app.use(rateLimiter(200, 60000)); // 200 requests per minute global
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://127.0.0.1:9348']
  : ['http://127.0.0.1:9348'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' })); // Limit payload size
app.use(auditMiddleware);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Public routes (no auth)
app.use('/api/public', require('./routes/public'));

// Protected routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/policies', require('./routes/policies'));
app.use('/api/quotations', require('./routes/quotations'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/commissions', require('./routes/commissions'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/users', require('./routes/users'));
app.use('/api/claims', require('./routes/claims'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/audit', require('./routes/auditlog'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => res.sendFile(path.join(clientBuild, 'index.html')));
}

// Daily renewal alert cron - runs at 8am every day
cron.schedule('0 8 * * *', async () => {
  console.log('Running daily renewal check...');
  try {
    await createRenewalTasks();
    await sendRenewalAlerts();
  } catch (err) {
    console.error('Renewal cron error:', err);
  }
});

const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
app.listen(PORT, HOST, () => {
  console.log(`Engishu server running on http://${HOST}:${PORT}`);
});
