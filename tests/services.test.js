import { describe, it, expect, beforeEach } from 'vitest';
import {
  getMode,
  listOpportunities,
  getOpportunity,
  getProfile,
  saveProfile,
  listSaved,
  saveOpportunity,
  unsaveOpportunity,
  updateSaved,
  submitOpportunity,
  subscribeAuth,
  signInWithGoogle,
  signOut,
  ServiceError
} from '../src/services/index.js';

describe('services contract (architecture.md section 5)', () => {
  let memoryStore = {};

  beforeEach(() => {
    memoryStore = {};
    globalThis.localStorage = {
      getItem: (key) => memoryStore[key] || null,
      setItem: (key, val) => { memoryStore[key] = String(val); },
      removeItem: (key) => { delete memoryStore[key]; },
      clear: () => { memoryStore = {}; }
    };
  });

  it('getMode returns demo or firebase synchronously', () => {
    const mode = getMode();
    expect(mode).toBe('demo');
  });

  it('listOpportunities returns an array of opportunities', async () => {
    const opps = await listOpportunities();
    expect(Array.isArray(opps)).toBe(true);
    expect(opps.length).toBeGreaterThanOrEqual(16);
  });

  it('getOpportunity returns opportunity by id or null if not found', async () => {
    const opp = await getOpportunity('demo-1');
    expect(opp).not.toBeNull();
    expect(opp.id).toBe('demo-1');

    const notFound = await getOpportunity('non-existent-id');
    expect(notFound).toBeNull();
  });

  it('getProfile and saveProfile manage user preferences with validation', async () => {
    const initial = await getProfile();
    expect(initial).toBeNull();

    const validProfile = {
      displayName: 'Karan Verma',
      educationLevel: 'undergraduate',
      location: 'Delhi',
      maxDistanceKm: 30,
      maxRegistrationFee: 500,
      skills: ['Python', 'SQL'],
      interests: ['AI', 'Hackathons'],
      preferredFormat: 'offline'
    };

    const saved = await saveProfile(validProfile);
    expect(saved.displayName).toBe('Karan Verma');

    const retrieved = await getProfile();
    expect(retrieved).toEqual(validProfile);

    // Invalid profile should throw ServiceError with validation code
    await expect(saveProfile({ displayName: '' })).rejects.toThrowError(ServiceError);
  });

  it('listSaved, saveOpportunity, updateSaved, and unsaveOpportunity manage saved items', async () => {
    const initialSaved = await listSaved();
    expect(initialSaved).toEqual([]);

    // Save demo-1
    const item = await saveOpportunity('demo-1');
    expect(item.opportunityId).toBe('demo-1');
    expect(item.applicationStatus).toBe('interested');
    expect(item.nextSteps.length).toBeGreaterThan(0);

    // Saving again is idempotent
    const itemAgain = await saveOpportunity('demo-1');
    expect(itemAgain.opportunityId).toBe('demo-1');

    // List saved
    const savedList = await listSaved();
    expect(savedList.length).toBe(1);

    // Update saved
    const updated = await updateSaved('demo-1', {
      applicationStatus: 'applied',
      notes: 'Submitted resume yesterday.'
    });
    expect(updated.applicationStatus).toBe('applied');
    expect(updated.notes).toBe('Submitted resume yesterday.');

    // Unsave
    await unsaveOpportunity('demo-1');
    const afterUnsave = await listSaved();
    expect(afterUnsave).toEqual([]);
  });

  it('submitOpportunity requires sign-in in demo mode', async () => {
    await expect(submitOpportunity({})).rejects.toThrowError(ServiceError);
  });

  it('subscribeAuth calls back with null in demo mode', () => {
    let user = 'not-called';
    const unsubscribe = subscribeAuth((val) => {
      user = val;
    });
    expect(user).toBeNull();
    expect(typeof unsubscribe).toBe('function');
  });

  it('signInWithGoogle throws unavailable in demo mode', async () => {
    await expect(signInWithGoogle()).rejects.toThrowError(ServiceError);
  });

  it('signOut resolves without error in demo mode', async () => {
    await expect(signOut()).resolves.toBeUndefined();
  });
});
