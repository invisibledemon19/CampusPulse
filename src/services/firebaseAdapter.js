import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  addDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { auth, db, googleProvider } from './firebase.js';
import { ServiceError } from './errors.js';
import { getDefaultStepsForCategory } from '../data/defaultSteps.js';
import { validateProfile, validateSaved } from '../utils/validate.js';
import * as localAdapter from './localAdapter.js';

function toIsoString(val) {
  if (!val) return null;
  if (typeof val.toDate === 'function') {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') {
    return val;
  }
  return null;
}

function cleanDoc(docSnap) {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    lastCheckedAt: toIsoString(data.lastCheckedAt),
    createdAt: toIsoString(data.createdAt)
  };
}

export async function listOpportunities() {
  try {
    const oppsRef = collection(db, 'opportunities');
    const snapshot = await getDocs(oppsRef);
    const opportunities = [];
    snapshot.forEach((d) => {
      opportunities.push(cleanDoc(d));
    });
    return opportunities;
  } catch (err) {
    throw new ServiceError('unavailable', 'Unable to load opportunities from database.');
  }
}

export async function getOpportunity(id) {
  try {
    const docRef = doc(db, 'opportunities', id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      return null;
    }
    return cleanDoc(snapshot);
  } catch (err) {
    throw new ServiceError('unavailable', 'Unable to retrieve opportunity details.');
  }
}

export async function getProfile() {
  const user = auth.currentUser;
  if (!user) {
    return localAdapter.getProfile();
  }

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const snapshot = await getDoc(userDocRef);
    if (!snapshot.exists()) {
      return null;
    }
    const data = snapshot.data();
    const result = validateProfile(data);
    if (!result.valid) {
      return null;
    }
    return data;
  } catch (err) {
    throw new ServiceError('unavailable', 'Unable to load user profile.');
  }
}

export async function saveProfile(profile) {
  const result = validateProfile(profile);
  if (!result.valid) {
    throw new ServiceError('validation', 'Profile contains invalid fields.', result.errors);
  }

  const user = auth.currentUser;
  if (!user) {
    return localAdapter.saveProfile(profile);
  }

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const payload = {
      displayName: profile.displayName.trim(),
      educationLevel: profile.educationLevel,
      location: (profile.location || '').trim(),
      maxDistanceKm: profile.maxDistanceKm !== null && profile.maxDistanceKm !== undefined && profile.maxDistanceKm !== '' ? Number(profile.maxDistanceKm) : null,
      maxRegistrationFee: profile.maxRegistrationFee !== null && profile.maxRegistrationFee !== undefined && profile.maxRegistrationFee !== '' ? Number(profile.maxRegistrationFee) : null,
      skills: Array.isArray(profile.skills) ? profile.skills : [],
      interests: Array.isArray(profile.interests) ? profile.interests : [],
      preferredFormat: profile.preferredFormat || 'any'
    };

    if (typeof profile.latitude === 'number') payload.latitude = profile.latitude;
    if (typeof profile.longitude === 'number') payload.longitude = profile.longitude;

    await setDoc(userDocRef, payload);
    return { ...payload };
  } catch (err) {
    throw new ServiceError('unavailable', 'Unable to save profile to database.');
  }
}

