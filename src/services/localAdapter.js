import { getDemoOpportunities } from '../data/demoOpportunities.js';
import { getDefaultStepsForCategory } from '../data/defaultSteps.js';
import { validateProfile, validateSaved } from '../utils/validate.js';
import { ServiceError } from './errors.js';

const PROFILE_KEY = 'campusplus:profile:v1';
const SAVED_KEY = 'campusplus:saved:v1';

let cachedOpportunities = null;

export async function listOpportunities() {
  if (!cachedOpportunities) {
    cachedOpportunities = getDemoOpportunities();
  }
  return [...cachedOpportunities];
}

export async function getOpportunity(id) {
  const opps = await listOpportunities();
  return opps.find((o) => o.id === id) || null;
}

export async function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const result = validateProfile(parsed);
    if (!result.valid) {
      localStorage.removeItem(PROFILE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveProfile(profile) {
  const result = validateProfile(profile);
  if (!result.valid) {
    throw new ServiceError('validation', 'Profile contains invalid fields.', result.errors);
  }

  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return { ...profile };
  } catch {
    throw new ServiceError('storage-blocked', 'Unable to save profile to browser storage.');
  }
}

export async function listSaved() {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(SAVED_KEY);
      return [];
    }
    return parsed.filter(validateSaved);
  } catch {
    return [];
  }
}

export async function saveOpportunity(opportunityId) {
  const opp = await getOpportunity(opportunityId);
  if (!opp) {
    throw new ServiceError('not-found', 'Opportunity not found.');
  }

  const savedList = await listSaved();
  const existing = savedList.find((s) => s.opportunityId === opportunityId);
  if (existing) {
    return existing;
  }

  const defaultSteps = getDefaultStepsForCategory(opp.category);
  const newSaved = {
    opportunityId,
    savedAt: new Date().toISOString(),
    applicationStatus: 'interested',
    nextSteps: defaultSteps,
    notes: ''
  };

  const updated = [newSaved, ...savedList];
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
    return newSaved;
  } catch {
    throw new ServiceError('storage-blocked', 'Unable to save opportunity to browser storage.');
  }
}

export async function unsaveOpportunity(opportunityId) {
  const savedList = await listSaved();
  const updated = savedList.filter((s) => s.opportunityId !== opportunityId);
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
  } catch {
    throw new ServiceError('storage-blocked', 'Unable to update saved opportunities.');
  }
}

export async function updateSaved(opportunityId, patch) {
  const savedList = await listSaved();
  const index = savedList.findIndex((s) => s.opportunityId === opportunityId);
  if (index === -1) {
    throw new ServiceError('not-found', 'Saved opportunity not found.');
  }

  const existing = savedList[index];
  const updatedItem = {
    ...existing,
    ...patch,
    opportunityId: existing.opportunityId,
    savedAt: existing.savedAt
  };

  if (!validateSaved(updatedItem)) {
    throw new ServiceError('validation', 'Invalid saved opportunity details.');
  }

  savedList[index] = updatedItem;
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(savedList));
    return updatedItem;
  } catch {
    throw new ServiceError('storage-blocked', 'Unable to update saved item.');
  }
}

export async function submitOpportunity() {
  throw new ServiceError('not-signed-in', 'Submitting opportunities requires signing in.');
}

const AUTH_KEY = 'campusplus:auth:v1';
const authListeners = new Set();

function getStoredAuthUser() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function subscribeAuth(callback) {
  const user = getStoredAuthUser();
  callback(user);
  authListeners.add(callback);
  return () => {
    authListeners.delete(callback);
  };
}

export async function signInDemoUser({ displayName, email }) {
  const user = {
    uid: 'demo-student-' + Date.now(),
    displayName: displayName || 'Demo Student',
    email: email || 'student@example.edu'
  };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    }
  } catch {
    // ignore
  }
  authListeners.forEach((fn) => fn(user));
  return user;
}

export async function signInWithGoogle() {
  throw new ServiceError('unavailable', 'Sign in is not available in demo mode.');
}

export async function signOut() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(AUTH_KEY);
    }
  } catch {
    // ignore
  }
  authListeners.forEach((fn) => fn(null));
}
