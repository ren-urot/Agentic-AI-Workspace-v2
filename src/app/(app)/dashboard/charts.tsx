"use client";

import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ChartPoint } from "@/lib/mock-data/types";

type ChartRange = "7d" | "2w" | "1m" | "3m" | "6m";

const RANGE_OPTIONS: { value: ChartRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "2w", label: "2 weeks" },
  { value: "1m", label: "1 month" },
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
];

const REVENUE_RANGE_DATA: Record<Exclude<ChartRange, "1m">, ChartPoint[]> = {
  "7d": [
    { label: "Mon", value: 8200 },
    { label: "Tue", value: 8900 },
    { label: "Wed", value: 9400 },
    { label: "Thu", value: 9100 },
    { label: "Fri", value: 10200 },
    { label: "Sat", value: 7600 },
    { label: "Sun", value: 6800 },
  ],
  "2w": [
    { label: "Wk 1", value: 42000 },
    { label: "Wk 2", value: 48500 },
  ],
  "3m": [
    { label: "Month 1", value: 158000 },
    { label: "Month 2", value: 172000 },
    { label: "Month 3", value: 189500 },
  ],
  "6m": [
    { label: "Month 1", value: 142000 },
    { label: "Month 2", value: 158000 },
    { label: "Month 3", value: 172000 },
    { label: "Month 4", value: 165000 },
    { label: "Month 5", value: 181000 },
    { label: "Month 6", value: 198500 },
  ],
};

const WORKFLOW_RANGE_DATA: Record<Exclude<ChartRange, "7d">, ChartPoint[]> = {
  "2w": [
    { label: "Wk 1", value: 95 },
    { label: "Wk 2", value: 97 },
  ],
  "1m": [
    { label: "Wk 1", value: 95 },
    { label: "Wk 2", value: 97 },
    { label: "Wk 3", value: 93 },
    { label: "Wk 4", value: 98 },
  ],
  "3m": [
    { label: "Month 1", value: 94 },
    { label: "Month 2", value: 96 },
    { label: "Month 3", value: 97 },
  ],
  "6m": [
    { label: "Month 1", value: 91 },
    { label: "Month 2", value: 93 },
    { label: "Month 3", value: 94 },
    { label: "Month 4", value: 96 },
    { label: "Month 5", value: 95 },
    { label: "Month 6", value: 97 },
  ],
};

const RANGE_LABELS: Record<ChartRange, string> = Object.fromEntries(
  RANGE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<ChartRange, string>;

function RangeSelect({ value, onChange }: { value: ChartRange; onChange: (range: ChartRange) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ChartRange)}>
      <SelectTrigger size="sm" className="w-28">
        <SelectValue>{(v: ChartRange) => RANGE_LABELS[v]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {RANGE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function RevenueChart({ data }: { data: ChartPoint[] }) {
  const [range, setRange] = useState<ChartRange>("1m");
  const chartData = range === "1m" ? data : REVENUE_RANGE_DATA[range];

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-sm">Revenue Impact</CardTitle>
        <CardAction>
          <RangeSelect value={range} onChange={setRange} />
        </CardAction>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <XAxis dataKey="label" fontSize={12} stroke="var(--muted-foreground)" />
            <YAxis fontSize={12} stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--popover)",
                border: "1px solid var(--border)",
                color: "var(--popover-foreground)",
              }}
            />
            <Area type="monotone" dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function WorkflowHealthChart({ data }: { data: ChartPoint[] }) {
  const [range, setRange] = useState<ChartRange>("7d");
  const chartData = range === "7d" ? data : WORKFLOW_RANGE_DATA[range];

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-sm">Workflow Success Rate</CardTitle>
        <CardAction>
          <RangeSelect value={range} onChange={setRange} />
        </CardAction>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="label" fontSize={12} stroke="var(--muted-foreground)" />
            <YAxis fontSize={12} domain={[80, 100]} stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--popover)",
                border: "1px solid var(--border)",
                color: "var(--popover-foreground)",
              }}
            />
            <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
