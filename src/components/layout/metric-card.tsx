import { Activity, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MetricCard as MetricCardType } from "@/types";

const toneStyles = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

const toneIcons = {
  primary: Activity,
  success: CheckCircle2,
  warning: TrendingUp,
  danger: AlertCircle,
};

export function MetricCard({ title, value, tone = "primary" }: MetricCardType) {
  const Icon = toneIcons[tone];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm text-muted">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${toneStyles[tone]}`} />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
