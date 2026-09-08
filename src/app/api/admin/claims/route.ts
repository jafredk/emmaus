import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerUser } from "@/lib/auth-server";
import {
  firebaseAdminConfigReady,
  firebaseAdminMissingKeys,
  getAdminAuth,
  getFirebaseAdminInitError,
} from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const claimSchema = z.object({
  email: z.string().email("Provide a valid user email"),
  role: z.enum([
    "ADMINISTRATOR",
    "RECEPTIONIST",
    "DOCTOR",
    "LAB_TECHNICIAN",
    "PHARMACIST",
  ]),
});

export async function POST(request: Request) {
  const adminAuth = getAdminAuth();
  const firebaseAdminInitError = getFirebaseAdminInitError();
  const actor = await getServerUser();

  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (actor.role !== "ADMINISTRATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!firebaseAdminConfigReady || !adminAuth) {
    return NextResponse.json(
      {
        error: "Firebase Admin configuration is missing",
        missingKeys: firebaseAdminMissingKeys,
        initError: firebaseAdminInitError,
      },
      { status: 503 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = claimSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request payload",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { email, role } = parsed.data;

  try {
    const userRecord = await adminAuth.getUserByEmail(email);
    const currentClaims = userRecord.customClaims ?? {};

    await adminAuth.setCustomUserClaims(userRecord.uid, {
      ...currentClaims,
      role,
    });

    await adminAuth.revokeRefreshTokens(userRecord.uid);

    return NextResponse.json({
      ok: true,
      uid: userRecord.uid,
      email: userRecord.email,
      role,
      message: "Custom claim updated. User must sign out and sign back in.",
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code?: string };

      if (err.code === "auth/user-not-found") {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ error: "Failed to set custom claim" }, { status: 500 });
  }
}