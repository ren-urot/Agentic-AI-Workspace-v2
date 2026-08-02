import { delay } from "@/lib/mock-data/delay";
import type { ActivityItem, AlertItem, ChartPoint, KpiMetric } from "@/lib/mock-data/types";

const KPIS: KpiMetric[] = [
  { id: "active-agents", label: "Active Agents", value: "9", delta: 12, trend: "up" },
  { id: "tasks-automated", label: "Tasks Automated (30d)", value: "4,812", delta: 8, trend: "up" },
  { id: "avg-response", label: "Avg Response Time", value: "1.4s", delta: 6, trend: "down" },
  { id: "cost-saved", label: "Est. Cost Saved (30d)", value: "$62,400", delta: 15, trend: "up" },
];

const ACTIVITY: ActivityItem[] = [
  { id: "1", agentName: "Sales Agent", action: "Drafted proposal for Acme Corp renewal", timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: "2", agentName: "IT Helpdesk Agent", action: "Reset access credentials for 3 users", timestamp: new Date(Date.now() - 22 * 60000).toISOString() },
  { id: "3", agentName: "Compliance Agent", action: "Flagged a policy exception for review", timestamp: new Date(Date.now() - 48 * 60000).toISOString() },
  { id: "4", agentName: "Finance Agent", action: "Reconciled 214 invoices", timestamp: new Date(Date.now() - 75 * 60000).toISOString() },
  { id: "5", agentName: "Customer Service Agent", action: "Resolved 18 support tickets", timestamp: new Date(Date.now() - 120 * 60000).toISOString() },
  { id: "6", agentName: "Knowledge Assistant", action: "Indexed 5 new SharePoint documents", timestamp: new Date(Date.now() - 160 * 60000).toISOString() },
];

const ALERTS: AlertItem[] = [
  { id: "1", severity: "critical", message: "Procurement Agent failed to authenticate with ERP connector", timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
  { id: "2", severity: "warning", message: "Knowledge Base has 4 documents pending approval", timestamp: new Date(Date.now() - 90 * 60000).toISOString() },
  { id: "3", severity: "info", message: "Weekly AI usage report is ready", timestamp: new Date(Date.now() - 200 * 60000).toISOString() },
];

const REVENUE_SERIES: ChartPoint[] = [
  { label: "Wk 1", value: 42000 },
  { label: "Wk 2", value: 48500 },
  { label: "Wk 3", value: 51200 },
  { label: "Wk 4", value: 62400 },
];

const WORKFLOW_HEALTH_SERIES: ChartPoint[] = [
  { label: "Mon", value: 96 },
  { label: "Tue", value: 94 },
  { label: "Wed", value: 98 },
  { label: "Thu", value: 91 },
  { label: "Fri", value: 97 },
  { label: "Sat", value: 99 },
  { label: "Sun", value: 95 },
];

export async function getKpis(): Promise<KpiMetric[]> {
  return delay(KPIS);
}

export async function getActivityFeed(): Promise<ActivityItem[]> {
  return delay(ACTIVITY);
}

export async function getAlerts(): Promise<AlertItem[]> {
  return delay(ALERTS);
}

export async function getRevenueSeries(): Promise<ChartPoint[]> {
  return delay(REVENUE_SERIES);
}

export async function getWorkflowHealthSeries(): Promise<ChartPoint[]> {
  return delay(WORKFLOW_HEALTH_SERIES);
}
