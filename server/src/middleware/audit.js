const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Logs an action to the audit trail.
 * Call this after any create, update, or delete operation.
 */
async function logAudit({ userId, action, entity, entityId, details, ipAddress }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,   // CREATE, UPDATE, DELETE, LOGIN, STATUS_CHANGE
        entity,   // Client, Lead, Policy, Task, etc.
        entityId: entityId || null,
        details: typeof details === 'object' ? JSON.stringify(details) : (details || null),
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
    // Never throw — audit failure should not break the main operation
  }
}

/**
 * Express middleware that attaches logAudit to req for easy use in routes.
 */
function auditMiddleware(req, res, next) {
  req.audit = (action, entity, entityId, details) => {
    if (!req.user) return;
    logAudit({
      userId: req.user.id,
      action,
      entity,
      entityId,
      details,
      ipAddress: req.ip || req.connection?.remoteAddress,
    });
  };
  next();
}

module.exports = { logAudit, auditMiddleware };
