/**
 * /api/followups — Follow-up CRUD for a lead
 *
 * GET    /api/followups/:leadId         — List followups for a lead
 * POST   /api/followups/:leadId         — Add followup to a lead
 * PUT    /api/followups/:leadId/:fid    — Update a followup
 * DELETE /api/followups/:leadId/:fid    — Delete a followup
 */

const express = require('express');
const { body, param } = require('express-validator');
const db = require('../config/db');
const { validate } = require('../middleware/validate');

const router = express.Router({ mergeParams: true });

const CLOSED_STATUSES = ['Converted', 'Lost'];

// ── GET /api/followups/:leadId ──────────────────────────────────────
router.get('/:leadId', async (req, res, next) => {
  try {
    const leadId = parseInt(req.params.leadId);
    const lead = await db('leads').where('id', leadId).first();
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    const followups = await db('followups')
      .where('lead_id', leadId)
      .orderBy('followed_up_at', 'desc');

    res.json({ success: true, data: followups });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/followups/:leadId ─────────────────────────────────────
router.post(
  '/:leadId',
  [
    param('leadId').isInt().withMessage('Invalid lead ID'),
    body('channel').isIn(['Phone', 'WhatsApp', 'Email', 'In-Person', 'Walk-in', 'SMS', 'Other']).withMessage('Invalid channel'),
    body('outcome').isIn(['Reached', 'No Response', 'Busy', 'Voicemail', 'Interested', 'Not Interested', 'Rescheduled', 'Callback Scheduled', 'Converted']).withMessage('Invalid outcome'),
    body('followed_up_at').optional({ nullable: true }).isISO8601(),
    body('notes').optional({ nullable: true }).trim(),
    body('next_followup_at').optional({ nullable: true }).isISO8601(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const lead = await db('leads').where('id', leadId).first();
      if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

      if (lead.is_archived) {
        return res.status(400).json({ success: false, error: 'Cannot add followup to archived lead' });
      }

      if (CLOSED_STATUSES.includes(lead.status)) {
        return res.status(400).json({ success: false, error: `Lead is ${lead.status}. No new followups allowed.` });
      }

      const [fid] = await db('followups').insert({
        lead_id: leadId,
        followed_up_at: req.body.followed_up_at || db.fn.now(),
        channel: req.body.channel,
        outcome: req.body.outcome,
        notes: req.body.notes || null,
        next_followup_at: req.body.next_followup_at || null,
      });

      // Auto-update lead's next_followup_at if provided
      if (req.body.next_followup_at) {
        await db('leads').where('id', leadId).update({ next_followup_at: req.body.next_followup_at, updated_at: db.fn.now() });
      }

      // Auto-advance status based on outcome
      const statusMap = {
        'Interested': 'Contacted',
        'Connected': 'Contacted',
      };
      if (statusMap[req.body.outcome] && lead.status === 'New') {
        await db('leads').where('id', leadId).update({ status: statusMap[req.body.outcome], updated_at: db.fn.now() });
      }

      const followup = await db('followups').where('id', fid).first();
      res.status(201).json({ success: true, data: followup });
    } catch (err) {
      next(err);
    }
  }
);

// ── PUT /api/followups/:leadId/:fid ─────────────────────────────────
router.put(
  '/:leadId/:fid',
  [
    param('leadId').isInt(),
    param('fid').isInt(),
    body('channel').optional().isIn(['Phone', 'WhatsApp', 'Email', 'In-Person', 'Walk-in', 'SMS', 'Other']),
    body('outcome').optional().isIn(['Reached', 'No Response', 'Busy', 'Voicemail', 'Interested', 'Not Interested', 'Rescheduled', 'Callback Scheduled', 'Converted']),
    body('notes').optional({ nullable: true }).trim(),
    body('next_followup_at').optional({ nullable: true }).isISO8601(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { leadId, fid } = req.params;
      const lead = await db('leads').where('id', parseInt(leadId)).first();
      if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
      if (lead.is_archived) return res.status(400).json({ success: false, error: 'Lead is archived' });

      const followup = await db('followups').where({ id: parseInt(fid), lead_id: parseInt(leadId) }).first();
      if (!followup) return res.status(404).json({ success: false, error: 'Followup not found' });

      const updates = {};
      if (req.body.channel) updates.channel = req.body.channel;
      if (req.body.outcome) updates.outcome = req.body.outcome;
      if ('notes' in req.body) updates.notes = req.body.notes || null;
      if ('next_followup_at' in req.body) updates.next_followup_at = req.body.next_followup_at || null;

      await db('followups').where('id', parseInt(fid)).update(updates);

      const updated = await db('followups').where('id', parseInt(fid)).first();
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// ── DELETE /api/followups/:leadId/:fid ──────────────────────────────
router.delete('/:leadId/:fid', async (req, res, next) => {
  try {
    const { leadId, fid } = req.params;
    const deleted = await db('followups').where({ id: parseInt(fid), lead_id: parseInt(leadId) }).del();
    if (!deleted) return res.status(404).json({ success: false, error: 'Followup not found' });
    res.json({ success: true, message: 'Followup deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
