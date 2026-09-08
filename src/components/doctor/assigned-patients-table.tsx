"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Timestamp, collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";

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
  phoneNumber: string;
  gender: string;
  createdAt?: Timestamp;
};

function fullName(patient: PatientRecord) {
  return [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(" ");
}

function formatRegisteredAt(createdAt?: Timestamp) {
  if (!createdAt) return "Just now";

  return createdAt.toDate().toLocaleString();
}

export function AssignedPatientsTable() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firestore) {
      setError("Firestore is not configured. Add Firebase keys to .env.local.");
      setLoading(false);
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
        setPatients(
          snapshot.docs.map((entry) => ({
            id: entry.id,
            ...(entry.data() as Omit<PatientRecord, "id">),
          })),
        );
        setLoading(false);
      },
      () => {
        setError("Unable to load registered patients.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Registered Patients Queue</CardTitle>
        <Badge variant="default">{patients.length} patients</Badge>
      </CardHeader>
      <CardContent>
        {error && <p className="mb-4 rounded-xl bg-[#ffe2e2] p-3 text-xs text-danger">{error}</p>}

        {loading ? (
          <p className="text-sm text-muted">Loading patients...</p>
        ) : patients.length === 0 ? (
          <p className="text-sm text-muted">No registered patients yet.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <TH>Patient No.</TH>
                <TH>Name</TH>
                <TH>Gender</TH>
                <TH>Phone</TH>
                <TH>Registered At</TH>
                <TH>Action</TH>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id} className="border-t border-border">
                  <TD className="font-semibold text-foreground">{patient.patientNumber}</TD>
                  <TD>{fullName(patient)}</TD>
                  <TD>{patient.gender}</TD>
                  <TD>{patient.phoneNumber}</TD>
                  <TD>{formatRegisteredAt(patient.createdAt)}</TD>
                  <TD>
                    <Link href={`/consultations?patientId=${patient.id}`}>
                      <Button size="sm">Treat Patient</Button>
                    </Link>
                  </TD>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
