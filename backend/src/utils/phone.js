/**
 * Phone number normalization utility.
 *
 * Strategy: Strip all non-digit characters, then remove leading zeros.
 * Store and compare only the last 10 digits.
 *
 * This handles: +91, 91 prefix, spaces, dashes, parentheses, leading zeros.
 * Example: "+91 98765 43210" → "9876543210"
 *          "0912345678"       → "912345678"
 *          "  7654321098  "   → "7654321098"
 */
function normalizePhone(raw) {
  if (!raw) return '';
  // Strip everything except digits
  const digits = raw.replace(/\D/g, '');
  // Remove leading zeros
  const cleaned = digits.replace(/^0+/, '');
  // Take last 10 digits (handles +91 / 91 prefix for Indian numbers)
  return cleaned.slice(-10);
}

module.exports = { normalizePhone };
