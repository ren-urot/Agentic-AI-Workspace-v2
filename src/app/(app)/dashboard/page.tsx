import { getActivityFeed, getAlerts, getKpis, getRevenueSeries, getWorkflowHealthSeries } from "@/lib/mock-data/dashboard";
import { DashboardContent } from "./dashboard-content";
import { getCurrentProfile } from "@/lib/db/profile";
import { getDeployedAgents } from "@/lib/db/agents";
import { getWorkflows } from "@/lib/db/workflows";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const [{ welcome }, kpis, activity, alerts, revenue, workflowHealth, profile] = await Promise.all([
    searchParams,
    getKpis(),
    getActivityFeed(),
    getAlerts(),
    getRevenueSeries(),
    getWorkflowHealthSeries(),
    getCurrentProfile(),
  ]);

  const [workflows, deployedAgents] = profile
    ? await Promise.all([getWorkflows(profile.orgId), getDeployedAgents(profile.orgId)])
    : [[], []];

  return (
    <DashboardContent
      welcome={welcome === "1"}
      kpis={kpis}
      activity={activity}
      alerts={alerts}
      revenue={revenue}
      workflowHealth={workflowHealth}
      workflowCount={workflows.length}
      deployedAgents={deployedAgents}
    />
  );
}
