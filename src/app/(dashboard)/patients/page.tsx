"use client";

import { useEffect, useState } from "react";
import { Timestamp, collection, deleteDoc, doc, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { RoleGate } from "@/components/providers/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TD, TH } from "@/components/ui/table";
import { firestore } from "@/lib/firebase-client";

type PatientRecord = {
  id: string;
  patientNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  phoneNumber: string;
  email?: string | null;
  createdAt?: Timestamp;
};

function formatPatientName(patient: PatientRecord) {
  return [patient.firstName, patient.middleName, patient.lastName]
    .filter(Boolean)
    .join(" ");
}

function formatCreatedAt(createdAt?: Timestamp) {
  if (!createdAt) return "Just now";

  return createdAt.toDate().toLocaleString();
}

export default function PatientsListPage() {
  const { user } = useAuth();
  const firestoreUnavailable = !firestore;
  const firestoreConfigError = firestoreUnavailable
    ? "Firestore is not configured. Add Firebase keys to .env.local."
    : null;
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(!firestoreUnavailable);
  const [error, setError] = useState<string | null>(firestoreConfigError);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canDelete = user?.role === "ADMINISTRATOR";

  const deletePatient = async (patientId: string, patientNumber: string) => {
    if (!firestore) {
      toast.error("Firestore is not configured. Add Firebase keys to .env.local.");
      return;
    }

    if (!canDelete) {
      toast.error("Only admin can delete patient records.");
      return;
    }

    try {
      setDeletingId(patientId);
      await deleteDoc(doc(firestore, "patients", patientId));
      toast.success(`Deleted patient ${patientNumber}`);
    } catch {
      toast.error("Unable to delete patient record.");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (firestoreUnavailable || !firestore) {
      return;
    }

    const patientsQuery = query(
      collection(firestore, "patients"),
      orderBy("createdAt", "desc"),
      limit(50),
    );

    const unsubscribe = onSnapshot(
      patientsQuery,
      (snapshot) => {
        const records = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<PatientRecord, "id">),
        }));

        setPatients(records);
        setLoading(false);
      },
      () => {
        setError("Unable to load patients. Check Firestore rules and indexes.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [firestoreUnavailable]);

  return (
    <RoleGate roles={["RECEPTIONIST", "ADMINISTRATOR"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Patients List</h1>
            <p className="text-sm text-muted">
              Recently registered patients for reception confirmation.
            </p>
          </div>
          <Badge variant="default">Showing latest {patients.length}</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registered Patients</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <p className="mb-4 rounded-xl bg-[#ffe2e2] p-3 text-xs text-danger">{error}</p>
            )}

            {loading ? (
              <p className="text-sm text-muted">Loading patients...</p>
            ) : patients.length === 0 ? (
              <p className="text-sm text-muted">No patients found yet.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <TH>Patient No.</TH>
                    <TH>Full Name</TH>
                    <TH>Gender</TH>
                    <TH>Phone</TH>
                    <TH>Email</TH>
                    <TH>Registered At</TH>
                    <TH>Actions</TH>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id} className="border-t border-border">
                      <TD className="font-semibold text-foreground">{patient.patientNumber}</TD>
                      <TD>{formatPatientName(patient)}</TD>
                      <TD>{patient.gender}</TD>
                      <TD>{patient.phoneNumber}</TD>
                      <TD>{patient.email || "-"}</TD>
                      <TD>{formatCreatedAt(patient.createdAt)}</TD>
                      <TD>
                        {canDelete ? (
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={deletingId === patient.id}
                            onClick={() => deletePatient(patient.id, patient.patientNumber)}
                          >
                            {deletingId === patient.id ? "Deleting..." : "Delete"}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted">View only</span>
                        )}
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGate>
  );
}