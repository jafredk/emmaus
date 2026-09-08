import type { UserRole } from "@/types";

const ROLE_SET: Record<string, UserRole> = {
  ADMINISTRATOR: "ADMINISTRATOR",
  RECEPTIONIST: "RECEPTIONIST",
  DOCTOR: "DOCTOR",
  LAB_TECHNICIAN: "LAB_TECHNICIAN",
  PHARMACIST: "PHARMACIST",
};

function normalizeClaimRole(claimRole?: string | null) {
  const normalized = claimRole?.toUpperCase() ?? "";

  if (!normalized) {
    return null;
  }

  return ROLE_SET[normalized] ?? null;
}

export function resolveUserRole(
  email?: string | null,
  claimRole?: string | null,
): UserRole {
  const roleFromClaim = normalizeClaimRole(claimRole);

  if (roleFromClaim) {
    return roleFromClaim;
  }

  const normalizedEmail = email?.toLowerCase() ?? "";

  if (normalizedEmail === "jafredjin@gmail.com") return "RECEPTIONIST";

  if (normalizedEmail.includes("admin")) return "ADMINISTRATOR";
  if (normalizedEmail.includes("doctor")) return "DOCTOR";
  if (normalizedEmail.includes("lab")) return "LAB_TECHNICIAN";
  if (normalizedEmail.includes("pharm")) return "PHARMACIST";

  return "RECEPTIONIST";
}