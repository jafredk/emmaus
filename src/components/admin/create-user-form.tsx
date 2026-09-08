"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const roleOptions = [
  "ADMINISTRATOR",
  "RECEPTIONIST",
  "DOCTOR",
  "LAB_TECHNICIAN",
  "PHARMACIST",
] as const;

type RoleOption = (typeof roleOptions)[number];

export function CreateUserForm() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleOption>("RECEPTIONIST");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          email,
          password,
          role,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Failed to create user");
      }

      toast.success(data.message ?? "User created successfully.");
      setDisplayName("");
      setEmail("");
      setPassword("");
      setRole("RECEPTIONIST");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="new-user-display-name">Display Name</Label>
        <Input
          id="new-user-display-name"
          placeholder="Jane Doe"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-user-role">Role</Label>
        <select
          id="new-user-role"
          className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={role}
          onChange={(event) => setRole(event.target.value as RoleOption)}
        >
          {roleOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-user-email">Email</Label>
        <Input
          id="new-user-email"
          type="email"
          placeholder="staff@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-user-password">Password</Label>
        <Input
          id="new-user-password"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={6}
        />
      </div>

      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create Staff User"}
        </Button>
      </div>
    </form>
  );
}