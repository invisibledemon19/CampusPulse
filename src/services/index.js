import * as localAdapter from './localAdapter.js';
export { ServiceError } from './errors.js';

const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_APP_ID &&
  import.meta.env.VITE_FORCE_DEMO !== 'true'
);

const mode = isFirebaseConfigured ? 'firebase' : 'demo';

let firebaseAdapterPromise = null;

async function getAdapter() {
  if (mode === 'demo') {
    return localAdapter;
  }
  if (!firebaseAdapterPromise) {
    firebaseAdapterPromise = import('./firebaseAdapter.js');
  }
  return firebaseAdapterPromise;
}

export function getMode() {
  return mode;
}

export async function listOpportunities() {
  const adapter = await getAdapter();
  return adapter.listOpportunities();
}

export async function getOpportunity(id) {
  const adapter = await getAdapter();
  return adapter.getOpportunity(id);
}

export async function getProfile() {
  const adapter = await getAdapter();
  return adapter.getProfile();
}

export async function saveProfile(profile) {
  const adapter = await getAdapter();
  return adapter.saveProfile(profile);
}

export async function listSaved() {
  const adapter = await getAdapter();
  return adapter.listSaved();
}

export async function saveOpportunity(opportunityId) {
  const adapter = await getAdapter();
  return adapter.saveOpportunity(opportunityId);
}

export async function unsaveOpportunity(opportunityId) {
  const adapter = await getAdapter();
  return adapter.unsaveOpportunity(opportunityId);
}

export async function updateSaved(opportunityId, patch) {
  const adapter = await getAdapter();
  return adapter.updateSaved(opportunityId, patch);
}

export async function submitOpportunity(draft) {
  const adapter = await getAdapter();
  return adapter.submitOpportunity(draft);
}

export function subscribeAuth(callback) {
  if (mode === 'demo') {
    return localAdapter.subscribeAuth(callback);
  }
  let unsub = null;
  let cancelled = false;
  getAdapter().then((adapter) => {
    if (!cancelled) {
      unsub = adapter.subscribeAuth(callback);
    }
  });
  return () => {
    cancelled = true;
    if (unsub) {
      unsub();
    }
  };
}

export async function signInWithGoogle() {
  const adapter = await getAdapter();
  return adapter.signInWithGoogle();
}

export async function signInDemoUser(data) {
  const adapter = await getAdapter();
  if (typeof adapter.signInDemoUser === 'function') {
    return adapter.signInDemoUser(data);
  }
  return null;
}

export async function signOut() {
  const adapter = await getAdapter();
  return adapter.signOut();
}
