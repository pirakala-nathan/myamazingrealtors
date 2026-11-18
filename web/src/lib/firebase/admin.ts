import "server-only";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { serverEnv } from "@/lib/env";

/**
 * Firebase Admin, used only on the server (Server Functions and route handlers).
 * It bypasses Firestore security rules, which deny all browser access, so every
 * read and write goes through code we control.
 */
function app() {
  if (getApps().length) return getApp();
  return initializeApp({
    credential: cert({
      projectId: serverEnv.firebaseProjectId,
      clientEmail: serverEnv.firebaseClientEmail,
      privateKey: serverEnv.firebasePrivateKey,
    }),
  });
}

let settingsApplied = false;

export function db() {
  const firestore = getFirestore(app());
  if (!settingsApplied) {
    settingsApplied = true;
    try {
      // Optional form fields left blank arrive as undefined; skip them instead of rejecting the whole document.
      firestore.settings({ ignoreUndefinedProperties: true });
    } catch {
      // Already configured (settings can only be applied once per instance, e.g. after a dev hot reload).
    }
  }
  return firestore;
}

/** Cloud Storage bucket for listing photos (FIREBASE_STORAGE_BUCKET, e.g. "my-project.firebasestorage.app"). */
export function bucket() {
  return getStorage(app()).bucket(serverEnv.firebaseStorageBucket);
}
