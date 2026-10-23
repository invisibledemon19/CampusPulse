import { describe, it, expect } from 'vitest';
import { validateProfile, validateSaved } from '../src/utils/validate.js';

describe('validate utils', () => {
  it('validates profile fields', () => {
    const valid = {
      displayName: 'Aarav Sharma',
      educationLevel: 'undergraduate',
      location: 'Delhi',
      maxDistanceKm: 50,
      maxRegistrationFee: 500,
      skills: ['Python', 'React'],
      interests: ['AI', 'Hackathons'],
      preferredFormat: 'offline'
    };
    expect(validateProfile(valid).valid).toBe(true);

    const emptyName = { ...valid, displayName: '' };
    expect(validateProfile(emptyName).valid).toBe(false);

    const badEducation = { ...valid, educationLevel: 'highschool' };
    expect(validateProfile(badEducation).valid).toBe(false);

    const negativeFee = { ...valid, maxRegistrationFee: -10 };
    expect(validateProfile(negativeFee).valid).toBe(false);

    const tooManySkills = { ...valid, skills: new Array(31).fill('skill') };
    expect(validateProfile(tooManySkills).valid).toBe(false);

    const tooManyInterests = { ...valid, interests: new Array(31).fill('interest') };
    expect(validateProfile(tooManyInterests).valid).toBe(false);

    const badDistance = { ...valid, maxDistanceKm: 2500 };
    expect(validateProfile(badDistance).valid).toBe(false);

    const badFormat = { ...valid, preferredFormat: 'remote' };
    expect(validateProfile(badFormat).valid).toBe(false);

    expect(validateProfile(null).valid).toBe(false);
  });

  it('validates saved opportunity fields', () => {
    const validSaved = {
      opportunityId: 'opp-1',
      applicationStatus: 'interested',
      nextSteps: [{ id: 's1', task: 'Review', completed: false }],
      notes: 'Some notes'
    };
    expect(validateSaved(validSaved)).toBe(true);

    const badStatus = { ...validSaved, applicationStatus: 'unknown' };
    expect(validateSaved(badStatus)).toBe(false);

    const longNotes = { ...validSaved, notes: 'a'.repeat(1001) };
    expect(validateSaved(longNotes)).toBe(false);

    const tooManySteps = { ...validSaved, nextSteps: new Array(21).fill({ id: '1', task: 't', completed: false }) };
    expect(validateSaved(tooManySteps)).toBe(false);

    expect(validateSaved(null)).toBe(false);
    expect(validateSaved({ opportunityId: '' })).toBe(false);
  });
});
