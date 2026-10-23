import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp
} from 'firebase/firestore';

const PROJECT_ID = 'demo-campusplus-rules';

let isEmulatorRunning = false;
try {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 300);
  await fetch('http://127.0.0.1:8080/', { signal: controller.signal });
  clearTimeout(timer);
  isEmulatorRunning = true;
} catch {
  isEmulatorRunning = false;
}

const suite = isEmulatorRunning ? describe : describe.skip;

suite('Firestore Security Rules (architecture.md section 9.1)', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
        host: '127.0.0.1',
        port: 8080
      }
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  // 1. Anyone can read opportunities. No one can write to it.
  it('rule 1: anyone can read opportunities, no one can write to it', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'opportunities', 'opp-1'), {
        title: 'Tech Hackathon'
      });
    });

    const unauthDb = testEnv.unauthenticatedContext().firestore();
    const userDb = testEnv.authenticatedContext('user_a').firestore();

    await assertSucceeds(getDoc(doc(unauthDb, 'opportunities', 'opp-1')));
    await assertSucceeds(getDoc(doc(userDb, 'opportunities', 'opp-1')));

    await assertFails(setDoc(doc(unauthDb, 'opportunities', 'opp-new'), { title: 'Hack' }));
    await assertFails(setDoc(doc(userDb, 'opportunities', 'opp-new'), { title: 'Hack' }));
  });

  // 2. A signed out visitor cannot read or write users or savedOpportunities.
  it('rule 2: signed out visitor cannot read or write users or savedOpportunities', async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();

    await assertFails(getDoc(doc(unauthDb, 'users', 'user_a')));
    await assertFails(setDoc(doc(unauthDb, 'users', 'user_a'), { displayName: 'A' }));

    await assertFails(getDoc(doc(unauthDb, 'savedOpportunities', 'user_a_opp1')));
    await assertFails(setDoc(doc(unauthDb, 'savedOpportunities', 'user_a_opp1'), { opportunityId: 'opp1' }));
  });

  // 3. User A cannot read or write User B's profile or saved items.
  it('rule 3: User A cannot read or write User B profile or saved items', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users', 'user_b'), {
        displayName: 'User B',
        educationLevel: 'undergraduate',
        location: 'Delhi',
        maxDistanceKm: 50,
        maxRegistrationFee: 0,
        skills: ['python'],
        interests: ['ai'],
        preferredFormat: 'offline'
      });
      await setDoc(doc(db, 'savedOpportunities', 'user_b_opp1'), {
        userId: 'user_b',
        opportunityId: 'opp1',
        savedAt: new Date(),
        applicationStatus: 'interested',
        nextSteps: []
      });
    });

    const userADb = testEnv.authenticatedContext('user_a').firestore();

    await assertFails(getDoc(doc(userADb, 'users', 'user_b')));
    await assertFails(getDoc(doc(userADb, 'savedOpportunities', 'user_b_opp1')));

    await assertFails(updateDoc(doc(userADb, 'users', 'user_b'), { displayName: 'Hacked' }));
    await assertFails(updateDoc(doc(userADb, 'savedOpportunities', 'user_b_opp1'), { notes: 'Hacked' }));
  });

  // 4. User A can create savedOpportunities/A_x with userId A, and cannot create it with mismatched id or different userId.
  it('rule 4: User A can create saved item with matching docId and userId, fails on mismatch', async () => {
    const userADb = testEnv.authenticatedContext('user_a').firestore();

    const validSaved = {
      userId: 'user_a',
      opportunityId: 'opp-x',
      savedAt: serverTimestamp(),
      applicationStatus: 'interested',
      nextSteps: [{ id: 's1', task: 'Check details', completed: false }],
      notes: ''
    };

    await assertSucceeds(setDoc(doc(userADb, 'savedOpportunities', 'user_a_opp-x'), validSaved));

    await assertFails(setDoc(doc(userADb, 'savedOpportunities', 'wrong_id'), validSaved));

    await assertFails(setDoc(doc(userADb, 'savedOpportunities', 'user_a_opp-y'), {
      ...validSaved,
      opportunityId: 'opp-y',
      userId: 'user_b'
    }));
  });

  // 5. A saved item update cannot change opportunityId, userId or savedAt.
  it('rule 5: saved item update cannot change opportunityId, userId or savedAt', async () => {
    const now = new Date();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'savedOpportunities', 'user_a_opp1'), {
        userId: 'user_a',
        opportunityId: 'opp1',
        savedAt: now,
        applicationStatus: 'interested',
        nextSteps: []
      });
    });

    const userADb = testEnv.authenticatedContext('user_a').firestore();

    await assertSucceeds(updateDoc(doc(userADb, 'savedOpportunities', 'user_a_opp1'), {
      applicationStatus: 'applied',
      notes: 'Applied yesterday'
    }));

    await assertFails(updateDoc(doc(userADb, 'savedOpportunities', 'user_a_opp1'), {
      userId: 'user_b'
    }));

    await assertFails(updateDoc(doc(userADb, 'savedOpportunities', 'user_a_opp1'), {
      opportunityId: 'opp2'
    }));

    await assertFails(updateDoc(doc(userADb, 'savedOpportunities', 'user_a_opp1'), {
      savedAt: new Date(2025, 1, 1)
    }));
  });

  // 6. A saved item with notes above 1000 characters, or an unknown status, is rejected.
  it('rule 6: saved item with notes above 1000 characters or unknown status is rejected', async () => {
    const userADb = testEnv.authenticatedContext('user_a').firestore();

    const longNotes = 'a'.repeat(1001);
    await assertFails(setDoc(doc(userADb, 'savedOpportunities', 'user_a_opp1'), {
      userId: 'user_a',
      opportunityId: 'opp1',
      savedAt: serverTimestamp(),
      applicationStatus: 'interested',
      nextSteps: [],
      notes: longNotes
    }));

    await assertFails(setDoc(doc(userADb, 'savedOpportunities', 'user_a_opp2'), {
      userId: 'user_a',
      opportunityId: 'opp2',
      savedAt: serverTimestamp(),
      applicationStatus: 'invalid_status',
      nextSteps: []
    }));
  });

  // 7. An invalid profile (unknown education level, 31 skills, negative fee limit) is rejected.
  it('rule 7: invalid profile is rejected', async () => {
    const userADb = testEnv.authenticatedContext('user_a').firestore();

    const baseValid = {
      displayName: 'User A',
      educationLevel: 'undergraduate',
      location: 'Delhi',
      maxDistanceKm: 50,
      maxRegistrationFee: 500,
      skills: ['react'],
      interests: ['hackathons'],
      preferredFormat: 'offline'
    };

    await assertSucceeds(setDoc(doc(userADb, 'users', 'user_a'), baseValid));

    await assertFails(setDoc(doc(userADb, 'users', 'user_a'), {
      ...baseValid,
      educationLevel: 'high_school'
    }));

    const tooManySkills = new Array(31).fill('skill');
    await assertFails(setDoc(doc(userADb, 'users', 'user_a'), {
      ...baseValid,
      skills: tooManySkills
    }));

    await assertFails(setDoc(doc(userADb, 'users', 'user_a'), {
      ...baseValid,
      maxRegistrationFee: -100
    }));
  });

  // 8. A signed in user can create a valid submission. A submission with an http:// URL or someone else's submittedBy is rejected. No one can read submissions.
  it('rule 8: signed in user can create valid submission, invalid URLs/impersonation rejected, cannot read', async () => {
    const userADb = testEnv.authenticatedContext('user_a').firestore();

    const validSubmission = {
      title: 'Open Robotics Cup',
      organizer: 'Robotics Guild',
      category: 'hackathon',
      description: 'Annual competitive robotics sprint for students.',
      format: 'offline',
      registrationUrl: 'https://example.com/robotics',
      submittedBy: 'user_a',
      submittedAt: serverTimestamp()
    };

    let subDocRef;
    await assertSucceeds((async () => {
      subDocRef = await addDoc(collection(userADb, 'submissions'), validSubmission);
    })());

    await assertFails(addDoc(collection(userADb, 'submissions'), {
      ...validSubmission,
      registrationUrl: 'http://insecure.example.com'
    }));

    await assertFails(addDoc(collection(userADb, 'submissions'), {
      ...validSubmission,
      submittedBy: 'user_b'
    }));

    await assertFails(getDoc(subDocRef));
  });
});
