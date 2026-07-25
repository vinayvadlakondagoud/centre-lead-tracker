const { describe, it, expect } = require('@jest/globals');
const { normalizePhone } = require('./phone');

describe('normalizePhone', () => {
  it('strips +91 prefix and spaces', () => {
    expect(normalizePhone('+91 98765 43210')).toBe('9876543210');
  });

  it('strips leading zeros', () => {
    expect(normalizePhone('09876543210')).toBe('9876543210');
  });

  it('strips dashes and parentheses', () => {
    expect(normalizePhone('+91-87654-32109')).toBe('8765432109');
    expect(normalizePhone('(022) 2345-6789')).toBe('223456789');
  });

  it('handles 10-digit number without prefix', () => {
    expect(normalizePhone('9876543210')).toBe('9876543210');
  });

  it('takes last 10 digits for longer numbers', () => {
    expect(normalizePhone('919876543210')).toBe('9876543210');
  });

  it('returns empty string for null/undefined/empty', () => {
    expect(normalizePhone(null)).toBe('');
    expect(normalizePhone(undefined)).toBe('');
    expect(normalizePhone('')).toBe('');
  });

  it('strips all non-digit characters', () => {
    expect(normalizePhone('abc9876543210xyz')).toBe('9876543210');
  });
});
