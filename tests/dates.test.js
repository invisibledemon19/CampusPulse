import { describe, it, expect } from 'vitest';
import { parseDateOnly, todayParts, daysLeft, formatDate } from '../src/utils/dates.js';

describe('dates utils', () => {
  it('parses valid dates and rejects invalid dates', () => {
    expect(parseDateOnly('2026-10-24')).toEqual({ y: 2026, m: 10, d: 24 });
    expect(parseDateOnly('2024-02-29')).toEqual({ y: 2024, m: 2, d: 29 }); // Leap year
    expect(parseDateOnly('2026-02-29')).toBeNull(); // Non-leap year
    expect(parseDateOnly('2026-02-30')).toBeNull();
    expect(parseDateOnly('2026-13-01')).toBeNull();
    expect(parseDateOnly('invalid')).toBeNull();
    expect(parseDateOnly(null)).toBeNull();
  });

  it('calculates daysLeft correctly across days and month boundaries', () => {
    const fixedNow = new Date(2026, 9, 24, 12, 0, 0); // 24 Oct 2026
    expect(daysLeft('2026-10-24', fixedNow)).toBe(0);
    expect(daysLeft('2026-10-25', fixedNow)).toBe(1);
    expect(daysLeft('2026-10-23', fixedNow)).toBe(-1);
    expect(daysLeft('2026-11-03', fixedNow)).toBe(10);
    expect(daysLeft(null, fixedNow)).toBeNull();

    // Month boundary: 31 Oct to 1 Nov is exactly 1 day
    const endOfOct = new Date(2026, 9, 31, 10, 0, 0);
    expect(daysLeft('2026-11-01', endOfOct)).toBe(1);
    expect(daysLeft('2026-11-15', endOfOct)).toBe(15);
  });

  it('formats dates consistently', () => {
    expect(formatDate('2026-10-24')).toBe('24 Oct 2026');
    expect(formatDate('2026-11-03')).toBe('3 Nov 2026');
    expect(formatDate('invalid')).toBe('Not provided');
    expect(formatDate(null)).toBe('Not provided');
  });

  it('todayParts extracts calendar date without UTC day shifting', () => {
    const d1 = new Date(2026, 9, 24, 0, 15, 0);
    const parts1 = todayParts(d1);
    expect(parts1).toEqual({ y: 2026, m: 10, d: 24 });

    const d2 = new Date(2026, 9, 24, 23, 45, 0);
    const parts2 = todayParts(d2);
    expect(parts2).toEqual({ y: 2026, m: 10, d: 24 });
  });
});
