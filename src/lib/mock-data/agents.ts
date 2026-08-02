import { delay } from "@/lib/mock-data/delay";
import type { Agent, AgentType } from "@/lib/mock-data/types";

const AGENT_DEFS: { type: AgentType; name: string; description: string }[] = [
  { type: "sales", name: "Sales Agent", description: "Qualifies leads, drafts proposals, and updates the CRM pipeline." },
  { type: "customer-service", name: "Customer Service Agent", description: "Resolves support tickets and escalates complex cases." },
  { type: "hr", name: "HR Agent", description: "Answers policy questions and manages employee onboarding tasks." },
  { type: "recruitment", name: "Recruitment Agent", description: "Screens resumes and schedules candidate interviews." },
  { type: "procurement", name: "Procurement Agent", description: "Processes purchase requests and vendor approvals." },
  { type: "finance", name: "Finance Agent", description: "Reconciles invoices and flags budget anomalies." },
  { type: "compliance", name: "Compliance Agent", description: "Monitors policy adherence and prepares audit evidence." },
  { type: "operations", name: "Operations Agent", description: "Coordinates logistics tasks and inventory alerts." },
  { type: "executive-assistant", name: "Executive Assistant", description: "Manages calendars, briefings, and correspondence." },
  { type: "knowledge-assistant", name: "Knowledge Assistant", description: "Answers internal questions from the knowledge base." },
  { type: "it-helpdesk", name: "IT Helpdesk Agent", description: "Triages IT tickets and resets access credentials." },
];

const STATUSES: Agent["status"][] = ["active", "active", "active", "idle", "error"];

function buildPerformance(seed: number) {
  return Array.from({ length: 7 }).map((_, i) => ({
    label: `Day ${i + 1}`,
    value: Math.round(60 + ((seed + i) * 7) % 40),
  }));
}

const AGENTS: Agent[] = AGENT_DEFS.map((def, i) => ({
  id: def.type,
  name: def.name,
  type: def.type,
  status: STATUSES[i % STATUSES.length],
  description: def.description,
  lastActive: new Date(Date.now() - i * 1000 * 60 * 17).toISOString(),
  tasksCompleted: 120 + i * 37,
  successRate: 90 + (i % 8),
  avgLatencyMs: 800 + i * 45,
  systemPrompt: `You are the ${def.name} for NexxaByte's client organization. ${def.description} Always follow the organization's business rules and escalate to a human when confidence is low.`,
  toolPermissions: [
    { tool: "CRM", enabled: i % 2 === 0 },
    { tool: "ERP", enabled: i % 3 === 0 },
    { tool: "Email", enabled: true },
    { tool: "Calendar", enabled: i % 2 === 1 },
    { tool: "Document Management", enabled: i % 4 !== 0 },
  ],
  shortTermMemory: [
    { key: "Current session", value: "Discussing Q3 renewal terms with Acme Corp." },
    { key: "Open task", value: "Awaiting approval on discount threshold." },
  ],
  longTermMemory: [
    { key: "Customer history", value: "12 prior interactions across 3 accounts." },
    { key: "Business preferences", value: "Prefers concise summaries over long reports." },
    { key: "Organization knowledge", value: "Aware of NexxaByte's standard SLA terms." },
  ],
  performance: buildPerformance(i),
}));

export async function getAgents(): Promise<Agent[]> {
  return delay(AGENTS);
}

export async function getAgentById(id: string): Promise<Agent | undefined> {
  return delay(AGENTS.find((a) => a.id === id));
}
