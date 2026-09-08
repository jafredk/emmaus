export type UserRole =
  | "ADMINISTRATOR"
  | "RECEPTIONIST"
  | "DOCTOR"
  | "LAB_TECHNICIAN"
  | "PHARMACIST";

export type AuthUser = {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
};

export type MetricCard = {
  title: string;
  value: string;
  tone?: "primary" | "success" | "warning" | "danger";
};

export type NavItem = {
  label: string;
  href: string;
  roles: UserRole[];
};
