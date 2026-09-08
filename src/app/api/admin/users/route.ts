import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerUser } from "@/lib/auth-server";
import {
  adminAuth,
  firebaseAdminConfigReady,
  firebaseAdminInitError,
  firebaseAdminMissingKeys,
} from "@/lib/firebase-admin";

const createUserSchema = z.object({
  email: z.string().email("Provide a valid user email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().trim().min(2, "Display name is required").optional(),
  role: z.enum([
    "ADMINISTRATOR",
    "RECEPTIONIST",
    "DOCTOR",
    "LAB_TECHNICIAN",
    "PHARMACIST",
  ]),
});

export async function POST(request: Request) {
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

  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request payload",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { email, password, displayName, role } = parsed.data;

  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: displayName || undefined,
      emailVerified: true,
      disabled: false,
    });

    await adminAuth.setCustomUserClaims(userRecord.uid, { role });

    return NextResponse.json(
      {
        ok: true,
        uid: userRecord.uid,
        email: userRecord.email,
        role,
        message: "User created and role assigned successfully.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code?: string };

      if (err.code === "auth/email-already-exists") {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 },
        );
      }
    }

    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}