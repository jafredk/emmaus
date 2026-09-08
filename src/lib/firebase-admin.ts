import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const requiredAdminKeys = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
] as const;

const missingAdminKeys = requiredAdminKeys.filter((key) => !process.env[key]);

export const firebaseAdminConfigReady = missingAdminKeys.length === 0;
export const firebaseAdminMissingKeys = missingAdminKeys;

let adminAuth: ReturnType<typeof getAuth> | null = null;

if (firebaseAdminConfigReady) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  const app =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey,
          }),
        });

  adminAuth = getAuth(app);
}

export { adminAuth };
