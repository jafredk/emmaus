"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Loader2, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  firebaseAuth,
  firebaseConfigReady,
  firebaseMissingKeys,
} from "@/lib/firebase-client";
import { resolveUserRole } from "@/lib/roles";
import { loginSchema } from "@/lib/validations";

type LoginInput = z.infer<typeof loginSchema>;

function getLoginErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    const authError = error as { code?: string };

    if (authError.code === "auth/invalid-credential") {
      return "Invalid email or password.";
    }

    if (authError.code === "auth/user-not-found") {
      return "Account not found in Firebase Auth.";
    }

    if (authError.code === "auth/too-many-requests") {
      return "Too many attempts. Please wait and try again.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to sign in. Check Firebase Auth configuration and credentials.";
}

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginInput) => {
    setIsSubmitting(true);

    try {
      if (!firebaseConfigReady || !firebaseAuth) {
        throw new Error("Firebase Auth is not configured. Check your .env.local keys and restart the dev server.");
      }

      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        values.email,
        values.password,
      );

      const token = await credential.user.getIdToken();
      const sessionResponse = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!sessionResponse.ok) {
        const data = (await sessionResponse.json().catch(() => null)) as {
          error?: string;
          missingKeys?: string[];
        } | null;

        if (data?.error === "Firebase Admin is not configured") {
          const missing = data.missingKeys?.length
            ? ` Missing: ${data.missingKeys.join(", ")}.`
            : "";
          throw new Error(`Server auth is not configured.${missing}`);
        }

        throw new Error(data?.error ?? "Unable to establish server session.");
      }

      const tokenResult = await credential.user.getIdTokenResult();
      const claimRole = (tokenResult.claims.role as string | undefined) ?? null;
      const role = resolveUserRole(values.email, claimRole);

      const rolePathMap = {
        ADMINISTRATOR: "/dashboard/admin",
        RECEPTIONIST: "/dashboard/receptionist",
        DOCTOR: "/dashboard/doctor",
        LAB_TECHNICIAN: "/dashboard/lab",
        PHARMACIST: "/dashboard/pharmacy",
      } as const;

      toast.success("Login successful");
      router.push(rolePathMap[role]);
    } catch (error) {
      toast.error(getLoginErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="healthcare-bg flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="inline-flex w-fit rounded-full bg-[#d9edff] px-3 py-1 text-xs font-semibold text-primary">
            Secure Access
          </p>
          <CardTitle className="text-2xl">Staff Login</CardTitle>
          <p className="text-sm text-muted">
            Sign in with your authorized Firebase account.
          </p>
          <p className="text-xs text-muted">
            Use a Firebase Auth staff account with a role custom claim.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" />
                <Input id="email" type="email" className="pl-9" {...form.register("email")} />
              </div>
              {form.formState.errors.email && (
                <p className="text-xs text-danger">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" />
                <Input
                  id="password"
                  type="password"
                  className="pl-9"
                  {...form.register("password")}
                />
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-danger">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            {!firebaseConfigReady && (
              <p className="rounded-xl bg-[#ffe2e2] p-3 text-xs text-danger">
                Firebase Auth configuration missing in .env.local: {firebaseMissingKeys.join(", ")}. Sign-in requires the Firebase client keys and a running dev server restart.
              </p>
            )}

            <p className="rounded-xl bg-[#f4f9ff] p-3 text-xs text-[#365f7b]">
              Role routing is determined by your Firebase Auth email pattern: admin,
              doctor, lab, pharm, or default receptionist.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
