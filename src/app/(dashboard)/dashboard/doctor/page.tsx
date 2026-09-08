import Link from "next/link";

import { AssignedPatientsTable } from "@/components/doctor/assigned-patients-table";
import { MetricCard } from "@/components/layout/metric-card";
import { Button } from "@/components/ui/button";
import { doctorMetrics } from "@/lib/mock-data";
import { requireRole } from "@/lib/auth-server";

export default async function DoctorDashboardPage() {
  await requireRole(["DOCTOR", "ADMINISTRATOR"]);

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

      <AssignedPatientsTable />
    </div>
  );
}
