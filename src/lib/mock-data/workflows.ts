import { delay } from "@/lib/mock-data/delay";
import type { WorkflowStatus, WorkflowSummary } from "@/lib/mock-data/types";

const STATUSES: WorkflowStatus[] = ["active", "active", "draft", "paused"];
const AGENT_IDS: string[][] = [["sales"], ["finance"], ["hr"], ["customer-service"]];

const WORKFLOWS: WorkflowSummary[] = [
  "New Lead Qualification", "Invoice Approval Routing", "Employee Offboarding", "Support Ticket Escalation",
].map((name, i) => ({
  id: String(i + 1),
  name,
  status: STATUSES[i % STATUSES.length],
  lastRun: new Date(Date.now() - i * 3600000).toISOString(),
  successRate: 92 + i,
  agentIds: AGENT_IDS[i % AGENT_IDS.length],
}));

export async function getWorkflows(): Promise<WorkflowSummary[]> {
  return delay(WORKFLOWS);
}
