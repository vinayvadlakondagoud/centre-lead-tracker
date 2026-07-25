/**
 * /api/export — CSV export of leads
 *
 * GET /api/export/leads — Download leads as CSV (all or filtered)
 */

const express = require('express');
const { Parser } = require('json2csv');
const db = require('../config/db');

const router = express.Router();

const LEAD_FIELDS = [
  'id', 'parent_name', 'child_name', 'child_age',
  'phone', 'email', 'source', 'status',
  'centre_name', 'centre_city', 'owner_name',
  'next_followup_at', 'created_at', 'is_archived',
];

router.get('/leads', async (req, res, next) => {
  try {
    let query = db('leads')
      .join('centres', 'leads.centre_id', 'centres.id')
      .join('owners', 'leads.owner_id', 'owners.id')
      .select(
        'leads.id', 'leads.parent_name', 'leads.child_name', 'leads.child_age',
        'leads.phone', 'leads.email', 'leads.source', 'leads.status',
        'centres.name as centre_name', 'centres.city as centre_city',
        'owners.name as owner_name',
        'leads.next_followup_at', 'leads.created_at', 'leads.is_archived'
      );

    // Apply same filters as leads list
    if (req.query.centre_id) query = query.where('leads.centre_id', parseInt(req.query.centre_id));
    if (req.query.owner_id) query = query.where('leads.owner_id', parseInt(req.query.owner_id));
    if (req.query.status) query = query.where('leads.status', req.query.status);
    if (req.query.source) query = query.where('leads.source', req.query.source);
    if (req.query.archived === 'true') {
      query = query.where('leads.is_archived', true);
    } else if (req.query.archived !== 'all') {
      query = query.where('leads.is_archived', false);
    }
    if (req.query.date_from) query = query.where('leads.created_at', '>=', req.query.date_from);
    if (req.query.date_to) query = query.where('leads.created_at', '<=', req.query.date_to);

    const leads = await query.orderBy('leads.created_at', 'desc');

    // Format dates as ISO 8601 UTC for CSV
    const formatted = leads.map((l) => ({
      ...l,
      next_followup_at: l.next_followup_at ? new Date(l.next_followup_at).toISOString() : '',
      created_at: l.created_at ? new Date(l.created_at).toISOString() : '',
      is_archived: l.is_archived ? 'Yes' : 'No',
    }));

    const parser = new Parser({ fields: LEAD_FIELDS });
    const csv = parser.parse(formatted);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=leads_export_${Date.now()}.csv`);
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
