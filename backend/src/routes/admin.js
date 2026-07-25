/**
 * /api/admin — Admin-only endpoints
 *
 * GET  /api/admin/centres         — List all centres
 * GET  /api/admin/owners          — List all owners
 * POST /api/admin/centres         — Create centre
 * POST /api/admin/owners          — Create owner
 * PATCH /api/admin/leads/:id/status — Revert Converted → Contacted
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { validate } = require('../middleware/validate');

const router = express.Router();

// ── GET /api/admin/centres ──────────────────────────────────────────
router.get('/centres', async (req, res, next) => {
  try {
    const centres = await db('centres').orderBy('name');
    res.json({ success: true, data: centres });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/owners ───────────────────────────────────────────
router.get('/owners', async (req, res, next) => {
  try {
    const owners = await db('owners').orderBy('name');
    res.json({ success: true, data: owners });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/admin/centres ─────────────────────────────────────────
router.post(
  '/centres',
  [
    body('name').trim().notEmpty().withMessage('Centre name is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('address').optional().trim(),
    body('phone').optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const [id] = await db('centres').insert({
        name: req.body.name.trim(),
        city: req.body.city.trim(),
        address: req.body.address || null,
        phone: req.body.phone || null,
      });
      const centre = await db('centres').where('id', id).first();
      res.status(201).json({ success: true, data: centre });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/admin/owners ──────────────────────────────────────────
router.post(
  '/owners',
  [
    body('name').trim().notEmpty().withMessage('Owner name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').optional().trim(),
    body('is_admin').optional().isBoolean(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const [id] = await db('owners').insert({
        name: req.body.name.trim(),
        email: req.body.email.trim().toLowerCase(),
        phone: req.body.phone || null,
        is_admin: req.body.is_admin || false,
      });
      const owner = await db('owners').where('id', id).first();
      res.status(201).json({ success: true, data: owner });
    } catch (err) {
      next(err);
    }
  }
);

// ── PATCH /api/admin/leads/:id/status — Revert Converted → Contacted ─
router.patch(
  '/leads/:id/status',
  [
    body('status').isIn(['New', 'Contacted', 'Demo Scheduled', 'Demo Completed', 'Converted', 'Lost'])
      .withMessage('Invalid status'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const lead = await db('leads').where('id', id).first();

      if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

      // Allow any status change from admin
      await db('leads').where('id', id).update({
        status: req.body.status,
        updated_at: db.fn.now(),
      });

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

module.exports = router;
