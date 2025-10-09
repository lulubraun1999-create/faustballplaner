'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

let app: FirebaseApp;
try {
  app = getApp();
} catch (e) {
  app = initializeApp(firebaseConfig);
}

const firestore = getFirestore(app);
const auth = getAuth(app);

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  // This function now simply returns the already initialized services.
  // The logic is handled at the module level to ensure it runs only once.
  return {
    firebaseApp: app,
    auth: auth,
    firestore: firestore,
  };
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';
