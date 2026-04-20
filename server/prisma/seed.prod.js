/**
 * Production seed — creates staff accounts and company settings only.
 * Does NOT create any dummy clients, leads, or policies.
 * Safe to run on a live database: skips creation if users already exist.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log('Users already exist — skipping seed.');
    return;
  }

  const adminPass = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ChangeMe123!', 12);

  await prisma.user.create({
    data: {
      name: 'Munene',
      email: process.env.ADMIN_EMAIL_LOGIN || 'munene@engishu.com',
      password: adminPass,
      role: 'ADMIN',
      phone: '+254759840614',
    },
  });

  const settingsCount = await prisma.companySettings.count();
  if (settingsCount === 0) {
    await prisma.companySettings.create({
      data: {
        name: 'Engishu Insurance Agency',
        phone: '+254 759 840614',
        email: 'cover@engishu.com',
        address: '1st Floor, CPA Center (Block A), Thika Road, Nairobi, Kenya',
        notificationEmail: process.env.ADMIN_EMAIL || 'cover@engishu.com',
      },
    });
  }

  console.log('Production seed complete. Login with the ADMIN_EMAIL_LOGIN and ADMIN_PASSWORD env vars.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
