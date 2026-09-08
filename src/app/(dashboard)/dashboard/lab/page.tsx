import { MetricCard } from "@/components/layout/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TD, TH } from "@/components/ui/table";
import { labMetrics } from "@/lib/mock-data";
import { requireRole } from "@/lib/auth-server";

export default async function LabDashboardPage() {
  await requireRole(["LAB_TECHNICIAN", "ADMINISTRATOR"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Laboratory Dashboard</h1>
        <p className="text-sm text-muted">
          Process ordered tests and flag critical outcomes for doctors.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {labMetrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Lab Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">
            No lab orders yet. Doctor requests will appear here from live workflow data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
