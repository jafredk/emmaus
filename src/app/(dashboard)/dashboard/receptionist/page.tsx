import Link from "next/link";

import { MetricCard } from "@/components/layout/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TD, TH } from "@/components/ui/table";
import { receptionistMetrics } from "@/lib/mock-data";
import { requireRole } from "@/lib/auth-server";

export default async function ReceptionistDashboardPage() {
  await requireRole(["RECEPTIONIST", "ADMINISTRATOR"]);

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
  );
}
