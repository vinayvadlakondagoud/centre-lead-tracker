/**
 * /api/dashboard — Aggregated stats for the dashboard
 *
 * GET /api/dashboard              — Overview stats
 * GET /api/dashboard/by-centre   — Leads grouped by centre
 * GET /api/dashboard/by-owner    — Leads grouped by owner
 * GET /api/dashboard/by-source   — Leads grouped by source
 * GET /api/dashboard/by-status   — Leads grouped by status (bar chart)
 * GET /api/dashboard/overdue     — Leads with overdue followups
 */

const express = require('express');
const db = require('../config/db');

const router = express.Router();

// ── GET /api/dashboard — Overview ───────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const baseQuery = () => {
      let q = db('leads');
      if (req.query.date_from) q = q.where('leads.created_at', '>=', req.query.date_from);
      if (req.query.date_to) q = q.where('leads.created_at', '<=', req.query.date_to);
      if (req.query.centre_id) q = q.where('leads.centre_id', parseInt(req.query.centre_id));
      if (req.query.owner_id) q = q.where('leads.owner_id', parseInt(req.query.owner_id));
      if (req.query.status) q = q.where('leads.status', req.query.status);
      return q;
    };

    const [total] = await baseQuery().where('is_archived', false).count('* as count');
    const [newLeads] = await baseQuery().where({ is_archived: false, status: 'New' }).count('* as count');
    const [demoScheduled] = await baseQuery().where({ is_archived: false, status: 'Demo Scheduled' }).count('* as count');
    const [converted] = await baseQuery().where({ is_archived: false, status: 'Converted' }).count('* as count');
    const [lost] = await baseQuery().where({ is_archived: false, status: 'Lost' }).count('* as count');
    const [archived] = await baseQuery().where('is_archived', true).count('* as count');

    const overdue = await baseQuery()
      .where('is_archived', false)
      .whereNotIn('status', ['Converted', 'Lost'])
      .whereNotNull('next_followup_at')
      .where('next_followup_at', '<', db.fn.now())
      .count('* as count')
      .first();

    const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const todayFollowups = await db('followups')
      .whereRaw('DATE(followed_up_at) = ?', [todayIST])
      .count('* as count')
      .first();

    res.json({
      success: true,
      data: {
        total: parseInt(total.count) || 0,
        new: parseInt(newLeads.count) || 0,
        demoScheduled: parseInt(demoScheduled.count) || 0,
        converted: parseInt(converted.count) || 0,
        lost: parseInt(lost.count) || 0,
        archived: parseInt(archived.count) || 0,
        overdue: parseInt(overdue.count) || 0,
        todayFollowups: parseInt(todayFollowups.count) || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/dashboard/by-status — Bar chart data ──────────────────
router.get('/by-status', async (req, res, next) => {
  try {
    let query = db('leads')
      .where('is_archived', false);
    if (req.query.date_from) query = query.where('leads.created_at', '>=', req.query.date_from);
    if (req.query.date_to) query = query.where('leads.created_at', '<=', req.query.date_to);
    if (req.query.centre_id) query = query.where('leads.centre_id', parseInt(req.query.centre_id));
    if (req.query.owner_id) query = query.where('leads.owner_id', parseInt(req.query.owner_id));
    if (req.query.status) query = query.where('leads.status', req.query.status);

    const rows = await query
      .select('status')
      .count('* as count')
      .groupBy('status')
      .orderBy('count', 'desc');

    res.json({
      success: true,
      data: rows.map((r) => ({ status: r.status, count: parseInt(r.count) })),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/dashboard/by-centre ────────────────────────────────────
router.get('/by-centre', async (req, res, next) => {
  try {
    const rows = await db('leads')
      .join('centres', 'leads.centre_id', 'centres.id')
      .where('leads.is_archived', false)
      .select('centres.id', 'centres.name', 'centres.city')
      .count('* as count')
      .groupBy('centres.id')
      .orderBy('count', 'desc');

    res.json({
      success: true,
      data: rows.map((r) => ({ centreId: r.id, name: r.name, city: r.city, count: parseInt(r.count) })),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/dashboard/by-owner ─────────────────────────────────────
router.get('/by-owner', async (req, res, next) => {
  try {
    const rows = await db('leads')
      .join('owners', 'leads.owner_id', 'owners.id')
      .where('leads.is_archived', false)
      .select('owners.id', 'owners.name', 'owners.email')
      .count('* as count')
      .groupBy('owners.id')
      .orderBy('count', 'desc');

    res.json({
      success: true,
      data: rows.map((r) => ({ ownerId: r.id, name: r.name, email: r.email, count: parseInt(r.count) })),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/dashboard/by-source ────────────────────────────────────
router.get('/by-source', async (req, res, next) => {
  try {
    const rows = await db('leads')
      .where('is_archived', false)
      .select('source')
      .count('* as count')
      .groupBy('source')
      .orderBy('count', 'desc');

    res.json({
      success: true,
      data: rows.map((r) => ({ source: r.source, count: parseInt(r.count) })),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/dashboard/overdue — Overdue followups ──────────────────
router.get('/overdue', async (req, res, next) => {
  try {
    const leads = await db('leads')
      .join('centres', 'leads.centre_id', 'centres.id')
      .join('owners', 'leads.owner_id', 'owners.id')
      .where('leads.is_archived', false)
      .whereNotIn('leads.status', ['Converted', 'Lost'])
      .whereNotNull('leads.next_followup_at')
      .where('leads.next_followup_at', '<', db.fn.now())
      .select(
        'leads.id', 'leads.parent_name', 'leads.child_name',
        'leads.status', 'leads.next_followup_at',
        'centres.name as centre_name',
        'owners.name as owner_name'
      )
      .orderBy('leads.next_followup_at', 'asc')
      .limit(50);

    res.json({
      success: true,
      data: leads,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
