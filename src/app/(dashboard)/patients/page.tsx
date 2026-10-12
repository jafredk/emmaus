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
  paymentMethod?: string | null;
  insuranceProvider?: string | null;
  dischargeStatus?: "ACTIVE" | "DISCHARGED" | null;
  dischargedAt?: Timestamp | null;
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

function getStatusBadge(status?: string | null) {
  if (status === "DISCHARGED") {
    return <span className="rounded-full bg-[#dff7ea] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1d6f45]">Discharged</span>;
  }

  return <span className="rounded-full bg-[#eaf3ff] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1a4e8c]">Active</span>;
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
  const [dischargedSearch, setDischargedSearch] = useState("");
  const [showOnlyDischarged, setShowOnlyDischarged] = useState(false);

  const activePatients = patients.filter((patient) => patient.dischargeStatus !== "DISCHARGED");
  const dischargedPatients = patients.filter((patient) => patient.dischargeStatus === "DISCHARGED");
  const filteredDischargedPatients = dischargedPatients.filter((patient) => {
    const term = dischargedSearch.trim().toLowerCase();

    if (!term) {
      return true;
    }

    const fullName = formatPatientName(patient).toLowerCase();
    return (
      patient.patientNumber?.toLowerCase().includes(term)
      || fullName.includes(term)
      || patient.phoneNumber?.toLowerCase().includes(term)
      || patient.insuranceProvider?.toLowerCase().includes(term)
    );
  });
  const canDelete = user?.role === "ADMINISTRATOR";

  const exportDischargedPatients = () => {
    if (filteredDischargedPatients.length === 0) {
      toast("No discharged patients to export.");
      return;
    }

    const csvRows = [
      ["Status", "Patient Number", "Full Name", "Gender", "Phone", "Insurance", "Payment", "Discharged At"],
      ...filteredDischargedPatients.map((patient) => [
        "DISCHARGED",
        patient.patientNumber,
        formatPatientName(patient),
        patient.gender,
        patient.phoneNumber,
        patient.insuranceProvider || "-",
        patient.paymentMethod || "-",
        patient.dischargedAt ? patient.dischargedAt.toDate().toISOString() : "-",
      ]),
    ];

    const csvContent = csvRows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "discharged-patients.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast.success("Discharged patient list exported.");
  };

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
            <CardTitle>Active Patients</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <p className="mb-4 rounded-xl bg-[#ffe2e2] p-3 text-xs text-danger">{error}</p>
            )}

            {loading ? (
              <p className="text-sm text-muted">Loading patients...</p>
            ) : activePatients.length === 0 ? (
              <p className="text-sm text-muted">No active patients at the moment.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <TH>Status</TH>
                    <TH>Patient No.</TH>
                    <TH>Full Name</TH>
                    <TH>Gender</TH>
                    <TH>Phone</TH>
                    <TH>Email</TH>
                    <TH>Payment</TH>
                    <TH>Registered At</TH>
                    <TH>Actions</TH>
                  </tr>
                </thead>
                <tbody>
                  {activePatients.map((patient) => (
                    <tr key={patient.id} className="border-t border-border">
                      <TD>{getStatusBadge(patient.dischargeStatus)}</TD>
                      <TD className="font-semibold text-foreground">{patient.patientNumber}</TD>
                      <TD>{formatPatientName(patient)}</TD>
                      <TD>{patient.gender}</TD>
                      <TD>{patient.phoneNumber}</TD>
                      <TD>{patient.email || "-"}</TD>
                      <TD>{patient.paymentMethod || "-"}</TD>
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

        <Card>
          <CardHeader>
            <CardTitle>Discharged Patients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <input
                value={dischargedSearch}
                onChange={(event) => setDischargedSearch(event.target.value)}
                placeholder="Search discharged patients by name, patient number, phone, or insurance"
                className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground"
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={showOnlyDischarged}
                    onChange={(event) => setShowOnlyDischarged(event.target.checked)}
                    className="h-4 w-4"
                  />
                  Show only discharged
                </label>
                <Button size="sm" variant="outline" onClick={exportDischargedPatients}>
                  Export CSV
                </Button>
              </div>
            </div>

            {dischargedPatients.length === 0 ? (
              <p className="text-sm text-muted">No discharged patients yet.</p>
            ) : filteredDischargedPatients.length === 0 ? (
              <p className="text-sm text-muted">No matching discharged patients found.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <TH>Status</TH>
                    <TH>Patient No.</TH>
                    <TH>Full Name</TH>
                    <TH>Gender</TH>
                    <TH>Phone</TH>
                    <TH>Insurance</TH>
                    <TH>Payment</TH>
                    <TH>Discharged At</TH>
                  </tr>
                </thead>
                <tbody>
                  {(showOnlyDischarged ? filteredDischargedPatients : filteredDischargedPatients).map((patient) => (
                    <tr key={patient.id} className="border-t border-border">
                      <TD>{getStatusBadge(patient.dischargeStatus)}</TD>
                      <TD className="font-semibold text-foreground">{patient.patientNumber}</TD>
                      <TD>{formatPatientName(patient)}</TD>
                      <TD>{patient.gender}</TD>
                      <TD>{patient.phoneNumber}</TD>
                      <TD>{patient.insuranceProvider || "-"}</TD>
                      <TD>{patient.paymentMethod || "-"}</TD>
                      <TD>{patient.dischargedAt ? patient.dischargedAt.toDate().toLocaleString() : "-"}</TD>
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