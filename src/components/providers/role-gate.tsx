"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import type { UserRole } from "@/types";

export function RoleGate({
  roles,
  children,
}: {
  roles: UserRole[];
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }

    if (!loading && user && !roles.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [loading, user, roles, router]);

  if (loading || !user || !roles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
