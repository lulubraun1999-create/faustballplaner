'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length) {
    // If already initialized, return the SDKs with the already initialized App
    return getSdks(getApp());
  }

  // In a real Firebase App Hosting environment, initializeApp() would work without args.
  // In the development environment (like this one), we must use the config object.
  // We can differentiate based on a well-known env var.
  let firebaseApp;
  if (process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST) {
     // This logic is for when you are running the app locally with emulators
     firebaseApp = initializeApp(firebaseConfig);
  } else {
    try {
      // This is for the deployed App Hosting environment
      firebaseApp = initializeApp();
    } catch (e) {
      // This is the fallback for the Studio development environment
      firebaseApp = initializeApp(firebaseConfig);
    }
  }
  
  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';