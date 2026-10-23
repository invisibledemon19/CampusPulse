import { describe, it, expect } from 'vitest';
import { rankOpportunities, WEIGHTS } from '../src/utils/scoring.js';

describe('Opportunity Fit Score specification (section 6.8)', () => {
  const fixedNow = new Date(2026, 9, 24, 12, 0, 0);

  it('verifies weights sum to 1.0', () => {
    const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(Math.round(sum * 100) / 100).toBe(1.0);
  });

  it('case 1: reference listing scores 93', () => {
    const opp = {
      id: 'ref-1',
      title: 'AI Sprint',
      category: 'hackathon',
      tags: ['AI', 'Python', 'ML'],
      registrationFee: 0,
      format: 'offline',
      city: 'Delhi',
      deadline: '2026-11-03',
      eligibilityLevels: ['undergraduate'],
      status: 'open'
    };

    const profile = {
      educationLevel: 'undergraduate',
      location: 'Greater Noida',
      skills: ['Python', 'JavaScript'],
      interests: ['AI', 'Hackathons'],
      maxRegistrationFee: 0,
      preferredFormat: 'offline',
      latitude: null,
      longitude: null
    };

    const result = rankOpportunities([opp], profile, fixedNow);
    expect(result.ranked.length).toBe(1);
    const item = result.ranked[0];
    expect(item.score).toBe(93);
    expect(item.components).toEqual({
      skills: 100,
      eligibility: 100,
      location: 70,
      budget: 100,
      deadline: 90,
      format: 100
    });
  });

  it('case 2: paid listing with fee 500 and limit 0 is excluded with code budget', () => {
    const opp = {
      id: 'paid-1',
      title: 'Paid Workshop',
      category: 'workshop',
      registrationFee: 500,
      deadline: '2026-11-03',
      status: 'open'
    };
    const profile = {
      educationLevel: 'undergraduate',
      maxRegistrationFee: 0
    };

    const result = rankOpportunities([opp], profile, fixedNow);
    expect(result.excluded.length).toBe(1);
    expect(result.excluded[0].excluded.code).toBe('budget');
    expect(result.excluded[0].score).toBeNull();
  });

  it('case 3: deadline 2026-10-23 is excluded (closed), 2026-10-24 is included with level today', () => {
    const closedOpp = {
      id: 'closed-1',
      title: 'Past Event',
      category: 'event',
      deadline: '2026-10-23',
      status: 'open'
    };
    const todayOpp = {
      id: 'today-1',
      title: 'Today Event',
      category: 'event',
      deadline: '2026-10-24',
      status: 'open'
    };
    const profile = { educationLevel: 'undergraduate' };

    const result = rankOpportunities([closedOpp, todayOpp], profile, fixedNow);
    const excludedClosed = result.excluded.find((e) => e.opportunity.id === 'closed-1');
    expect(excludedClosed).toBeDefined();
    expect(excludedClosed.excluded.code).toBe('closed');

    const rankedToday = result.ranked.find((r) => r.opportunity.id === 'today-1');
    expect(rankedToday).toBeDefined();
    expect(rankedToday.urgency.level).toBe('today');
  });

  it('case 4: profile undergraduate vs postgraduate is excluded with code eligibility', () => {
    const opp = {
      id: 'postgrad-only',
      title: 'Postgrad Symposium',
      category: 'event',
      eligibilityLevels: ['postgraduate'],
      status: 'open'
    };
    const profile = { educationLevel: 'undergraduate' };

    const result = rankOpportunities([opp], profile, fixedNow);
    expect(result.excluded.length).toBe(1);
    expect(result.excluded[0].excluded.code).toBe('eligibility');
  });

  it('case 5: missing data scores 50 with matching warnings', () => {
    const opp = {
      id: 'sparse-1',
      title: 'Sparse Listing',
      category: 'event',
      tags: [],
      registrationFee: null,
      deadline: null,
      city: null,
      eligibilityLevels: [],
      format: 'offline',
      status: 'open'
    };
    const profile = {
      educationLevel: 'undergraduate',
      preferredFormat: 'offline',
      maxRegistrationFee: 0
    };

    const result = rankOpportunities([opp], profile, fixedNow);
    expect(result.ranked.length).toBe(1);
    const item = result.ranked[0];
    expect(item.score).toBe(50);
    expect(item.warnings).toContain('Skill tags not provided');
    expect(item.warnings).toContain('Location not provided');
    expect(item.warnings).toContain('Registration fee not provided');
    expect(item.warnings).toContain('Deadline not provided');
  });

  it('case 6: Machine Learning matches ML', () => {
    const opp = {
      id: 'ml-opp',
      title: 'ML Jam',
      tags: ['ML'],
      status: 'open'
    };
    const profile = {
      educationLevel: 'undergraduate',
      skills: ['Machine Learning']
    };

    const result = rankOpportunities([opp], profile, fixedNow);
    expect(result.ranked[0].components.skills).toBe(100);
  });

  it('case 7: changing interests changes the order of two listings', () => {
    const oppA = {
      id: 'opp-a',
      title: 'Web Design Jam',
      category: 'hackathon',
      tags: ['CSS', 'HTML', 'Design'],
      status: 'open'
    };
    const oppB = {
      id: 'opp-b',
      title: 'Python Sprint',
      category: 'hackathon',
      tags: ['Python', 'Django', 'Backend'],
      status: 'open'
    };

    const profileDesign = {
      educationLevel: 'undergraduate',
      interests: ['Design', 'CSS']
    };
    const profilePython = {
      educationLevel: 'undergraduate',
      interests: ['Python', 'Backend']
    };

    const resultDesign = rankOpportunities([oppA, oppB], profileDesign, fixedNow);
    expect(resultDesign.ranked[0].opportunity.id).toBe('opp-a');

    const resultPython = rankOpportunities([oppA, oppB], profilePython, fixedNow);
    expect(resultPython.ranked[0].opportunity.id).toBe('opp-b');
  });

  it('case 8: online listing for user in another city gets L = 100', () => {
    const opp = {
      id: 'online-opp',
      title: 'Global Online Sprint',
      category: 'hackathon',
      format: 'online',
      city: 'Mumbai',
      status: 'open'
    };
    const profile = {
      location: 'Delhi'
    };

    const result = rankOpportunities([opp], profile, fixedNow);
    expect(result.ranked[0].components.location).toBe(100);
  });

  it('case 9: hybrid listing in a different city gets L = 80', () => {
    const opp = {
      id: 'hybrid-opp',
      title: 'Hybrid Summit',
      category: 'event',
      format: 'hybrid',
      city: 'Bengaluru',
      status: 'open'
    };
    const profile = {
      location: 'Delhi'
    };

    const result = rankOpportunities([opp], profile, fixedNow);
    expect(result.ranked[0].components.location).toBe(80);
  });

  it('case 10: profile = null returns score: null and sorts by deadline', () => {
    const opp1 = {
      id: 'd-soon',
      title: 'Soon Event',
      category: 'event',
      deadline: '2026-10-28',
      status: 'open'
    };
    const opp2 = {
      id: 'd-later',
      title: 'Later Event',
      category: 'event',
      deadline: '2026-11-15',
      status: 'open'
    };

    const result = rankOpportunities([opp2, opp1], null, fixedNow);
    expect(result.ranked.every((r) => r.score === null)).toBe(true);
    expect(result.ranked[0].opportunity.id).toBe('d-soon');
    expect(result.ranked[1].opportunity.id).toBe('d-later');
  });

  it('case 11: coordinates on both sides produce distanceKm', () => {
    const opp = {
      id: 'geo-opp',
      title: 'Local Hackathon',
      category: 'hackathon',
      format: 'offline',
      latitude: 28.6139,
      longitude: 77.2090,
      status: 'open'
    };
    const profileWithCoords = {
      educationLevel: 'undergraduate',
      maxDistanceKm: 100,
      latitude: 28.5355,
      longitude: 77.3910
    };
    const profileNoCoords = {
      educationLevel: 'undergraduate',
      maxDistanceKm: 100,
      latitude: null,
      longitude: null
    };

    const resultWith = rankOpportunities([opp], profileWithCoords, fixedNow);
    expect(resultWith.ranked[0].distanceKm).toBeTypeOf('number');

    const resultNo = rankOpportunities([opp], profileNoCoords, fixedNow);
    expect(resultNo.ranked[0].distanceKm).toBeNull();
  });

  it('case 12: malformed data does not throw and is treated as missing', () => {
    const malformedOpp = {
      id: 'bad-data',
      title: 'Malformed Listing',
      category: 'event',
      tags: [123, null, { foo: 'bar' }],
      registrationFee: 'free',
      status: 'open'
    };
    const profile = { educationLevel: 'undergraduate' };

    expect(() => rankOpportunities([malformedOpp], profile, fixedNow)).not.toThrow();
    const result = rankOpportunities([malformedOpp], profile, fixedNow);
    expect(result.ranked[0].warnings).toContain('Registration fee not provided');
  });
});
