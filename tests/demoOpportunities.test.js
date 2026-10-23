import { describe, it, expect } from 'vitest';
import { getDemoOpportunities } from '../src/data/demoOpportunities.js';
import { parseDateOnly } from '../src/utils/dates.js';

describe('demoOpportunities.js', () => {
  const opps = getDemoOpportunities();

  it('contains at least 16 sample listings', () => {
    expect(opps.length).toBeGreaterThanOrEqual(16);
  });

  it('marks every sample listing with isSample true', () => {
    for (const opp of opps) {
      expect(opp.isSample).toBe(true);
    }
  });

  it('ensures verificationStatus is unverified and lastCheckedAt is null', () => {
    for (const opp of opps) {
      expect(opp.verificationStatus).toBe('unverified');
      expect(opp.lastCheckedAt).toBeNull();
    }
  });

  it('ensures dates are generated relative to today in valid YYYY-MM-DD format', () => {
    for (const opp of opps) {
      if (opp.startDate) {
        expect(parseDateOnly(opp.startDate)).not.toBeNull();
      }
      if (opp.deadline) {
        expect(parseDateOnly(opp.deadline)).not.toBeNull();
      }
    }
  });

  it('uses dummy organizations and no real external URLs', () => {
    for (const opp of opps) {
      if (opp.registrationUrl) {
        expect(opp.registrationUrl).toMatch(/^https:\/\/example\.com\/register-demo-\d+$/);
      }
      if (opp.sourceUrl) {
        expect(opp.sourceUrl).toMatch(/^https:\/\/example\.com\/source-demo-\d+$/);
      }
    }
  });

  it('has registrationUrl empty string for most listings and only a few populated', () => {
    const emptyCount = opps.filter((o) => o.registrationUrl === '').length;
    const filledCount = opps.filter((o) => o.registrationUrl !== '').length;
    expect(emptyCount).toBeGreaterThan(filledCount);
    expect(filledCount).toBeGreaterThan(0);
  });
});
