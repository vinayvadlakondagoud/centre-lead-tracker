/**
 * Date/time utilities for Centre Lead Tracker.
 *
 * Storage: MySQL DATETIME columns store UTC values.
 * API:     Responses include both UTC (ISO 8601) and IST conversion.
 * UI:      Display in Asia/Kolkata (IST = UTC+5:30).
 * CSV:     Export timestamps in UTC ISO 8601.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +5:30

/**
 * Convert a UTC Date/string to an IST Date object.
 */
function toIST(utcDate) {
  const d = utcDate instanceof Date ? new Date(utcDate) : new Date(utcDate);
  return new Date(d.getTime() + IST_OFFSET_MS);
}

/**
 * Format a Date as "DD/MM/YYYY, HH:MM IST" for UI display.
 */
function formatIST(date) {
  const ist = toIST(date);
  const dd = String(ist.getUTCDate()).padStart(2, '0');
  const mm = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = ist.getUTCFullYear();
  const hh = String(ist.getUTCHours()).padStart(2, '0');
  const min = String(ist.getUTCMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy}, ${hh}:${min} IST`;
}

/**
 * Format a Date as ISO 8601 UTC string for CSV export.
 * Example: "2026-01-15T10:30:00Z"
 */
function toISO8601UTC(date) {
  return new Date(date).toISOString();
}

/**
 * Get current UTC time as a MySQL-compatible DATETIME string.
 */
function nowUTC() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

module.exports = { toIST, formatIST, toISO8601UTC, nowUTC, IST_OFFSET_MS };
