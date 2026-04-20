const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Generates a sequential reference number like ENG-2026-0047
 * Thread-safe using database counter
 */
async function generateRefNumber(prefix = 'ENG') {
  const year = new Date().getFullYear();
  const key = `${prefix}-${year}`;

  // Upsert the counter: create if not exists, increment if exists
  const counter = await prisma.refCounter.upsert({
    where: { prefix: key },
    update: { counter: { increment: 1 } },
    create: { prefix: key, counter: 1 },
  });

  const padded = String(counter.counter).padStart(4, '0');
  return `${prefix}-${year}-${padded}`;
}

module.exports = { generateRefNumber };
