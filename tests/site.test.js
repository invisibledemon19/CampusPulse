import { describe, it, expect } from 'vitest';
import {
  SITE_NAME,
  OWNER_NAME,
  CONTACT_EMAIL,
  GOVERNING_CITY,
  GOVERNING_STATE,
  SITE_URL,
  LEGAL_LAST_UPDATED
} from '../src/config/site.js';

describe('site config (src/config/site.js)', () => {
  it('exports expected site configuration constants', () => {
    expect(SITE_NAME).toBe('CampusPlus');
    expect(typeof OWNER_NAME).toBe('string');
    expect(OWNER_NAME.length).toBeGreaterThan(0);
    expect(typeof CONTACT_EMAIL).toBe('string');
    expect(CONTACT_EMAIL).toContain('@');
    expect(typeof GOVERNING_CITY).toBe('string');
    expect(GOVERNING_CITY.length).toBeGreaterThan(0);
    expect(typeof GOVERNING_STATE).toBe('string');
    expect(GOVERNING_STATE.length).toBeGreaterThan(0);
    expect(typeof SITE_URL).toBe('string');
    expect(SITE_URL).toMatch(/^https?:\/\//);
    expect(typeof LEGAL_LAST_UPDATED).toBe('string');
    expect(LEGAL_LAST_UPDATED.length).toBeGreaterThan(0);
  });
});
