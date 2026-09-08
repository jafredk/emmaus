import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getServerUser } from "@/lib/auth-server";
import {
  firebaseAdminMissingKeys,
  getAdminAuth,
  getFirebaseAdminInitError,
} from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_COOKIE_NAME = "session";

export async function POST(request: Request) {
  const adminAuth = getAdminAuth();
  const firebaseAdminInitError = getFirebaseAdminInitError();

  try {
    const { token } = await request.json();

    if (token && adminAuth) {
      const expiresIn = 60 * 60 * 24 * 5 * 1000;
      const sessionCookie = await adminAuth.createSessionCookie(token, { expiresIn });

      (await cookies()).set(SESSION_COOKIE_NAME, sessionCookie, {
        maxAge: expiresIn / 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      return NextResponse.json({ ok: true });
    }

    if (token && !adminAuth) {
      return NextResponse.json(
        {
          error: "Firebase Admin is not configured",
          missingKeys: firebaseAdminMissingKeys,
          initError: firebaseAdminInitError,
        },
        { status: 503 },
      );
    }

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function GET() {
  const user = await getServerUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
