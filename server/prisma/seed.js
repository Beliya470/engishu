const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.commission.deleteMany();
  await prisma.task.deleteMany();
  await prisma.document.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.client.deleteMany();
  await prisma.companySettings.deleteMany();
  await prisma.user.deleteMany();

  const adminPass = await bcrypt.hash('Admin123', 12);
  const agentPass = await bcrypt.hash('Agent123', 12);

  const admin = await prisma.user.create({
    data: { name: 'Munene', email: 'munene@engishu.com', password: adminPass, role: 'ADMIN', phone: '+254759840614' },
  });
  const alvin = await prisma.user.create({
    data: { name: 'Alvin', email: 'alvin@engishu.com', password: agentPass, role: 'AGENT', phone: '+254700000002' },
  });
  const beliya = await prisma.user.create({
    data: { name: 'Beliya', email: 'beliya@engishu.com', password: agentPass, role: 'AGENT', phone: '+254700000003' },
  });

  // 3 Clients
  const client1 = await prisma.client.create({
    data: {
      fullName: 'John Kamau', companyName: 'Kamau Enterprises Ltd', idNumber: '12345678',
      kraPin: 'A001234567B', phone: '+254711111111', email: 'john@kamau.co.ke',
      physicalAddress: 'Westlands, Nairobi', agentId: alvin.id, source: 'referral',
      notes: 'Key corporate client, fleet insurance', status: 'ACTIVE',
    },
  });
  const client2 = await prisma.client.create({
    data: {
      fullName: 'Mary Wanjiku', companyName: 'Wanjiku Traders', idNumber: '87654321',
      kraPin: 'B007654321C', phone: '+254722222222', email: 'mary@wanjiku.co.ke',
      physicalAddress: 'Kilimani, Nairobi', agentId: beliya.id, source: 'walk-in',
      notes: 'Family medical cover, 4 members', status: 'ACTIVE',
    },
  });
  const client3 = await prisma.client.create({
    data: {
      fullName: 'David Otieno', companyName: 'Otieno & Associates', idNumber: '23456789',
      kraPin: 'C002345678D', phone: '+254733000111', email: 'david@otieno.co.ke',
      physicalAddress: 'Upperhill, Nairobi', agentId: admin.id, source: 'referral',
      notes: 'SME package client, expanding business', status: 'ACTIVE',
    },
  });

  // 4 Leads
  await prisma.lead.create({
    data: {
      name: 'Coutts Otolo', phone: '+254733333333', company: 'Parker Russell',
      email: 'coutts@parkerrussell.co.ke', productInterest: 'Professional Indemnity',
      source: 'REFERRAL', agentId: admin.id, status: 'CONTACTED',
      notes: 'High value client, referred by Munene. Needs PI cover for audit firm.',
    },
  });
  await prisma.lead.create({
    data: {
      name: 'Grace Muthoni', phone: '+254744444444', company: 'Muthoni Holdings',
      email: 'grace@muthoni.co.ke', productInterest: 'Motor',
      source: 'COLD_CALL', agentId: beliya.id, status: 'NEW',
      notes: 'Fleet of 5 vehicles, interested in comprehensive',
    },
  });
  await prisma.lead.create({
    data: {
      name: 'Peter Odhiambo', phone: '+254755555555', company: 'Odhiambo & Sons',
      email: 'peter@odhiambo.co.ke', productInterest: 'SME Package',
      source: 'WEBSITE', agentId: alvin.id, status: 'QUOTED',
      followUpDate: new Date('2026-04-20'), notes: 'Quoted KES 150k for SME package',
    },
  });
  await prisma.lead.create({
    data: {
      name: 'Alice Njeri', phone: '+254766000222', company: 'Njeri Consulting',
      email: 'alice@njericonsulting.co.ke', productInterest: 'Group Medical',
      source: 'WEBSITE', agentId: admin.id, status: 'NEW',
      notes: 'Website submission - 15 staff, wants group medical options',
    },
  });

  // 3 Policies
  const now = new Date();
  const in5Days = new Date(now.getTime() + 5 * 86400000);
  const in25Days = new Date(now.getTime() + 25 * 86400000);
  const in90Days = new Date(now.getTime() + 90 * 86400000);
  const oneYearAgo = new Date(now.getTime() - 365 * 86400000);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 86400000);
  const nineMonthsAgo = new Date(now.getTime() - 270 * 86400000);

  const policy1 = await prisma.policy.create({
    data: {
      policyNumber: 'POL-2025-001', clientId: client1.id, productType: 'Motor',
      underwriter: 'First Assurance', coverAmount: 2500000, annualPremium: 85000,
      startDate: oneYearAgo, renewalDate: in5Days, status: 'ACTIVE',
      agentId: alvin.id, notes: 'Toyota Land Cruiser - comprehensive',
    },
  });
  const policy2 = await prisma.policy.create({
    data: {
      policyNumber: 'POL-2025-002', clientId: client2.id, productType: 'Medical',
      underwriter: 'Britam', coverAmount: 5000000, annualPremium: 120000,
      startDate: sixMonthsAgo, renewalDate: in90Days, status: 'ACTIVE',
      agentId: beliya.id, notes: 'Family medical - 4 members',
    },
  });
  await prisma.policy.create({
    data: {
      policyNumber: 'POL-2025-003', clientId: client3.id, productType: 'SME Package',
      underwriter: 'CIC', coverAmount: 10000000, annualPremium: 250000,
      startDate: nineMonthsAgo, renewalDate: in25Days, status: 'ACTIVE',
      agentId: admin.id, notes: 'Full SME package - fire, theft, liability, WIBA',
    },
  });

  // 2 Tasks
  const tomorrow = new Date(now.getTime() + 86400000);
  const yesterday = new Date(now.getTime() - 86400000);
  await prisma.task.create({
    data: {
      title: 'Follow up with Coutts Otolo on PI quote',
      description: 'Call Coutts to discuss PI cover options. He needs quote from First Assurance.',
      creatorId: admin.id, assigneeId: alvin.id, dueDate: tomorrow,
      clientId: null, priority: 'HIGH', status: 'PENDING',
    },
  });
  await prisma.task.create({
    data: {
      title: 'Collect Mary Wanjiku KRA PIN copy',
      description: 'Mary needs to submit KRA PIN for medical policy renewal.',
      creatorId: admin.id, assigneeId: beliya.id, dueDate: yesterday,
      clientId: client2.id, priority: 'MEDIUM', status: 'IN_PROGRESS',
    },
  });

  // 1 Commission
  await prisma.commission.create({
    data: {
      policyId: policy1.id, clientId: client1.id, underwriter: 'First Assurance',
      premium: 85000, commissionRate: 10, commissionAmount: 8500,
      status: 'PAID', paymentDate: new Date('2026-03-15'), notes: 'Q1 motor commission',
    },
  });

  // Company settings
  await prisma.companySettings.create({
    data: {
      name: 'Engishu Insurance Agency', phone: '+254 759 840614',
      email: 'cover@engishu.com',
      address: '1st Floor, CPA Center (Block A), Thika Road, Nairobi, Kenya',
      notificationEmail: 'cover@engishu.com',
    },
  });

  console.log('Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
