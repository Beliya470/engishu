/**
 * Cleanup script — deletes all dummy/test data from the database,
 * keeping only the admin user accounts.
 * Run from the server directory: node scripts/cleanup-data.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting data cleanup...');

  // Delete in dependency order (children before parents)
  const auditLogs = await prisma.auditLog.deleteMany({});
  console.log(`Deleted ${auditLogs.count} audit logs`);

  const notifications = await prisma.notification.deleteMany({});
  console.log(`Deleted ${notifications.count} notifications`);

  const messages = await prisma.message.deleteMany({});
  console.log(`Deleted ${messages.count} messages`);

  const payments = await prisma.payment.deleteMany({});
  console.log(`Deleted ${payments.count} payments`);

  const claims = await prisma.claim.deleteMany({});
  console.log(`Deleted ${claims.count} claims`);

  const commissions = await prisma.commission.deleteMany({});
  console.log(`Deleted ${commissions.count} commissions`);

  const documents = await prisma.document.deleteMany({});
  console.log(`Deleted ${documents.count} documents`);

  const tasks = await prisma.task.deleteMany({});
  console.log(`Deleted ${tasks.count} tasks`);

  const quotations = await prisma.quotation.deleteMany({});
  console.log(`Deleted ${quotations.count} quotations`);

  const policies = await prisma.policy.deleteMany({});
  console.log(`Deleted ${policies.count} policies`);

  const leads = await prisma.lead.deleteMany({});
  console.log(`Deleted ${leads.count} leads`);

  const clients = await prisma.client.deleteMany({});
  console.log(`Deleted ${clients.count} clients`);

  const refCounters = await prisma.refCounter.deleteMany({});
  console.log(`Deleted ${refCounters.count} ref counters`);

  console.log('\nData cleanup complete. User accounts preserved.');

  const users = await prisma.user.findMany({ select: { name: true, email: true, role: true } });
  console.log('Remaining users:');
  users.forEach(u => console.log(`  - ${u.name} (${u.email}) [${u.role}]`));
}

main()
  .catch(err => { console.error('Cleanup failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
