import { redirect } from "next/navigation";

import { ChartCard } from "@/components/ui/chart-card";
import { requireRole } from "@/lib/auth-server";

export default async function DashboardHomePage() {
  const user = await requireRole([
    "ADMINISTRATOR",
    "RECEPTIONIST",
    "DOCTOR",
    "LAB_TECHNICIAN",
    "PHARMACIST",
  ]);

  const rolePathMap = {
    ADMINISTRATOR: "/dashboard/admin",
    RECEPTIONIST: "/dashboard/receptionist",
    DOCTOR: "/dashboard/doctor",
    LAB_TECHNICIAN: "/dashboard/lab",
    PHARMACIST: "/dashboard/pharmacy",
  } as const;

  const trendData = [
    { label: "Mon", value: 38 },
    { label: "Tue", value: 44 },
    { label: "Wed", value: 42 },
    { label: "Thu", value: 55 },
    { label: "Fri", value: 61 },
    { label: "Sat", value: 49 },
  ];

  if (rolePathMap[user.role]) {
    redirect(rolePathMap[user.role]);
  }

  return (
    <div className="space-y-6">
      <ChartCard title="Patient Flow Trend" data={trendData} />
    </div>
  );
}
