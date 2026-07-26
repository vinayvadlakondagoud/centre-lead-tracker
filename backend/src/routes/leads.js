/**
 * /api/leads — Lead CRUD + archive/restore (soft delete rule)
 *
 * GET    /api/leads          — List (paginated, filtered)
 * POST   /api/leads          — Create
 * GET    /api/leads/:id      — Read (with followups)
 * PUT    /api/leads/:id      — Update (blocked if closed, except notes)
 * PATCH  /api/leads/:id/archive — Archive (soft delete)
 * PATCH  /api/leads/:id/restore — Restore archived lead
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const db = require('../config/db');
const { normalizePhone } = require('../utils/phone');
const { validate } = require('../middleware/validate');
const { logStatusChange } = require('../utils/audit');

const router = express.Router();

// ── Closed statuses ──────────────────────────────────────────────────
const CLOSED_STATUSES = ['Converted', 'Lost'];

// ── GET /api/leads — Paginated list with filters ────────────────────
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    let query = db('leads')
      .join('centres', 'leads.centre_id', 'centres.id')
      .join('owners', 'leads.owner_id', 'owners.id')
      .select(
        'leads.*',
        'centres.name as centre_name',
        'centres.city as centre_city',
        'owners.name as owner_name',
        'owners.email as owner_email'
      );

    // Default: hide archived leads unless explicitly requested
    if (req.query.archived === 'true') {
      query = query.where('leads.is_archived', true);
    } else if (req.query.archived !== 'all') {
      query = query.where('leads.is_archived', false);
    }

    // Filters
    if (req.query.centre_id) {
      query = query.where('leads.centre_id', parseInt(req.query.centre_id));
    }
    if (req.query.owner_id) {
      query = query.where('leads.owner_id', parseInt(req.query.owner_id));
    }
    if (req.query.status) {
      query = query.where('leads.status', req.query.status);
    }
    if (req.query.source) {
      query = query.where('leads.source', req.query.source);
    }
    if (req.query.search) {
      const s = `%${req.query.search}%`;
      query = query.where(function () {
        this.where('leads.parent_name', 'like', s)
          .orWhere('leads.child_name', 'like', s)
          .orWhere('leads.email', 'like', s)
          .orWhere('leads.phone', 'like', s);
      });
    }
    if (req.query.date_from) {
      query = query.where('leads.created_at', '>=', req.query.date_from);
    }
    if (req.query.date_to) {
      query = query.where('leads.created_at', '<=', req.query.date_to);
    }

    // Count total
    const countQuery = query.clone().clearSelect().count('* as total').first();
    const [{ total }] = await Promise.all([countQuery]);
    const totalCount = parseInt(total) || 0;

    // Fetch page
    const leads = await query.orderBy('leads.created_at', 'desc').limit(limit).offset(offset);

    res.json({
      success: true,
      data: leads,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/leads — Create ────────────────────────────────────────
router.post(
  '/',
  [
    body('parent_name').trim().notEmpty().withMessage('Parent name is required'),
    body('child_name').trim().notEmpty().withMessage('Child name is required'),
    body('child_age').isInt({ min: 1, max: 18 }).withMessage('Child age must be 1-18'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('centre_id').isInt().withMessage('Centre ID is required'),
    body('source').trim().notEmpty().withMessage('Source is required'),
    body('owner_id').isInt().withMessage('Owner ID is required'),
    body('status').optional().isIn(['New', 'Contacted', 'Demo Scheduled', 'Demo Completed', 'Converted', 'Lost']),
    body('next_followup_at').optional({ nullable: true }).isISO8601(),
    body('notes').optional({ nullable: true }).trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const phoneNorm = normalizePhone(req.body.phone);

      if (phoneNorm.length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Phone must contain at least 10 digits',
        });
      }

      // Duplicate check: same normalized phone + not archived
      const existing = await db('leads')
        .where('phone_normalized', phoneNorm)
        .where('is_archived', false)
        .first();

      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'Duplicate Lead',
          message: `An active lead with this phone number already exists (ID: ${existing.id})`,
        });
      }

      const [leadId] = await db('leads').insert({
        parent_name: req.body.parent_name.trim(),
        child_name: req.body.child_name.trim(),
        child_age: req.body.child_age,
        phone: req.body.phone.trim(),
        phone_normalized: phoneNorm,
        email: req.body.email.trim().toLowerCase(),
        centre_id: req.body.centre_id,
        source: req.body.source.trim(),
        owner_id: req.body.owner_id,
        status: req.body.status || 'New',
        next_followup_at: req.body.next_followup_at || null,
        notes: req.body.notes || null,
      });

      const lead = await db('leads')
        .join('centres', 'leads.centre_id', 'centres.id')
        .join('owners', 'leads.owner_id', 'owners.id')
        .select('leads.*', 'centres.name as centre_name', 'owners.name as owner_name')
        .where('leads.id', leadId)
        .first();

      res.status(201).json({ success: true, data: lead });

      // Audit: log initial status
      logStatusChange({
        lead_id: leadId,
        old_status: null,
        new_status: req.body.status || 'New',
        changed_by: req.body.owner_id ? `owner:${req.body.owner_id}` : 'system',
        reason: 'Lead created',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/leads/:id — Single lead with followups ─────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const lead = await db('leads')
      .join('centres', 'leads.centre_id', 'centres.id')
      .join('owners', 'leads.owner_id', 'owners.id')
      .select('leads.*', 'centres.name as centre_name', 'owners.name as owner_name')
      .where('leads.id', id)
      .first();

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const followups = await db('followups')
      .where('lead_id', id)
      .orderBy('followed_up_at', 'desc');

    res.json({ success: true, data: { ...lead, followups } });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/leads/:id — Update ─────────────────────────────────────
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid lead ID'),
    body('parent_name').optional().trim().notEmpty(),
    body('child_name').optional().trim().notEmpty(),
    body('child_age').optional().isInt({ min: 1, max: 18 }),
    body('phone').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
    body('centre_id').optional().isInt(),
    body('source').optional().trim().notEmpty(),
    body('owner_id').optional().isInt(),
    body('status').optional().isIn(['New', 'Contacted', 'Demo Scheduled', 'Demo Completed', 'Converted', 'Lost']),
    body('next_followup_at').optional({ nullable: true }).isISO8601(),
    body('notes').optional({ nullable: true }).trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const lead = await db('leads').where('id', id).first();

      if (!lead) {
        return res.status(404).json({ success: false, error: 'Lead not found' });
      }

      if (lead.is_archived) {
        return res.status(400).json({
          success: false,
          error: 'Cannot edit archived lead',
          message: 'Restore the lead first before editing',
        });
      }

      // Closed leads: only notes can be edited
      if (CLOSED_STATUSES.includes(lead.status)) {
        const allowedFields = ['notes'];
        const requestedFields = Object.keys(req.body).filter((k) => k !== 'id');
        const disallowed = requestedFields.filter((f) => !allowedFields.includes(f));

        if (disallowed.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Lead is closed',
            message: `Lead status is "${lead.status}". Only notes can be edited for closed leads. Disallowed fields: ${disallowed.join(', ')}`,
          });
        }
      }

      const updates = {};
      if (req.body.parent_name) updates.parent_name = req.body.parent_name.trim();
      if (req.body.child_name) updates.child_name = req.body.child_name.trim();
      if (req.body.child_age) updates.child_age = req.body.child_age;
      if (req.body.phone) {
        updates.phone = req.body.phone.trim();
        updates.phone_normalized = normalizePhone(req.body.phone);

        // Check duplicate if phone changed
        if (updates.phone_normalized !== lead.phone_normalized) {
          const dup = await db('leads')
            .where('phone_normalized', updates.phone_normalized)
            .where('is_archived', false)
            .whereNot('id', id)
            .first();
          if (dup) {
            return res.status(409).json({
              success: false,
              error: 'Duplicate Lead',
              message: `Another active lead with this phone number exists (ID: ${dup.id})`,
            });
          }
        }
      }
      if (req.body.email) updates.email = req.body.email.trim().toLowerCase();
      if (req.body.centre_id) updates.centre_id = req.body.centre_id;
      if (req.body.source) updates.source = req.body.source.trim();
      if (req.body.owner_id) updates.owner_id = req.body.owner_id;
      if (req.body.status) updates.status = req.body.status;
      if ('next_followup_at' in req.body) updates.next_followup_at = req.body.next_followup_at || null;
      if ('notes' in req.body) updates.notes = req.body.notes || null;

      updates.updated_at = db.fn.now();

      const oldStatus = lead.status;
      await db('leads').where('id', id).update(updates);

      // Audit: log status change if status was modified
      if (req.body.status && req.body.status !== oldStatus) {
        logStatusChange({
          lead_id: id,
          old_status: oldStatus,
          new_status: req.body.status,
          changed_by: req.body.performed_by || `owner:${lead.owner_id}`,
          reason: req.body.reason || null,
        });
      }

      const updated = await db('leads')
        .join('centres', 'leads.centre_id', 'centres.id')
        .join('owners', 'leads.owner_id', 'owners.id')
        .select('leads.*', 'centres.name as centre_name', 'owners.name as owner_name')
        .where('leads.id', id)
        .first();

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// ── PATCH /api/leads/:id/archive — Soft delete ──────────────────────
router.patch('/:id/archive', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const lead = await db('leads').where('id', id).first();

    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
    if (lead.is_archived) {
      return res.status(400).json({ success: false, message: 'Lead is already archived' });
    }

    await db('leads').where('id', id).update({
      is_archived: true,
      archived_at: db.fn.now(),
      updated_at: db.fn.now(),
    });

    await db('archive_logs').insert({
      lead_id: id,
      action: 'archived',
      performed_by: req.body.performed_by || 'system',
      reason: req.body.reason || null,
    });

    res.json({ success: true, message: 'Lead archived successfully' });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/leads/:id/restore — Restore archived lead ────────────
router.patch('/:id/restore', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const lead = await db('leads').where('id', id).first();

    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
    if (!lead.is_archived) {
      return res.status(400).json({ success: false, message: 'Lead is not archived' });
    }

    // Check if restoring would create a duplicate
    const dup = await db('leads')
      .where('phone_normalized', lead.phone_normalized)
      .where('is_archived', false)
      .whereNot('id', id)
      .first();

    if (dup) {
      return res.status(409).json({
        success: false,
        error: 'Cannot restore',
        message: `An active lead with this phone already exists (ID: ${dup.id}). Archive or merge that lead first.`,
      });
    }

    await db('leads').where('id', id).update({
      is_archived: false,
      archived_at: null,
      updated_at: db.fn.now(),
    });

    await db('archive_logs').insert({
      lead_id: id,
      action: 'restored',
      performed_by: req.body.performed_by || 'system',
      reason: req.body.reason || null,
    });

    res.json({ success: true, message: 'Lead restored successfully' });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/leads/:id/audit — Status change history ────────────────
router.get('/:id/audit', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const lead = await db('leads').where('id', id).first();

    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    const logs = await db('status_audit_logs')
      .where('lead_id', id)
      .orderBy('created_at', 'desc');

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
