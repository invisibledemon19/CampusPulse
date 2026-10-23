import { describe, it, expect } from 'vitest';
import { ALIASES } from '../src/data/aliases.js';
import { REGIONS, getRegionForCity } from '../src/data/regions.js';
import { DEFAULT_STEPS, getDefaultStepsForCategory } from '../src/data/defaultSteps.js';

describe('data modules', () => {
  describe('aliases.js', () => {
    it('contains all required starter aliases', () => {
      expect(ALIASES['artificial intelligence']).toBe('ai');
      expect(ALIASES['machine learning']).toBe('ml');
      expect(ALIASES['js']).toBe('javascript');
      expect(ALIASES['node']).toBe('nodejs');
      expect(ALIASES['node.js']).toBe('nodejs');
      expect(ALIASES['nodejs']).toBe('nodejs');
      expect(ALIASES['reactjs']).toBe('react');
      expect(ALIASES['react.js']).toBe('react');
      expect(ALIASES['py']).toBe('python');
      expect(ALIASES['hackathons']).toBe('hackathon');
      expect(ALIASES['internships']).toBe('internship');
      expect(ALIASES['workshops']).toBe('workshop');
      expect(ALIASES['events']).toBe('event');
    });
  });

  describe('regions.js', () => {
    it('contains the NCR region with required cities', () => {
      expect(REGIONS.NCR).toBeDefined();
      const ncrCities = REGIONS.NCR;
      expect(ncrCities).toContain('delhi');
      expect(ncrCities).toContain('new delhi');
      expect(ncrCities).toContain('noida');
      expect(ncrCities).toContain('greater noida');
      expect(ncrCities).toContain('ghaziabad');
      expect(ncrCities).toContain('gurugram');
      expect(ncrCities).toContain('gurgaon');
      expect(ncrCities).toContain('faridabad');
    });

    it('resolves city to region correctly case-insensitively', () => {
      expect(getRegionForCity('Delhi')).toBe('NCR');
      expect(getRegionForCity('  NOIDA ')).toBe('NCR');
      expect(getRegionForCity('Gurgaon')).toBe('NCR');
      expect(getRegionForCity('Bengaluru')).toBeNull();
      expect(getRegionForCity('')).toBeNull();
      expect(getRegionForCity(null)).toBeNull();
    });
  });

  describe('defaultSteps.js', () => {
    it('provides exact default steps for each category', () => {
      expect(DEFAULT_STEPS.hackathon).toEqual([
        'Check eligibility and team size',
        'Prepare a project idea',
        'Confirm teammates',
        'Confirm the venue or joining link',
        "Register on the organizer's site"
      ]);

      expect(DEFAULT_STEPS.internship).toEqual([
        'Check eligibility',
        'Update your resume',
        'Collect portfolio or project links',
        "Apply on the organizer's site",
        'Note the interview date'
      ]);

      expect(DEFAULT_STEPS.workshop).toEqual([
        'Check prerequisites',
        "Register on the organizer's site",
        'Add the date to your calendar',
        'Install the tools you need'
      ]);

      expect(DEFAULT_STEPS.event).toEqual([
        'Check eligibility',
        "Register on the organizer's site",
        'Confirm the venue',
        'Add the date to your calendar'
      ]);
    });

    it('formats steps with id and completed flag', () => {
      const steps = getDefaultStepsForCategory('hackathon');
      expect(steps.length).toBe(5);
      expect(steps[0]).toEqual({
        id: 'step-1',
        task: 'Check eligibility and team size',
        completed: false
      });
    });

    it('falls back to event steps for unknown category', () => {
      const steps = getDefaultStepsForCategory('unknown-cat');
      expect(steps.length).toBe(4);
      expect(steps[0].task).toBe('Check eligibility');
    });
  });
});
