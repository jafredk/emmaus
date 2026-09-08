"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { AuthProvider } from "@/components/providers/auth-provider";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}
