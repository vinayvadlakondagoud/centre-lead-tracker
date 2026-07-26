/**
 * Status audit log helper — records every status change on a lead.
 */

const db = require('../config/db');

async function logStatusChange({ lead_id, old_status, new_status, changed_by, reason }) {
  await db('status_audit_logs').insert({
    lead_id,
    old_status: old_status || null,
    new_status,
    changed_by: changed_by || 'system',
    reason: reason || null,
  });
}

module.exports = { logStatusChange };