export async function listSaved() {
  const user = auth.currentUser;
  if (!user) {
    return localAdapter.listSaved();
  }

  try {
    const savedRef = collection(db, 'savedOpportunities');
    const q = query(savedRef, where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    const savedList = [];
    snapshot.forEach((d) => {
      const data = d.data();
      savedList.push({
        opportunityId: data.opportunityId,
        savedAt: toIsoString(data.savedAt) || new Date().toISOString(),
        applicationStatus: data.applicationStatus,
        nextSteps: data.nextSteps || [],
        notes: data.notes || ''
      });
    });
    return savedList;
  } catch (err) {
    throw new ServiceError('unavailable', 'Unable to retrieve saved opportunities.');
  }
}

export async function saveOpportunity(opportunityId) {
  const user = auth.currentUser;
  if (!user) {
    return localAdapter.saveOpportunity(opportunityId);
  }

  const opp = await getOpportunity(opportunityId);
  if (!opp) {
    throw new ServiceError('not-found', 'Opportunity not found.');
  }

  const docId = `${user.uid}_${opportunityId}`;
  const docRef = doc(db, 'savedOpportunities', docId);

  const existingSnap = await getDoc(docRef);
  if (existingSnap.exists()) {
    const data = existingSnap.data();
    return {
      opportunityId: data.opportunityId,
      savedAt: toIsoString(data.savedAt),
      applicationStatus: data.applicationStatus,
      nextSteps: data.nextSteps || [],
      notes: data.notes || ''
    };
  }

  const defaultSteps = getDefaultStepsForCategory(opp.category);
  const newSaved = {
    userId: user.uid,
    opportunityId,
    savedAt: serverTimestamp(),
    applicationStatus: 'interested',
    nextSteps: defaultSteps,
    notes: ''
  };

  try {
    await setDoc(docRef, newSaved);
    return {
      opportunityId,
      savedAt: new Date().toISOString(),
      applicationStatus: 'interested',
      nextSteps: defaultSteps,
      notes: ''
    };
  } catch (err) {
    throw new ServiceError('unavailable', 'Unable to save opportunity.');
  }
}

export async function unsaveOpportunity(opportunityId) {
  const user = auth.currentUser;
  if (!user) {
    return localAdapter.unsaveOpportunity(opportunityId);
  }

  const docId = `${user.uid}_${opportunityId}`;
  try {
    await deleteDoc(doc(db, 'savedOpportunities', docId));
  } catch (err) {
    throw new ServiceError('unavailable', 'Unable to unsave opportunity.');
  }
}

export async function updateSaved(opportunityId, patch) {
  const user = auth.currentUser;
  if (!user) {
    return localAdapter.updateSaved(opportunityId, patch);
  }

  const docId = `${user.uid}_${opportunityId}`;
  const docRef = doc(db, 'savedOpportunities', docId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new ServiceError('not-found', 'Saved opportunity not found.');
  }

  const existing = snap.data();
  const updatedItem = {
    ...existing,
    ...patch,
    opportunityId: existing.opportunityId,
    savedAt: existing.savedAt
  };

  if (!validateSaved(updatedItem)) {
    throw new ServiceError('validation', 'Invalid saved opportunity details.');
  }

  const payload = {};
  if (patch.applicationStatus !== undefined) payload.applicationStatus = patch.applicationStatus;
  if (patch.nextSteps !== undefined) payload.nextSteps = patch.nextSteps;
  if (patch.notes !== undefined) payload.notes = patch.notes;

  try {
    await updateDoc(docRef, payload);
    return {
      opportunityId: existing.opportunityId,
      savedAt: toIsoString(existing.savedAt),
      applicationStatus: updatedItem.applicationStatus,
      nextSteps: updatedItem.nextSteps,
      notes: updatedItem.notes || ''
    };
  } catch (err) {
    throw new ServiceError('unavailable', 'Unable to update saved opportunity.');
  }
}

export async function submitOpportunity(draft) {
  const user = auth.currentUser;
  if (!user) {
    throw new ServiceError('not-signed-in', 'Submitting opportunities requires signing in.');
  }

  if (!draft || typeof draft !== 'object') {
    throw new ServiceError('validation', 'Invalid submission payload.');
  }

  const title = (draft.title || '').trim();
  const organizer = (draft.organizer || '').trim();
  const category = draft.category;
  const description = (draft.description || '').trim();
  const format = draft.format;
  const registrationUrl = (draft.registrationUrl || '').trim();

  const validCategories = ['hackathon', 'internship', 'workshop', 'event'];
  const validFormats = ['online', 'offline', 'hybrid'];

  if (title.length < 3 || title.length > 120) {
    throw new ServiceError('validation', 'Title must be between 3 and 120 characters.');
  }
  if (organizer.length < 1 || organizer.length > 120) {
    throw new ServiceError('validation', 'Organizer must be between 1 and 120 characters.');
  }
  if (!validCategories.includes(category)) {
    throw new ServiceError('validation', 'Invalid category.');
  }
  if (description.length > 2000) {
    throw new ServiceError('validation', 'Description cannot exceed 2000 characters.');
  }
  if (!validFormats.includes(format)) {
    throw new ServiceError('validation', 'Invalid format.');
  }
  if (!registrationUrl.startsWith('https://') || registrationUrl.length > 500) {
    throw new ServiceError('validation', 'Registration URL must be an https URL up to 500 characters.');
  }

  const payload = {
    title,
    organizer,
    category,
    description,
    format,
    registrationUrl,
    submittedBy: user.uid,
    submittedAt: serverTimestamp()
  };

  if (draft.city && typeof draft.city === 'string' && draft.city.trim().length <= 120) {
    payload.city = draft.city.trim();
  }
  if (draft.deadline && typeof draft.deadline === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(draft.deadline.trim())) {
    payload.deadline = draft.deadline.trim();
  }

  try {
    await addDoc(collection(db, 'submissions'), payload);
  } catch (err) {
    throw new ServiceError('unavailable', 'Unable to submit opportunity.');
  }
}

export function subscribeAuth(callback) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        uid: user.uid,
        displayName: user.displayName || user.email || 'User'
      });
    } else {
      callback(null);
    }
  });
}

export async function signInWithGoogle() {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    throw new ServiceError('unavailable', 'Google sign in failed.');
  }
}

export async function signOut() {
  try {
    await fbSignOut(auth);
  } catch (err) {
    throw new ServiceError('unavailable', 'Sign out failed.');
  }
}

export async function signInDemoUser({ displayName, email }) {
  return localAdapter.signInDemoUser({ displayName, email });
}
