const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function getTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendEmail(to, subject, html) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('SMTP not configured, skipping email:', subject);
    return;
  }
  await transporter.sendMail({
    from: `"Engishu Insurance" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

async function sendNewLeadAlert(lead) {
  const adminEmail = process.env.ADMIN_EMAIL || 'cover@engishu.com';
  await sendEmail(
    adminEmail,
    `New Lead: ${lead.name}`,
    `<h3>New Lead Added</h3>
     <p><strong>Name:</strong> ${lead.name}</p>
     <p><strong>Company:</strong> ${lead.company || 'N/A'}</p>
     <p><strong>Product Interest:</strong> ${lead.productInterest || 'N/A'}</p>
     <p><strong>Source:</strong> ${lead.source}</p>`
  );
}

async function sendRenewalAlerts() {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const policies = await prisma.policy.findMany({
    where: {
      status: 'ACTIVE',
      renewalDate: { lte: thirtyDaysFromNow },
    },
    include: { client: true, assignedAgent: true },
  });

  if (policies.length === 0) return;

  const adminEmail = process.env.ADMIN_EMAIL || 'cover@engishu.com';
  const rows = policies.map(p => `
    <tr>
      <td>${p.policyNumber}</td>
      <td>${p.client.fullName}</td>
      <td>${p.productType}</td>
      <td>${p.underwriter}</td>
      <td>${new Date(p.renewalDate).toLocaleDateString()}</td>
      <td>${p.assignedAgent.name}</td>
    </tr>
  `).join('');

  await sendEmail(
    adminEmail,
    `Policy Renewal Alert - ${policies.length} policies expiring soon`,
    `<h3>Policies Renewing Within 30 Days</h3>
     <table border="1" cellpadding="8" cellspacing="0">
       <tr><th>Policy #</th><th>Client</th><th>Product</th><th>Underwriter</th><th>Renewal Date</th><th>Agent</th></tr>
       ${rows}
     </table>`
  );
}

module.exports = { sendEmail, sendNewLeadAlert, sendRenewalAlerts };
