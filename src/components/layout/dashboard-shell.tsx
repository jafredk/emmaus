"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useAuth } from "@/components/providers/auth-provider";

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center healthcare-bg">
        <p className="rounded-xl bg-white px-6 py-4 font-semibold text-primary shadow-lg">
          Loading healthcare workspace...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen healthcare-bg">
      <div className="hidden w-72 lg:block">
        <Sidebar role={user.role} />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#0a2b44]/50 lg:hidden">
          <div className="h-full w-72 bg-white">
            <Sidebar role={user.role} onNavigate={() => setMobileMenuOpen(false)} />
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute right-0 top-0 h-full w-[calc(100%-18rem)]"
          />
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar
          user={user}
          onMenuClick={() => setMobileMenuOpen(true)}
          onLogout={logout}
        />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
