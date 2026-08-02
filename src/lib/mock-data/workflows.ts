import { delay } from "@/lib/mock-data/delay";
import type { WorkflowStatus, WorkflowSummary } from "@/lib/mock-data/types";

const STATUSES: WorkflowStatus[] = ["active", "active", "draft", "paused"];

const WORKFLOWS: WorkflowSummary[] = [
  "New Lead Qualification", "Invoice Approval Routing", "Employee Offboarding", "Support Ticket Escalation",
].map((name, i) => ({
  id: String(i + 1),
  name,
  status: STATUSES[i % STATUSES.length],
  lastRun: new Date(Date.now() - i * 3600000).toISOString(),
  successRate: 92 + i,
}));

export async function getWorkflows(): Promise<WorkflowSummary[]> {
  return delay(WORKFLOWS);
}
