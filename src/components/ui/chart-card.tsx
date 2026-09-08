"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChartCardProps = {
  title: string;
  data: Array<{ label: string; value: number }>;
};

export function ChartCard({ title, data }: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8e8f5" />
              <XAxis dataKey="label" stroke="#4f708a" />
              <YAxis stroke="#4f708a" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#0f8f94"
                strokeWidth={3}
                dot={{ r: 3, fill: "#0f5ea8" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
