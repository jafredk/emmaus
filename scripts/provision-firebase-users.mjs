import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function normalizePrivateKey(rawValue) {
  if (!rawValue) {
    return null;
  }

  const trimmed = String(rawValue).trim();
  const unescaped = trimmed.replace(/\\n/g, "\n");
  const withoutWrappingQuotes =
    unescaped.startsWith('"') && unescaped.endsWith('"')
      ? unescaped.slice(1, -1)
      : unescaped;

  if (withoutWrappingQuotes.includes("BEGIN PRIVATE KEY")) {
    return withoutWrappingQuotes;
  }

  return null;
}

const accounts = [
  { email: "doctor@gmail.com", password: "Doctor@123", role: "DOCTOR", displayName: "Doctor User" },
  { email: "reception@gmail.com", password: "Reception@123", role: "RECEPTIONIST", displayName: "Reception User" },
  { email: "admin@gmail.com", password: "Admin@123", role: "ADMINISTRATOR", displayName: "Admin User" },
];

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing Firebase Admin env values. Check .env.local");
  process.exit(1);
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
});

const auth = getAuth(app);

for (const account of accounts) {
  try {
    const existing = await auth.getUserByEmail(account.email);
    await auth.setCustomUserClaims(existing.uid, { role: account.role });
    console.log(`Updated existing user: ${account.email} -> ${account.role}`);
  } catch (error) {
    if (error?.code !== "auth/user-not-found") {
      throw error;
    }

    const created = await auth.createUser({
      email: account.email,
      password: account.password,
      emailVerified: true,
      displayName: account.displayName,
    });

    await auth.setCustomUserClaims(created.uid, { role: account.role });
    console.log(`Created user: ${account.email} -> ${account.role}`);
  }
}

console.log("Firebase Auth user provisioning complete.");
