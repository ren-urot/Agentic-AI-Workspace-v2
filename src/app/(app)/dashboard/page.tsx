import { getActivityFeed, getAlerts, getKpis, getRevenueSeries, getWorkflowHealthSeries } from "@/lib/mock-data/dashboard";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const [{ welcome }, kpis, activity, alerts, revenue, workflowHealth] = await Promise.all([
    searchParams,
    getKpis(),
    getActivityFeed(),
    getAlerts(),
    getRevenueSeries(),
    getWorkflowHealthSeries(),
  ]);

  return (
    <DashboardContent
      welcome={welcome === "1"}
      kpis={kpis}
      activity={activity}
      alerts={alerts}
      revenue={revenue}
      workflowHealth={workflowHealth}
    />
  );
}
