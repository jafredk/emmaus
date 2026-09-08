import { ClaimsForm } from "@/components/admin/claims-form";
import { CreateUserForm } from "@/components/admin/create-user-form";
import { MetricCard } from "@/components/layout/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TD, TH } from "@/components/ui/table";
import { adminMetrics } from "@/lib/mock-data";
import { requireRole } from "@/lib/auth-server";

export default async function AdminDashboardPage() {
  await requireRole(["ADMINISTRATOR"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Administrator Dashboard</h1>
        <p className="text-sm text-muted">
          System operations, staffing, medicine stock, and activity overview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminMetrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Staff User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted">
            Create a Firebase Auth staff account and assign role in one step.
          </p>
          <CreateUserForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Staff Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted">
            Assign Firebase custom role claims by email. Users must sign out and back in
            to receive updated permissions.
          </p>
          <ClaimsForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <thead>
              <tr>
                <TH>User</TH>
                <TH>Action</TH>
                <TH>Module</TH>
                <TH>Time</TH>
                <TH>Status</TH>
              </tr>
            </thead>
            <tbody>
              {[
                ["Dr. Njeri", "Updated consultation fee", "Billing", "09:42", "Success"],
                ["Pharm. Musa", "Marked low stock", "Pharmacy", "09:16", "Warning"],
                ["Admin Jane", "Activated user", "Users", "08:57", "Success"],
              ].map((row) => (
                <tr key={row[0] + row[3]} className="border-t border-border">
                  <TD>{row[0]}</TD>
                  <TD>{row[1]}</TD>
                  <TD>{row[2]}</TD>
                  <TD>{row[3]}</TD>
                  <TD>
                    <Badge variant={row[4] === "Warning" ? "warning" : "success"}>
                      {row[4]}
                    </Badge>
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
