"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { toast } from "sonner";

import { AssignedPatientsTable } from "@/components/doctor/assigned-patients-table";
import { MetricCard } from "@/components/layout/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { firestore } from "@/lib/firebase-client";
import { doctorMetrics } from "@/lib/mock-data";

type PatientStatusRecord = {
  dischargeStatus?: "ACTIVE" | "DISCHARGED" | null;
  createdAt?: Timestamp;
};

export default function DoctorDashboardPage() {
  const [patientStatus, setPatientStatus] = useState({ active: 0, discharged: 0, total: 0 });
  const [liveUpdate, setLiveUpdate] = useState(false);
  const previousStatus = useRef({ active: 0, discharged: 0, total: 0 });

  useEffect(() => {
    if (!firestore) {
      return;
    }

    const patientsQuery = query(collection(firestore, "patients"), orderBy("createdAt", "desc"), limit(200));
    const unsubscribe = onSnapshot(patientsQuery, (snapshot) => {
      const stats = snapshot.docs.reduce(
        (acc, docSnapshot) => {
          const data = docSnapshot.data() as PatientStatusRecord;
          const status = data.dischargeStatus ?? "ACTIVE";

          if (status === "DISCHARGED") {
            acc.discharged += 1;
          } else {
            acc.active += 1;
          }

          acc.total += 1;
          return acc;
        },
        { active: 0, discharged: 0, total: 0 },
      );

      const wasUpdated =
        stats.discharged !== previousStatus.current.discharged ||
        stats.active !== previousStatus.current.active ||
        stats.total !== previousStatus.current.total;

      previousStatus.current = stats;
      setPatientStatus(stats);

      if (wasUpdated) {
        setLiveUpdate(true);
        const timeout = window.setTimeout(() => setLiveUpdate(false), 1200);
        return () => window.clearTimeout(timeout);
      }
    });

    return () => unsubscribe();
  }, []);

  const copyStatusSummary = async () => {
    const summary = `Total patients: ${patientStatus.total}\nActive patients: ${patientStatus.active}\nDischarged patients: ${patientStatus.discharged}`;

    try {
      await navigator.clipboard.writeText(summary);
      toast.success("Patient summary copied to clipboard.");
    } catch {
      toast.error("Unable to copy summary. Clipboard access was blocked.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Doctor Dashboard</h1>
          <p className="text-sm text-muted">
            Manage consultations, diagnoses, lab requests, and prescriptions.
          </p>
        </div>
        <Link href="/consultations">
          <Button>Open Consultation Desk</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {doctorMetrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Patient Status Summary</CardTitle>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${
                liveUpdate ? "animate-pulse bg-[#1bb570]" : "bg-[#9aa4b2]"
              }`}
            >
              Live update
            </span>
            <Button size="sm" variant="outline" onClick={copyStatusSummary}>Copy summary</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between rounded-xl bg-[#f4f9ff] p-3">
            <span className="text-sm text-muted">Total Patients</span>
            <span className="text-xl font-bold text-foreground">{patientStatus.total}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-[#eaf3ff] p-3">
            <span className="text-sm text-muted">Active</span>
            <span className="text-xl font-bold text-foreground">{patientStatus.active}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-[#dff7ea] p-3">
            <span className="text-sm text-muted">Discharged</span>
            <span className="text-xl font-bold text-foreground">{patientStatus.discharged}</span>
          </div>
        </CardContent>
      </Card>

      <AssignedPatientsTable />
    </div>
  );
}
