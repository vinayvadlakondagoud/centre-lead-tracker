import { describe, it, expect } from 'vitest';
import { formatIST, isOverdue } from './helpers';

describe('formatIST', () => {
  it('formats a UTC date string to IST display', () => {
    const result = formatIST('2026-01-15T10:30:00Z');
    // IST = UTC + 5:30 → 16:00
    expect(result).toContain('15/01/2026');
    expect(result).toContain('04:00');
  });

  it('returns "-" for null/undefined', () => {
    expect(formatIST(null)).toBe('-');
    expect(formatIST(undefined)).toBe('-');
  });
});

describe('isOverdue', () => {
  it('returns true for past dates', () => {
    expect(isOverdue('2020-01-01T00:00:00Z')).toBe(true);
  });

  it('returns false for future dates', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    expect(isOverdue(future.toISOString())).toBe(false);
  });

  it('returns false for null', () => {
    expect(isOverdue(null)).toBe(false);
  });
});
