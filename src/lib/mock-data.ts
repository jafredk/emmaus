import { MetricCard } from "@/types";

export const adminMetrics: MetricCard[] = [
  { title: "Daily Patients", value: "0", tone: "primary" },
  { title: "Lab Workload", value: "0", tone: "warning" },
  { title: "Low Stock Alerts", value: "0", tone: "danger" },
  { title: "Active Staff", value: "0", tone: "success" },
];

export const receptionistMetrics: MetricCard[] = [
  { title: "Patients Registered Today", value: "0", tone: "primary" },
  { title: "Appointments Today", value: "0", tone: "warning" },
  { title: "Waiting for Consultation", value: "0", tone: "warning" },
  { title: "Completed Visits", value: "0", tone: "success" },
];

export const doctorMetrics: MetricCard[] = [
  { title: "Today Appointments", value: "0", tone: "primary" },
  { title: "Patients Waiting", value: "0", tone: "warning" },
  { title: "In Consultation", value: "0", tone: "warning" },
  { title: "Pending Lab Results", value: "0", tone: "danger" },
];

export const labMetrics: MetricCard[] = [
  { title: "Tests Ordered Today", value: "0", tone: "primary" },
  { title: "Pending Samples", value: "0", tone: "warning" },
  { title: "Critical Results", value: "0", tone: "danger" },
  { title: "Completed", value: "0", tone: "success" },
];

export const pharmacyMetrics: MetricCard[] = [
  { title: "Prescriptions Today", value: "0", tone: "primary" },
  { title: "Pending Payments", value: "0", tone: "warning" },
  { title: "Low Stock Medicines", value: "0", tone: "danger" },
  { title: "Dispensed", value: "0", tone: "success" },
];

export const patientStatuses = [
  "Scheduled",
  "Checked In",
  "Waiting",
  "In Consultation",
  "Completed",
  "Cancelled",
  "No Show",
] as const;
