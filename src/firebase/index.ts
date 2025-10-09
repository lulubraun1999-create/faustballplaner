'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// This ensures that Firebase is initialized only once.
// The config is passed directly to ensure the correct API key is used.
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const firestore: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

// Export the initialized services directly.
// These are now guaranteed to be initialized correctly.
export { app as firebaseApp, auth, firestore };


// This function is no longer needed and will be removed to avoid confusion.
// export function initializeFirebase() {
//   return {
//     firebaseApp: app,
//     auth: auth,
//     firestore: firestore,
//   };
// }

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