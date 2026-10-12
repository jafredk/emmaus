"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { toast } from "sonner";

import { MetricCard } from "@/components/layout/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TD, TH } from "@/components/ui/table";
import { firestore } from "@/lib/firebase-client";
import { receptionistMetrics } from "@/lib/mock-data";

type PatientStatusRecord = {
  dischargeStatus?: "ACTIVE" | "DISCHARGED" | null;
  createdAt?: Timestamp;
};

export default function ReceptionistDashboardPage() {
  const [patientStatus, setPatientStatus] = useState({ active: 0, discharged: 0 });
  const [liveUpdate, setLiveUpdate] = useState(false);
  const previousStatus = useRef({ active: 0, discharged: 0 });

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

          return acc;
        },
        { active: 0, discharged: 0 },
      );

      const wasUpdated =
        stats.discharged !== previousStatus.current.discharged ||
        stats.active !== previousStatus.current.active;

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
    const summary = `Active patients: ${patientStatus.active}\nDischarged patients: ${patientStatus.discharged}`;

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
          <h1 className="text-2xl font-black tracking-tight">Receptionist Dashboard</h1>
          <p className="text-sm text-muted">
            Register patients, schedule appointments, and manage check-in queue.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/patients/new">
            <Button>Register Patient</Button>
          </Link>
          <Link href="/appointments/new">
            <Button variant="outline">Schedule Appointment</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {receptionistMetrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
              <span className="text-sm text-muted">Active</span>
              <span className="text-xl font-bold text-foreground">{patientStatus.active}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#dff7ea] p-3">
              <span className="text-sm text-muted">Discharged</span>
              <span className="text-xl font-bold text-foreground">{patientStatus.discharged}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Waiting Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted">
              No queued patients yet. Register a patient, then assign and check in from live workflow screens.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
