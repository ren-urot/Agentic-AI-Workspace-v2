import { AlertTriangle, Bot, CheckCircle2, PiggyBank, Zap } from "lucide-react";
import { getAgents } from "@/lib/mock-data/agents";
import { getActivityFeed, getAlerts, getKpis, getRevenueSeries, getWorkflowHealthSeries } from "@/lib/mock-data/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { AgentIcon } from "@/components/shared/agent-icon";
import type { IconChipVariant } from "@/components/shared/icon-chip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart, WorkflowHealthChart } from "./charts";
import { WelcomeToast } from "./welcome-toast";
import type { LucideIcon } from "lucide-react";

const KPI_PRESENTATION: Record<string, { icon: LucideIcon; variant: IconChipVariant }> = {
  "active-agents": { icon: Bot, variant: "primary" },
  "tasks-automated": { icon: CheckCircle2, variant: "success" },
  "avg-response": { icon: Zap, variant: "info" },
  "cost-saved": { icon: PiggyBank, variant: "warning" },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const [{ welcome }, kpis, activity, alerts, revenue, workflowHealth, agents] = await Promise.all([
    searchParams,
    getKpis(),
    getActivityFeed(),
    getAlerts(),
    getRevenueSeries(),
    getWorkflowHealthSeries(),
    getAgents(),
  ]);

  return (
    <div className="space-y-6">
      <WelcomeToast show={welcome === "1"} />
      <PageHeader title="Executive Dashboard" description="Real-time overview of your organization's AI operations." />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const presentation = KPI_PRESENTATION[kpi.id] ?? { icon: Bot, variant: "primary" as const };
          return <StatCard key={kpi.id} metric={kpi} icon={presentation.icon} variant={presentation.variant} />;
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[437fr_437fr_284fr]">
        <RevenueChart data={revenue} />
        <WorkflowHealthChart data={workflowHealth} />
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-sm">Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
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
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-sm">Agent Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agents.map((agent) => (
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
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-sm">AI Activity</CardTitle>
          </CardHeader>
          <CardContent className="mt-1.5 space-y-6">
            {activity.map((item) => (
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
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
