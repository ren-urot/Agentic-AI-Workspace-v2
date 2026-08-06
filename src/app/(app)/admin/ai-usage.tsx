"use client";

import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentCostEntry, ChartPoint } from "@/lib/mock-data/types";

const TOOLTIP_STYLE = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  color: "var(--popover-foreground)",
};

function EmptyChart({ message }: { message: string }) {
  return <p className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">{message}</p>;
}

export function AiUsageMonitoring({ usage, costs }: { usage: ChartPoint[]; costs: AgentCostEntry[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">AI Requests (last 7 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {usage.length === 0 ? (
            <EmptyChart message="No requests yet." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usage}>
                <XAxis dataKey="label" fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis fontSize={12} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Estimated Cost per Agent ($)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {costs.length === 0 ? (
            <EmptyChart message="No agent costs yet." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costs}>
                <XAxis
                  dataKey="agentName"
                  fontSize={11}
                  stroke="var(--muted-foreground)"
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis fontSize={12} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="cost" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
