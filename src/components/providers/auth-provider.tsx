"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

import { firebaseAuth, firebaseConfigReady } from "@/lib/firebase-client";
import { resolveUserRole } from "@/lib/roles";
import type { AuthUser } from "@/types";

type AuthContextType = {
  user: AuthUser | null;
  firebaseUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigReady || !firebaseAuth) {
      const hydrateSession = async () => {
        try {
          const response = await fetch("/api/auth/session");

          if (!response.ok) {
            setUser(null);
            return;
          }

          const data = (await response.json()) as { user: AuthUser | null };
          setUser(data.user ?? null);
        } catch {
          setUser(null);
        } finally {
          setLoading(false);
        }
      };

      void hydrateSession();
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (authUser) => {
      setFirebaseUser(authUser);

      if (authUser) {
        const token = await authUser.getIdToken();
        const tokenResult = await authUser.getIdTokenResult();
        const claimRole = (tokenResult.claims.role as string | undefined) ?? null;
        const role = resolveUserRole(authUser.email, claimRole);

        setUser({
          uid: authUser.uid,
          email: authUser.email ?? "",
          displayName: authUser.displayName ?? "Healthcare Staff",
          role,
        });

        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      } else {
        setUser(null);
        await fetch("/api/auth/logout", { method: "POST" });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      firebaseUser,
      loading,
      logout: async () => {
        await fetch("/api/auth/logout", { method: "POST" });

        if (firebaseAuth) {
          await signOut(firebaseAuth);
        }

        setFirebaseUser(null);
        setUser(null);
      },
    }),
    [user, firebaseUser, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
