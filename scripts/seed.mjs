import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import admin from 'firebase-admin';

try {
  process.loadEnvFile('.env');
} catch {
  // Use system environment variables
}

const args = process.argv.slice(2);
const allowSample = args.includes('--allow-sample');

const seedPath = resolve('data/seed/opportunities.json');
if (!existsSync(seedPath)) {
  console.error(`Seed file not found at ${seedPath}`);
  process.exit(1);
}

let raw;
try {
  raw = JSON.parse(readFileSync(seedPath, 'utf8'));
} catch (err) {
  console.error(`Invalid JSON in seed file: ${err.message}`);
  process.exit(1);
}

if (!Array.isArray(raw)) {
  console.error('Seed file must contain an array of opportunities.');
  process.exit(1);
}

if (raw.length === 0) {
  console.log('Seed file is empty (0 records). Nothing to seed.');
  process.exit(0);
}

const VALID_CATEGORIES = ['hackathon', 'internship', 'workshop', 'event'];
const VALID_FORMATS = ['online', 'offline', 'hybrid'];
const VALID_STATUSES = ['open', 'closed', 'cancelled', 'unknown'];
const VALID_LEVELS = ['diploma', 'undergraduate', 'postgraduate', 'doctoral', 'any'];

function slugify(str) {
  return (str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function makeStableId(opp) {
  const t = slugify(opp.title);
  const o = slugify(opp.organizer);
  const s = slugify(opp.startDate || 'no-date');
  return `${t}-${o}-${s}`.slice(0, 100);
}

function validateRecord(opp, index) {
  const prefix = `Record [${index}] (${opp.title || 'untitled'}):`;

  if (typeof opp.title !== 'string' || opp.title.length < 3 || opp.title.length > 120) {
    return `${prefix} title must be 3 to 120 characters.`;
  }
  if (typeof opp.organizer !== 'string' || opp.organizer.length < 1 || opp.organizer.length > 120) {
    return `${prefix} organizer must be 1 to 120 characters.`;
  }
  if (!VALID_CATEGORIES.includes(opp.category)) {
    return `${prefix} category must be one of: ${VALID_CATEGORIES.join(', ')}.`;
  }
  if (typeof opp.description !== 'string' || opp.description.length > 2000) {
    return `${prefix} description must be a string up to 2000 characters.`;
  }
  if (!Array.isArray(opp.tags) || opp.tags.length > 15 || opp.tags.some((t) => typeof t !== 'string' || t.length > 40)) {
    return `${prefix} tags must be an array of up to 15 strings (each up to 40 chars).`;
  }
  if (opp.registrationFee !== null && (typeof opp.registrationFee !== 'number' || opp.registrationFee < 0)) {
    return `${prefix} registrationFee must be zero or positive number, or null.`;
  }
  if (opp.estimatedTravelCost !== null && (typeof opp.estimatedTravelCost !== 'number' || opp.estimatedTravelCost < 0)) {
    return `${prefix} estimatedTravelCost must be zero or positive number, or null.`;
  }
  if (!VALID_FORMATS.includes(opp.format)) {
    return `${prefix} format must be one of: ${VALID_FORMATS.join(', ')}.`;
  }
  if (opp.city !== null && (typeof opp.city !== 'string' || opp.city.length > 120)) {
    return `${prefix} city must be string up to 120 chars, or null.`;
  }
  if (opp.venue !== null && (typeof opp.venue !== 'string' || opp.venue.length > 120)) {
    return `${prefix} venue must be string up to 120 chars, or null.`;
  }
  const hasLat = typeof opp.latitude === 'number';
  const hasLon = typeof opp.longitude === 'number';
  if ((hasLat && !hasLon) || (!hasLat && hasLon)) {
    return `${prefix} latitude and longitude must both be set or both null.`;
  }
  if (hasLat && (opp.latitude < -90 || opp.latitude > 90 || opp.longitude < -180 || opp.longitude > 180)) {
    return `${prefix} coordinates out of range (-90..90, -180..180).`;
  }
  if (opp.startDate !== null && (typeof opp.startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(opp.startDate))) {
    return `${prefix} startDate must be YYYY-MM-DD or null.`;
  }
  if (opp.deadline !== null && (typeof opp.deadline !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(opp.deadline))) {
    return `${prefix} deadline must be YYYY-MM-DD or null.`;
  }
  if (!Array.isArray(opp.eligibilityLevels) || opp.eligibilityLevels.some((l) => !VALID_LEVELS.includes(l))) {
    return `${prefix} eligibilityLevels must contain only valid levels: ${VALID_LEVELS.join(', ')}.`;
  }
  if (typeof opp.registrationUrl !== 'string' || (opp.registrationUrl !== '' && !opp.registrationUrl.startsWith('https://'))) {
    return `${prefix} registrationUrl must be empty string or start with https://.`;
  }
  if (typeof opp.sourceUrl !== 'string' || (opp.sourceUrl !== '' && !opp.sourceUrl.startsWith('https://'))) {
    return `${prefix} sourceUrl must be empty string or start with https://.`;
  }
  if (!VALID_STATUSES.includes(opp.status)) {
    return `${prefix} status must be one of: ${VALID_STATUSES.join(', ')}.`;
  }
  if (opp.verificationStatus !== 'unverified' && opp.verificationStatus !== 'verified') {
    return `${prefix} verificationStatus must be unverified or verified.`;
  }
  if (opp.verificationStatus === 'verified') {
    if (!opp.sourceUrl || !opp.sourceUrl.startsWith('https://') || !opp.lastCheckedAt) {
      return `${prefix} verified listings must have a non-empty https sourceUrl and a non-null lastCheckedAt.`;
    }
    if (opp.isSample === true) {
      return `${prefix} sample listings cannot be marked verified.`;
    }
  }

  return null;
}

// 1. Validation pass
const seenDuplicates = new Set();
for (let i = 0; i < raw.length; i++) {
  const opp = raw[i];
  const err = validateRecord(opp, i);
  if (err) {
    console.error(`Validation failed: ${err}`);
    process.exit(1);
  }

  const key = `${slugify(opp.title)}|${slugify(opp.organizer)}|${opp.startDate || ''}`;
  if (seenDuplicates.has(key)) {
    console.error(`Duplicate record detected in seed file at index [${i}]: ${opp.title} by ${opp.organizer}`);
    process.exit(1);
  }
  seenDuplicates.add(key);

  if (opp.isSample === true && !allowSample) {
    console.error(`Record [${i}] has isSample: true. Use --allow-sample flag to allow sample listings.`);
    process.exit(1);
  }
}

// 2. Initialize Firebase Admin
const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'campusplus-dev';
const isProdProject = projectId === 'campusplus-prod' || projectId.includes('production');

if (allowSample && isProdProject) {
  console.error('--allow-sample is prohibited on production project.');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    projectId
  });
}

const db = admin.firestore();

// 3. Write records with stable ID and merge
async function seed() {
  console.log(`Seeding ${raw.length} records to Firestore project "${projectId}"...`);
  const batch = db.batch();

  for (const opp of raw) {
    const id = makeStableId(opp);
    const docRef = db.collection('opportunities').doc(id);

    const data = {
      ...opp,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    if (opp.lastCheckedAt) {
      data.lastCheckedAt = admin.firestore.Timestamp.fromDate(new Date(opp.lastCheckedAt));
    }

    batch.set(docRef, data, { merge: true });
  }

  await batch.commit();
  console.log(`Successfully seeded ${raw.length} opportunities.`);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
