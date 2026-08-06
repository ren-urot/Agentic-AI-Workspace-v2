"use client";

import Link from "next/link";
import { AlertTriangle, Bot, CheckCircle2, PiggyBank, Sparkles, Zap } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { AgentIcon } from "@/components/shared/agent-icon";
import type { IconChipVariant } from "@/components/shared/icon-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart, WorkflowHealthChart } from "./charts";
import { WelcomeToast } from "./welcome-toast";
import { resolveAgent, useAppStore } from "@/lib/store/app-store";
import type { ActivityItem, AlertItem, ChartPoint, KpiMetric } from "@/lib/mock-data/types";
import type { LucideIcon } from "lucide-react";

const KPI_PRESENTATION: Record<string, { icon: LucideIcon; variant: IconChipVariant }> = {
  "active-agents": { icon: Bot, variant: "primary" },
  "tasks-automated": { icon: CheckCircle2, variant: "success" },
  "avg-response": { icon: Zap, variant: "info" },
  "cost-saved": { icon: PiggyBank, variant: "warning" },
};

const EMPTY_KPIS: KpiMetric[] = [
  { id: "active-agents", label: "Active Agents", value: "0", delta: 0, trend: "flat" },
  { id: "tasks-automated", label: "Tasks Automated (30d)", value: "0", delta: 0, trend: "flat" },
  { id: "avg-response", label: "Avg Response Time", value: "—", delta: 0, trend: "flat" },
  { id: "cost-saved", label: "Est. Cost Saved (30d)", value: "$0", delta: 0, trend: "flat" },
];

function EmptyCardState({ message }: { message: string }) {
  return <p className="flex h-full min-h-32 items-center justify-center text-center text-sm text-muted-foreground">{message}</p>;
}

export function DashboardContent({
  welcome,
  kpis,
  activity,
  alerts,
  revenue,
  workflowHealth,
}: {
  welcome: boolean;
  kpis: KpiMetric[];
  activity: ActivityItem[];
  alerts: AlertItem[];
  revenue: ChartPoint[];
  workflowHealth: ChartPoint[];
}) {
  const { agents, deployedAgentIds, agentOverrides, workflows } = useAppStore();

  const hasContent = workflows.length > 0 || deployedAgentIds.length > 0;
  const deployedAgents = agents.filter((a) => deployedAgentIds.includes(a.id)).map((a) => resolveAgent(a, agentOverrides));

  const displayedKpis = hasContent
    ? kpis.map((kpi) => (kpi.id === "active-agents" ? { ...kpi, value: String(deployedAgentIds.length) } : kpi))
    : EMPTY_KPIS;

  return (
    <div className="space-y-6">
      <WelcomeToast show={welcome} />
      <PageHeader title="Executive Dashboard" description="Real-time overview of your organization's AI operations." />

      {!hasContent && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">Your workspace is empty</p>
                <p className="text-sm text-muted-foreground">
                  Create your first automation to start seeing agents, activity, and metrics here.
                </p>
              </div>
            </div>
            <Button size="sm" nativeButton={false} render={<Link href="/workflows" />}>
              Create your first automation
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {displayedKpis.map((kpi) => {
          const presentation = KPI_PRESENTATION[kpi.id] ?? { icon: Bot, variant: "primary" as const };
          return <StatCard key={kpi.id} metric={kpi} icon={presentation.icon} variant={presentation.variant} />;
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[437fr_437fr_284fr]">
        {!hasContent ? (
          <>
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-sm">Revenue Impact</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <EmptyCardState message="No data yet — revenue impact appears once agents start completing tasks." />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-sm">Workflow Success Rate</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <EmptyCardState message="No data yet — create a workflow to start tracking success rate." />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <RevenueChart data={revenue} />
            <WorkflowHealthChart data={workflowHealth} />
          </>
        )}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-sm">Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!hasContent ? (
              <EmptyCardState message="No alerts yet." />
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-2 text-sm">
                  <AlertTriangle
                    className={
                      alert.severity === "critical"
                        ? "mt-0.5 h-4 w-4 shrink-0 text-red-500"
                        : alert.severity === "warning"
                          ? "mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                          : "mt-0.5 h-4 w-4 shrink-0 text-blue-500"
                    }
                  />
                  <span className="text-muted-foreground">{alert.message}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-sm">Agent Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {deployedAgents.length === 0 ? (
              <EmptyCardState message="No agents yet — agents are created as part of an automation." />
            ) : (
              deployedAgents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <AgentIcon type={agent.type} className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Last active {new Date(agent.lastActive).toLocaleTimeString("en-US", { timeZone: "UTC" })}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={agent.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-sm">AI Activity</CardTitle>
          </CardHeader>
          <CardContent className="mt-1.5 space-y-6">
            {!hasContent ? (
              <EmptyCardState message="No activity yet." />
            ) : (
              activity.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <span className="size-2 shrink-0 rounded-full bg-[#D70000]" aria-hidden="true" />
                  <div className="flex flex-1 items-center justify-between">
                    <span>
                      <span className="font-medium">{item.agentName}</span>{" "}
                      <span className="text-muted-foreground">{item.action}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
