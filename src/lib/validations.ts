import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const patientSchema = z.object({
  firstName: z.string().min(2),
  middleName: z.string().optional(),
  lastName: z.string().min(2),
  dateOfBirth: z.string().min(1),
  gender: z.enum(["Male", "Female", "Other"]),
  nationalId: z.string().min(4),
  phoneNumber: z.string().min(9),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  address: z.string().min(4),
  emergencyContactName: z.string().min(2),
  emergencyContactPhone: z.string().min(9),
  bloodGroup: z.string().min(1),
  knownAllergies: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceMembershipNumber: z.string().optional(),
  nextOfKin: z.string().min(2),
});

export const appointmentSchema = z.object({
  patient: z.string().min(2),
  doctor: z.string().min(2),
  department: z.string().min(2),
  appointmentDate: z.string().min(1),
  appointmentTime: z.string().min(1),
  visitType: z.string().min(2),
  reason: z.string().min(4),
  status: z.enum([
    "Scheduled",
    "Checked In",
    "Waiting",
    "In Consultation",
    "Completed",
    "Cancelled",
    "No Show",
  ]),
  notes: z.string().optional(),
});

export const consultationSchema = z.object({
  chiefComplaint: z.string().min(2),
  historyOfPresentingIllness: z.string().min(4),
  medicalHistory: z.string().min(4),
  currentMedicines: z.string().min(2),
  knownAllergies: z.string().min(2),
  physicalExamination: z.string().min(4),
  provisionalDiagnosis: z.string().min(2),
  finalDiagnosis: z.string().min(2),
  treatmentPlan: z.string().min(4),
  prescriptions: z.string().min(2, "Enter at least one prescribed medicine"),
  nextAction: z.enum(["LAB", "PHARMACY"]),
  labTestType: z.string().optional(),
  doctorNotes: z.string().min(4),
  followUpDate: z.string().optional(),
});
