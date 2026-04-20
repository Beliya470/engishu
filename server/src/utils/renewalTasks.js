const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createRenewalTasks() {
  const now = new Date();
  const sixtyDays = new Date(now.getTime() + 60 * 86400000);

  const policies = await prisma.policy.findMany({
    where: {
      status: 'ACTIVE',
      renewalDate: { lte: sixtyDays, gte: now },
    },
    include: { client: true, assignedAgent: true },
  });

  let created = 0;
  for (const policy of policies) {
    // Check if a renewal task already exists for this policy
    const existing = await prisma.task.findFirst({
      where: {
        title: { contains: policy.policyNumber },
        clientId: policy.clientId,
        status: { not: 'DONE' },
      },
    });
    if (existing) continue;

    const daysUntil = Math.ceil((new Date(policy.renewalDate) - now) / 86400000);
    const dueDate = new Date(policy.renewalDate.getTime() - 14 * 86400000);

    await prisma.task.create({
      data: {
        title: `[Renewal Reminder] Renew ${policy.productType} for ${policy.client.fullName}`,
        description: `Policy ${policy.policyNumber} expires on ${new Date(policy.renewalDate).toLocaleDateString()}. Annual premium: KES ${policy.annualPremium.toLocaleString()}.`,
        creatorId: policy.agentId,
        assigneeId: policy.agentId,
        dueDate: dueDate < now ? now : dueDate,
        clientId: policy.clientId,
        priority: daysUntil <= 30 ? 'HIGH' : 'MEDIUM',
        status: 'PENDING',
      },
    });
    created++;
  }

  console.log(`Renewal tasks: ${created} created from ${policies.length} expiring policies`);
  return { created, total: policies.length };
}

module.exports = { createRenewalTasks };
