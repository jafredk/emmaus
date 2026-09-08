"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { RoleGate } from "@/components/providers/role-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { firestore } from "@/lib/firebase-client";
import { consultationSchema } from "@/lib/validations";

type ConsultationInput = z.infer<typeof consultationSchema>;

type PatientRecord = {
  id: string;
  patientNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
};

function formatPatientName(patient: PatientRecord) {
  return [patient.firstName, patient.middleName, patient.lastName]
    .filter(Boolean)
    .join(" ");
}

export default function ConsultationsPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(true);

  const form = useForm<ConsultationInput>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      chiefComplaint: "",
      historyOfPresentingIllness: "",
      medicalHistory: "",
      currentMedicines: "",
      knownAllergies: "",
      physicalExamination: "",
      provisionalDiagnosis: "",
      finalDiagnosis: "",
      treatmentPlan: "",
      prescriptions: "",
      nextAction: "PHARMACY",
      labTestType: "",
      doctorNotes: "",
      followUpDate: "",
    },
  });

  const nextAction = form.watch("nextAction");

  useEffect(() => {
    if (!firestore) {
      toast.error("Firestore is not configured. Add Firebase keys to .env.local.");
      setLoadingPatients(false);
      return;
    }

    const patientsQuery = query(
      collection(firestore, "patients"),
      orderBy("createdAt", "desc"),
      limit(100),
    );

    const unsubscribe = onSnapshot(
      patientsQuery,
      (snapshot) => {
        const records = snapshot.docs.map((entry) => ({
          id: entry.id,
          ...(entry.data() as Omit<PatientRecord, "id">),
        }));

        setPatients(records);
        setLoadingPatients(false);
      },
      () => {
        toast.error("Unable to load registered patients.");
        setLoadingPatients(false);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (patients.length === 0) {
      return;
    }

    const requestedPatientId = searchParams.get("patientId");

    if (requestedPatientId && patients.some((patient) => patient.id === requestedPatientId)) {
      setSelectedPatientId(requestedPatientId);
      return;
    }

    if (!selectedPatientId) {
      setSelectedPatientId(patients[0].id);
    }
  }, [patients, searchParams, selectedPatientId]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) ?? null,
    [patients, selectedPatientId],
  );

  const onSubmit = async (values: ConsultationInput) => {
    if (!firestore) {
      toast.error("Firestore is not configured. Add Firebase keys to .env.local.");
      return;
    }

    if (!user) {
      toast.error("You must be signed in before saving consultation records.");
      return;
    }

    if (!selectedPatient) {
      toast.error("Select a registered patient first.");
      return;
    }

    try {
      const consultationRef = await addDoc(collection(firestore, "consultations"), {
        ...values,
        patientId: selectedPatient.id,
        patientNumber: selectedPatient.patientNumber,
        patientName: formatPatientName(selectedPatient),
        doctorUid: user.uid,
        doctorEmail: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (values.nextAction === "LAB") {
        await addDoc(collection(firestore, "labRequests"), {
          consultationId: consultationRef.id,
          patientId: selectedPatient.id,
          patientNumber: selectedPatient.patientNumber,
          patientName: formatPatientName(selectedPatient),
          testType: values.labTestType?.trim() || "Blood Test",
          diagnosis: values.finalDiagnosis,
          status: "Pending",
          doctorUid: user.uid,
          doctorEmail: user.email,
          requestedBy: user.displayName || user.email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(firestore, "pharmacyQueue"), {
          consultationId: consultationRef.id,
          patientId: selectedPatient.id,
          patientNumber: selectedPatient.patientNumber,
          patientName: formatPatientName(selectedPatient),
          diagnosis: values.finalDiagnosis,
          medications: values.prescriptions,
          status: "Pending Dispense",
          doctorUid: user.uid,
          doctorEmail: user.email,
          requestedBy: user.displayName || user.email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      form.reset({
        chiefComplaint: "",
        historyOfPresentingIllness: "",
        medicalHistory: "",
        currentMedicines: "",
        knownAllergies: "",
        physicalExamination: "",
        provisionalDiagnosis: "",
        finalDiagnosis: "",
        treatmentPlan: "",
        prescriptions: "",
        nextAction: "PHARMACY",
        labTestType: "",
        doctorNotes: "",
        followUpDate: "",
      });

      const routeMessage =
        values.nextAction === "LAB"
          ? "sent to lab first, then pharmacy"
          : "sent directly to pharmacy";

      toast.success(`Consultation saved for ${formatPatientName(selectedPatient)} and ${routeMessage}.`);
    } catch {
      toast.error("Unable to save consultation. Check Firestore rules and role claims.");
    }
  };

  return (
    <RoleGate roles={["DOCTOR", "ADMINISTRATOR"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Consultation Desk</h1>
          <p className="text-sm text-muted">
            Capture symptoms, diagnoses, treatment plans, and follow-up decisions.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Consultation Record</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-2 md:max-w-md">
              <Label htmlFor="patientId">Registered Patient</Label>
              <select
                id="patientId"
                value={selectedPatientId}
                onChange={(event) => setSelectedPatientId(event.target.value)}
                className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-foreground"
                disabled={loadingPatients || patients.length === 0}
              >
                {patients.length === 0 ? (
                  <option value="">No patients available</option>
                ) : (
                  patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.patientNumber} - {formatPatientName(patient)}
                    </option>
                  ))
                )}
              </select>
              {loadingPatients && (
                <p className="inline-flex items-center gap-2 text-xs text-muted">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading registered patients...
                </p>
              )}
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
            {[
              ["chiefComplaint", "Chief Complaint"],
              ["historyOfPresentingIllness", "History of Presenting Illness"],
              ["medicalHistory", "Medical History"],
              ["currentMedicines", "Current Medicines"],
              ["knownAllergies", "Known Allergies"],
              ["physicalExamination", "Physical Examination"],
              ["provisionalDiagnosis", "Provisional Diagnosis"],
              ["finalDiagnosis", "Final Diagnosis"],
              ["treatmentPlan", "Treatment Plan"],
              ["prescriptions", "Drug Prescriptions"],
              ["doctorNotes", "Doctor Notes"],
            ].map(([name, label]) => (
              <div key={name} className="space-y-2 md:col-span-2">
                <Label htmlFor={name}>{label}</Label>
                <Textarea id={name} {...form.register(name as keyof ConsultationInput)} />
              </div>
            ))}

            <div className="space-y-2">
              <Label htmlFor="nextAction">Route Patient To</Label>
              <select
                id="nextAction"
                className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground"
                {...form.register("nextAction")}
              >
                <option value="PHARMACY">Pharmacy Directly</option>
                <option value="LAB">Laboratory First (blood test)</option>
              </select>
            </div>

            {nextAction === "LAB" && (
              <div className="space-y-2">
                <Label htmlFor="labTestType">Blood Test Type</Label>
                <Input
                  id="labTestType"
                  placeholder="e.g. CBC, Blood Sugar, Malaria RDT"
                  {...form.register("labTestType")}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="followUpDate">Follow-up Date</Label>
              <Input id="followUpDate" type="date" {...form.register("followUpDate")} />
            </div>

              <div className="md:col-span-2 flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="warning"
                  onClick={() => toast("Laboratory request queued")}
                >
                  Request Lab Test
                </Button>
                <Button type="button" variant="success" onClick={() => toast("Prescription queued")}>Prescribe Medicine</Button>
                <Button type="submit" disabled={form.formState.isSubmitting || !selectedPatient}>
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Complete Consultation"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </RoleGate>
  );
}
