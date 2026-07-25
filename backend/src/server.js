/**
 * Centre Lead Tracker — Express Server
 *
 * Entry point for the backend API.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errors');

// Routes
const leadsRouter = require('./routes/leads');
const followupsRouter = require('./routes/followups');
const dashboardRouter = require('./routes/dashboard');
const exportRouter = require('./routes/export');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Request logging (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
  });
}

// ── Health check ───────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    await db.raw('SELECT 1');
    res.json({ success: true, status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ success: false, status: 'error', database: 'disconnected', message: err.message });
  }
});

// ── API Routes ─────────────────────────────────────────────────────
app.use('/api/leads', leadsRouter);
app.use('/api/followups', followupsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/export', exportRouter);
app.use('/api/admin', adminRouter);

// ── Error handling ─────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  Centre Lead Tracker API`);
  console.log(`  Running on http://localhost:${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
