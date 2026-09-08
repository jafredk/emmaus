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

export function ClaimsForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleOption>("RECEPTIONIST");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Failed to set custom claim");
      }

      toast.success(data.message ?? "Role updated successfully.");
      setEmail("");
      setRole("RECEPTIONIST");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="claim-email">Staff Email</Label>
        <Input
          id="claim-email"
          type="email"
          placeholder="staff@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="claim-role">Role</Label>
        <select
          id="claim-role"
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

      <div className="md:col-span-3 flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Updating..." : "Set Role Claim"}
        </Button>
      </div>
    </form>
  );
}