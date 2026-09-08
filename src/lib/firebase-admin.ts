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
let firebaseAdminInitError: string | null = null;

function decodeBase64(value: string) {
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return null;
  }
}

function normalizePrivateKey(rawValue?: string) {
  if (!rawValue) {
    return null;
  }

  // Common Vercel format: "-----BEGIN...\\n...\\n-----END...\\n"
  const unescaped = rawValue.replace(/\\n/g, "\n").trim();
  const withoutWrappingQuotes =
    unescaped.startsWith('"') && unescaped.endsWith('"')
      ? unescaped.slice(1, -1)
      : unescaped;

  if (withoutWrappingQuotes.includes("BEGIN PRIVATE KEY")) {
    return withoutWrappingQuotes;
  }

  // Optional fallback: FIREBASE_PRIVATE_KEY as base64-encoded PEM.
  const base64Decoded = decodeBase64(withoutWrappingQuotes)?.trim();
  if (base64Decoded && base64Decoded.includes("BEGIN PRIVATE KEY")) {
    return base64Decoded;
  }

  // Optional fallback: FIREBASE_PRIVATE_KEY contains service account JSON.
  try {
    const parsed = JSON.parse(withoutWrappingQuotes) as { private_key?: string };
    const jsonPrivateKey = parsed.private_key?.replace(/\\n/g, "\n").trim();

    if (jsonPrivateKey && jsonPrivateKey.includes("BEGIN PRIVATE KEY")) {
      return jsonPrivateKey;
    }
  } catch {
    // Not JSON, continue to final null.
  }

  return null;
}

if (firebaseAdminConfigReady) {
  try {
    const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (!privateKey) {
      firebaseAdminInitError = "Invalid FIREBASE_PRIVATE_KEY format";
    } else {
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
  } catch (error) {
    firebaseAdminInitError =
      error instanceof Error ? error.message : "Firebase Admin initialization failed";
    adminAuth = null;
  }
}

export { adminAuth, firebaseAdminInitError };
