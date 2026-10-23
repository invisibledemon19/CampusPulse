import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';

describe('scripts/seed.mjs validation', () => {
  const seedFile = 'data/seed/opportunities.json';

  it('exits with 0 when seed file is empty', () => {
    writeFileSync(seedFile, '[]');
    const output = execSync('node scripts/seed.mjs', { encoding: 'utf8' });
    expect(output).toContain('Seed file is empty (0 records). Nothing to seed.');
  });

  it('rejects invalid JSON or malformed records', () => {
    writeFileSync(seedFile, JSON.stringify([{ title: 'X' }])); // title too short (< 3 chars)
    expect(() => {
      execSync('node scripts/seed.mjs', { encoding: 'utf8', stdio: 'pipe' });
    }).toThrow();

    // Restore empty array
    writeFileSync(seedFile, '[]');
  });

  it('rejects sample listings without --allow-sample flag', () => {
    const sampleRecord = {
      title: 'Valid Hackathon Title',
      organizer: 'Sample Org',
      category: 'hackathon',
      description: 'A valid hackathon description.',
      tags: ['ai', 'python'],
      registrationFee: 0,
      estimatedTravelCost: null,
      format: 'online',
      city: null,
      venue: null,
      latitude: null,
      longitude: null,
      startDate: '2026-11-01',
      deadline: '2026-10-30',
      eligibilityLevels: ['undergraduate'],
      registrationUrl: '',
      sourceUrl: '',
      status: 'open',
      verificationStatus: 'unverified',
      isSample: true
    };

    writeFileSync(seedFile, JSON.stringify([sampleRecord]));
    expect(() => {
      execSync('node scripts/seed.mjs', { encoding: 'utf8', stdio: 'pipe' });
    }).toThrow();

    // Restore empty array
    writeFileSync(seedFile, '[]');
  });
});
