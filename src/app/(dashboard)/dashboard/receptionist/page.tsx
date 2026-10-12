"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { toast } from "sonner";

import { MetricCard } from "@/components/layout/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { firestore } from "@/lib/firebase-client";

type PatientStatusRecord = {
  dischargeStatus?: "ACTIVE" | "DISCHARGED" | null;
  createdAt?: Timestamp;
};

export default function ReceptionistDashboardPage() {
  const [patientStatus, setPatientStatus] = useState({ active: 0, discharged: 0 });
  const [metrics, setMetrics] = useState({
    patientsToday: 0,
    appointmentsToday: 0,
    waitingForConsultation: 0,
    completedVisits: 0,
  });
  const [liveUpdate, setLiveUpdate] = useState(false);
  const previousStatus = useRef({ active: 0, discharged: 0, patientsToday: 0 });

  const getDateKey = (value?: Timestamp | string | { toDate?: () => Date } | null) => {
    if (!value) return null;

    if (typeof value === "string") {
      return value.slice(0, 10);
    }

    if ("toDate" in value && typeof value.toDate === "function") {
      return value.toDate().toISOString().slice(0, 10);
    }

    return null;
  };

  useEffect(() => {
    if (!firestore) {
      return;
    }

    const todayKey = new Date().toISOString().slice(0, 10);

    const patientsQuery = query(collection(firestore, "patients"), orderBy("createdAt", "desc"), limit(200));
    const appointmentsQuery = query(collection(firestore, "appointments"), orderBy("createdAt", "desc"), limit(200));

    const unsubscribePatients = onSnapshot(patientsQuery, (snapshot) => {
      const stats = snapshot.docs.reduce(
        (acc, docSnapshot) => {
          const data = docSnapshot.data() as PatientStatusRecord;
          const status = data.dischargeStatus ?? "ACTIVE";

          if (status === "DISCHARGED") {
            acc.discharged += 1;
          } else {
            acc.active += 1;
          }

          const createdDate = getDateKey(data.createdAt);
          if (createdDate === todayKey) {
            acc.patientsToday += 1;
          }

          return acc;
        },
        { active: 0, discharged: 0, patientsToday: 0 },
      );

      const wasUpdated =
        stats.discharged !== previousStatus.current.discharged ||
        stats.active !== previousStatus.current.active ||
        stats.patientsToday !== previousStatus.current.patientsToday;

      previousStatus.current = {
        active: stats.active,
        discharged: stats.discharged,
        patientsToday: stats.patientsToday,
      };
      setPatientStatus({ active: stats.active, discharged: stats.discharged });
      setMetrics((current) => ({
        ...current,
        patientsToday: stats.patientsToday,
        waitingForConsultation: stats.active,
        completedVisits: stats.discharged,
      }));

      if (wasUpdated) {
        setLiveUpdate(true);
        const timeout = window.setTimeout(() => setLiveUpdate(false), 1200);
        return () => window.clearTimeout(timeout);
      }
    });

    const unsubscribeAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
      const appointmentsToday = snapshot.docs.filter((docSnapshot) => {
        const data = docSnapshot.data() as { appointmentDate?: string | Timestamp | null; createdAt?: Timestamp | null };
        const dateValue = getDateKey(data.appointmentDate ?? data.createdAt);
        return dateValue === todayKey;
      }).length;

      setMetrics((current) => ({
        ...current,
        appointmentsToday,
      }));
    });

    return () => {
      unsubscribePatients();
      unsubscribeAppointments();
    };
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
        {([
          { title: "Patients Registered Today", value: String(metrics.patientsToday), tone: "primary" as const },
          { title: "Appointments Today", value: String(metrics.appointmentsToday), tone: "warning" as const },
          { title: "Waiting for Consultation", value: String(metrics.waitingForConsultation), tone: "warning" as const },
          { title: "Completed Visits", value: String(metrics.completedVisits), tone: "success" as const },
        ]).map((metric) => (
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
