import { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    roles: [
      "ADMINISTRATOR",
      "RECEPTIONIST",
      "DOCTOR",
      "LAB_TECHNICIAN",
      "PHARMACIST",
    ],
  },
  {
    label: "New Patient",
    href: "/patients/new",
    roles: ["RECEPTIONIST"],
  },
  {
    label: "Patients List",
    href: "/patients",
    roles: ["RECEPTIONIST", "ADMINISTRATOR"],
  },
  {
    label: "New Appointment",
    href: "/appointments/new",
    roles: ["RECEPTIONIST"],
  },
  {
    label: "Consultations",
    href: "/consultations",
    roles: ["DOCTOR"],
  },
  {
    label: "Laboratory",
    href: "/laboratory",
    roles: ["LAB_TECHNICIAN", "DOCTOR"],
  },
  {
    label: "Pharmacy",
    href: "/pharmacy",
    roles: ["PHARMACIST", "DOCTOR"],
  },
  {
    label: "Admin",
    href: "/dashboard/admin",
    roles: ["ADMINISTRATOR"],
  },
];
