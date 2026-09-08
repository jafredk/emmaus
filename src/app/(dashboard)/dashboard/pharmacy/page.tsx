import { MetricCard } from "@/components/layout/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TD, TH } from "@/components/ui/table";
import { pharmacyMetrics } from "@/lib/mock-data";
import { requireRole } from "@/lib/auth-server";

export default async function PharmacyDashboardPage() {
  await requireRole(["PHARMACIST", "ADMINISTRATOR"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Pharmacy Dashboard</h1>
        <p className="text-sm text-muted">
          Dispense medicines, track stock, and complete billing.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {pharmacyMetrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Low-Stock & Expiry Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <thead>
              <tr>
                <TH>Medicine</TH>
                <TH>Stock</TH>
                <TH>Expiry</TH>
                <TH>Alert</TH>
              </tr>
            </thead>
            <tbody>
              {[
                ["Amoxicillin 500mg", "12", "2027-01-20", "Low Stock"],
                ["Insulin Rapid", "6", "2026-11-02", "Critical"],
                ["Paracetamol 500mg", "24", "2028-03-16", "Low Stock"],
              ].map((row) => (
                <tr key={row[0]} className="border-t border-border">
                  <TD>{row[0]}</TD>
                  <TD>{row[1]}</TD>
                  <TD>{row[2]}</TD>
                  <TD>
                    <Badge variant={row[3] === "Critical" ? "danger" : "warning"}>{row[3]}</Badge>
                  </TD>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
