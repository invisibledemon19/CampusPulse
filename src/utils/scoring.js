import { daysLeft, formatDate, parseDateOnly, todayParts } from './dates.js';
import { normalizeTag } from './tags.js';
import { getRegionForCity } from '../data/regions.js';

export const WEIGHTS = {
  skills: 0.30,
  eligibility: 0.20,
  location: 0.20,
  budget: 0.15,
  deadline: 0.10,
  format: 0.05
};

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function computeUrgency(opportunity, days, isClosed) {
  if (isClosed || opportunity.status === 'closed' || opportunity.status === 'cancelled') {
    if (opportunity.deadline) {
      return { level: 'closed', daysLeft: days, label: `Closed on ${formatDate(opportunity.deadline)}` };
    }
    return { level: 'closed', daysLeft: days, label: 'Closed' };
  }

  if (days === null || days === undefined) {
    return { level: 'none', daysLeft: null, label: 'Deadline not provided' };
  }

  if (days < 0) {
    return { level: 'closed', daysLeft: days, label: `Closed on ${formatDate(opportunity.deadline)}` };
  }

  if (days === 0) {
    return { level: 'today', daysLeft: 0, label: 'Closes today' };
  }

  if (days === 1) {
    return { level: 'urgent', daysLeft: 1, label: 'Closes in 1 day' };
  }

  if (days <= 3) {
    return { level: 'urgent', daysLeft: days, label: `Closes in ${days} days` };
  }

  if (days <= 14) {
    return { level: 'soon', daysLeft: days, label: `Closes in ${days} days` };
  }

  return { level: 'later', daysLeft: days, label: `Closes in ${days} days` };
}

