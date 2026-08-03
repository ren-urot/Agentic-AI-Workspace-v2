import { AlertTriangle } from "lucide-react";
import { getAgents } from "@/lib/mock-data/agents";
import { getActivityFeed, getAlerts, getKpis, getRevenueSeries, getWorkflowHealthSeries } from "@/lib/mock-data/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { AgentIcon } from "@/components/shared/agent-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart, WorkflowHealthChart } from "./charts";

export default async function DashboardPage() {
  const [kpis, activity, alerts, revenue, workflowHealth, agents] = await Promise.all([
    getKpis(),
    getActivityFeed(),
    getAlerts(),
    getRevenueSeries(),
    getWorkflowHealthSeries(),
    getAgents(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Executive Dashboard" description="Real-time overview of your organization's AI operations." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard key={kpi.id} metric={kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueChart data={revenue} />
        <WorkflowHealthChart data={workflowHealth} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
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
                      Last active {new Date(agent.lastActive).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <StatusBadge status={agent.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">AI Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activity.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span>
                <span className="font-medium">{item.agentName}</span>{" "}
                <span className="text-muted-foreground">{item.action}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(item.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
