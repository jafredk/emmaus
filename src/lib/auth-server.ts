import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAdminAuth } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import type { UserRole } from "@/types";

export async function getServerUser() {
  const token = (await cookies()).get("session")?.value;
  const adminAuth = getAdminAuth();

  if (!token) {
    return null;
  }

  if (!adminAuth) {
    return null;
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(token, true);
    const email = decoded.email ?? "";
    const role = resolveUserRole(email, decoded.role as string | undefined);

    return {
      uid: decoded.uid,
      email,
      displayName: decoded.name ?? "Healthcare Staff",
      role,
    };
  } catch {
    return null;
  }
}

export async function requireRole(roles: UserRole[]) {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  if (!roles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}