export function rankOpportunities(opportunities, profile, now = new Date()) {
  if (!Array.isArray(opportunities)) {
    return { ranked: [], excluded: [] };
  }

  const today = todayParts(now);
  const todayUtc = Date.UTC(today.y, today.m - 1, today.d);

  const ranked = [];
  const excluded = [];

  for (const opp of opportunities) {
    if (!opp) continue;

    // Sanitize malformed fields gracefully
    const oppCopy = { ...opp };
    if (typeof oppCopy.registrationFee !== 'number' && oppCopy.registrationFee !== null) {
      oppCopy.registrationFee = null;
    }
    const tags = Array.isArray(oppCopy.tags) ? oppCopy.tags : [];
    oppCopy.tags = tags.filter((t) => typeof t === 'string');

    const days = daysLeft(oppCopy.deadline, now);

    // 1. Check closed constraint
    let isClosed = false;
    let closedMessage = null;

    if (oppCopy.status === 'closed') {
      isClosed = true;
      closedMessage = 'Registration is closed.';
    } else if (oppCopy.status === 'cancelled') {
      isClosed = true;
      closedMessage = 'This event was cancelled.';
    } else if (days !== null && days < 0) {
      isClosed = true;
      closedMessage = 'Registration is closed.';
    } else if (days === null && oppCopy.startDate) {
      const startParts = parseDateOnly(oppCopy.startDate);
      if (startParts) {
        const startUtc = Date.UTC(startParts.y, startParts.m - 1, startParts.d);
        if (startUtc < todayUtc) {
          isClosed = true;
          closedMessage = 'The event date has passed.';
        }
      }
    }

    const urgency = computeUrgency(oppCopy, days, isClosed);

    if (isClosed) {
      excluded.push({
        opportunity: oppCopy,
        score: null,
        components: null,
        reasons: [],
        warnings: [],
        urgency,
        distanceKm: null,
        excluded: { code: 'closed', message: closedMessage || 'Registration is closed.' }
      });
      continue;
    }

    // If profile is null, skip eligibility and budget exclusions
    if (!profile) {
      ranked.push({
        opportunity: oppCopy,
        score: null,
        components: null,
        reasons: [],
        warnings: [],
        urgency,
        distanceKm: null,
        excluded: null
      });
      continue;
    }

    // 2. Eligibility constraint
    const eligibilityList = Array.isArray(oppCopy.eligibilityLevels) ? oppCopy.eligibilityLevels : [];
    if (
      eligibilityList.length > 0 &&
      !eligibilityList.includes('any') &&
      profile.educationLevel &&
      !eligibilityList.includes(profile.educationLevel)
    ) {
      excluded.push({
        opportunity: oppCopy,
        score: null,
        components: null,
        reasons: [],
        warnings: [],
        urgency,
        distanceKm: null,
        excluded: {
          code: 'eligibility',
          message: `Open to ${eligibilityList.join(', ')} students only. Your level is ${profile.educationLevel}.`
        }
      });
      continue;
    }

    // 3. Budget constraint
    const hasFeeLimit = typeof profile.maxRegistrationFee === 'number' && profile.maxRegistrationFee !== null;
    const oppFee = typeof oppCopy.registrationFee === 'number' ? oppCopy.registrationFee : null;
    if (oppFee !== null && hasFeeLimit && oppFee > profile.maxRegistrationFee) {
      excluded.push({
        opportunity: oppCopy,
        score: null,
        components: null,
        reasons: [],
        warnings: [],
        urgency,
        distanceKm: null,
        excluded: {
          code: 'budget',
          message: `Registration fee ₹${oppFee} is above your limit of ₹${profile.maxRegistrationFee}.`
        }
      });
      continue;
    }

    // Compute components
    const reasons = [];
    const warnings = [];

    // 6.1 Skills (K)
    const userSkills = Array.isArray(profile.skills) ? profile.skills : [];
    const userInterests = Array.isArray(profile.interests) ? profile.interests : [];
    const userTerms = new Set([...userSkills, ...userInterests].map(normalizeTag).filter(Boolean));

    const categoryNorm = normalizeTag(oppCopy.category || '');
    const oppTerms = new Set([...oppCopy.tags.map(normalizeTag), categoryNorm].filter(Boolean));

    let K = 50;
    if (oppCopy.tags.length === 0) {
      K = 50;
      warnings.push('Skill tags not provided');
    } else if (userTerms.size === 0) {
      K = 50;
      warnings.push('Add skills and interests to improve matching');
    } else {
      let overlapCount = 0;
      const matchedOriginalTags = [];

      for (const origTag of oppCopy.tags) {
        const norm = normalizeTag(origTag);
        if (norm && userTerms.has(norm)) {
          overlapCount++;
          matchedOriginalTags.push(origTag);
        }
      }
      if (categoryNorm && userTerms.has(categoryNorm) && !matchedOriginalTags.includes(oppCopy.category)) {
        overlapCount++;
        matchedOriginalTags.push(oppCopy.category);
      }

      const denominator = Math.min(oppTerms.size, 3) || 1;
      K = Math.min(100, Math.round(100 * overlapCount / denominator));

      if (overlapCount > 0) {
        const topMatches = matchedOriginalTags.slice(0, 3);
        reasons.push(`Matches your skills or interests: ${topMatches.join(', ')}`);
      }
    }

    // 6.2 Eligibility (E)
    let E = 50;
    if (eligibilityList.length === 0) {
      E = 50;
      warnings.push('Eligibility not provided');
    } else if (!profile.educationLevel) {
      E = 50;
      warnings.push('Add your education level to check eligibility');
    } else if (eligibilityList.includes('any')) {
      E = 100;
      reasons.push('Open to all education levels');
    } else if (eligibilityList.includes(profile.educationLevel)) {
      E = 100;
      reasons.push(`Open to ${profile.educationLevel} students`);
    }

    // 6.3 Location (L)
    let L = 50;
    let distanceKm = null;
    const format = (oppCopy.format || '').toLowerCase();

    if (format === 'online') {
      L = 100;
      reasons.push('Held online, no travel needed');
    } else {
      // offline or hybrid
      const hasOppCoords = typeof oppCopy.latitude === 'number' && typeof oppCopy.longitude === 'number';
      const hasUserCoords = typeof profile.latitude === 'number' && typeof profile.longitude === 'number';
      const hasMaxDist = typeof profile.maxDistanceKm === 'number' && profile.maxDistanceKm !== null;

      if (hasOppCoords && hasUserCoords && hasMaxDist) {
        const rawD = haversineDistance(profile.latitude, profile.longitude, oppCopy.latitude, oppCopy.longitude);
        const d = Math.round(rawD);
        distanceKm = d;
        if (d <= profile.maxDistanceKm) {
          L = Math.round(100 - (30 * d / profile.maxDistanceKm));
          reasons.push(`${d} km away, within your ${profile.maxDistanceKm} km distance`);
        } else {
          L = 20;
          warnings.push(`${d} km away, outside your ${profile.maxDistanceKm} km distance`);
        }
      } else {
        const oppCity = typeof oppCopy.city === 'string' ? oppCopy.city.trim().toLowerCase() : '';
        const userCity = typeof profile.location === 'string' ? profile.location.trim().toLowerCase() : '';

        if (!oppCity) {
          L = 50;
          warnings.push('Location not provided');
        } else if (!userCity) {
          L = 50;
          warnings.push('Add your city to check distance');
        } else if (oppCity === userCity) {
          L = 100;
          reasons.push(`In your city: ${oppCopy.city}`);
        } else {
          const oppRegion = getRegionForCity(oppCity);
          const userRegion = getRegionForCity(userCity);
          if (oppRegion && userRegion && oppRegion === userRegion) {
            L = 70;
            reasons.push(`In your region (${oppRegion}), distance not calculated`);
          } else {
            L = 30;
            warnings.push('Different city, distance not calculated');
          }
        }
      }

      if (format === 'hybrid') {
        L = Math.max(L, 80);
      }
    }

    // 6.4 Budget (B)
    let B = 50;
    if (oppFee === null) {
      B = 40;
      warnings.push('Registration fee not provided');
    } else if (oppFee === 0) {
      B = 100;
      reasons.push('Free to register');
    } else if (!hasFeeLimit && oppFee > 0) {
      B = 70;
      reasons.push(`Registration fee: ₹${oppFee}`);
    } else if (oppFee > 0 && hasFeeLimit && oppFee <= profile.maxRegistrationFee) {
      const limit = profile.maxRegistrationFee || 1;
      B = Math.round(100 - (50 * oppFee / limit));
      reasons.push(`Fee ₹${oppFee} is within your limit of ₹${profile.maxRegistrationFee}`);
    }

    // 6.5 Deadline relevance (D)
    let D = 40;
    if (days === null) {
      D = 40;
      warnings.push('Deadline not provided');
    } else if (days >= 0 && days <= 3) {
      D = 100;
    } else if (days >= 4 && days <= 14) {
      D = 90;
    } else if (days >= 15 && days <= 30) {
      D = 70;
    } else {
      D = 50;
    }

    // 6.6 Format (F)
    let F = 30;
    const pref = (profile.preferredFormat || 'any').toLowerCase();
    if (!pref || pref === 'any') {
      F = 100;
    } else if (pref === format) {
      F = 100;
      reasons.push(`Matches your preferred format: ${oppCopy.format}`);
    } else if (format === 'hybrid' && (pref === 'online' || pref === 'offline')) {
      F = 80;
      reasons.push('Hybrid, so you can attend either way');
    } else {
      F = 30;
    }

    const components = {
      skills: K,
      eligibility: E,
      location: L,
      budget: B,
      deadline: D,
      format: F
    };

    const S = (
      WEIGHTS.skills * K +
      WEIGHTS.eligibility * E +
      WEIGHTS.location * L +
      WEIGHTS.budget * B +
      WEIGHTS.deadline * D +
      WEIGHTS.format * F
    );
    const score = Math.round(S);

    ranked.push({
      opportunity: oppCopy,
      score,
      components,
      reasons,
      warnings,
      urgency,
      distanceKm,
      excluded: null
    });
  }

  // Sorting
  if (!profile) {
    ranked.sort((a, b) => {
      const dA = a.urgency.daysLeft;
      const dB = b.urgency.daysLeft;
      if (dA === null && dB !== null) return 1;
      if (dA !== null && dB === null) return -1;
      if (dA !== null && dB !== null && dA !== dB) return dA - dB;
      return (a.opportunity.title || '').localeCompare(b.opportunity.title || '');
    });
  } else {
    ranked.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const dA = a.urgency.daysLeft;
      const dB = b.urgency.daysLeft;
      if (dA === null && dB !== null) return 1;
      if (dA !== null && dB === null) return -1;
      if (dA !== null && dB !== null && dA !== dB) return dA - dB;
      return (a.opportunity.title || '').localeCompare(b.opportunity.title || '');
    });
  }

  excluded.sort((a, b) => (a.opportunity.title || '').localeCompare(b.opportunity.title || ''));

  return { ranked, excluded };
}
