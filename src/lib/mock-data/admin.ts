import { delay } from "@/lib/mock-data/delay";
import type { AuditLogEntry, OrgUser, UserRole, UserStatus, Permission, RolePermissions, AgentCostEntry, ChartPoint } from "@/lib/mock-data/types";

const ROLES: UserRole[] = ["Admin", "Manager", "Operator", "Viewer"];
const USER_STATUSES: UserStatus[] = ["active", "active", "invited", "disabled"];

const USERS: OrgUser[] = [
  "Jordan Lee", "Priya Patel", "Marcus Chen", "Sofia Ramirez", "Aisha Khan",
  "Tom Becker", "Nina Volkov", "Diego Alvarez",
].map((name, i) => ({
  id: String(i + 1),
  name,
  email: `${name.toLowerCase().replace(" ", ".")}@client.com`,
  role: ROLES[i % ROLES.length],
  status: USER_STATUSES[i % USER_STATUSES.length],
}));

const ACTIONS = ["Signed in", "Updated agent prompt", "Approved document", "Changed role", "Disabled user", "Connected integration"];

const AUDIT_LOGS: AuditLogEntry[] = Array.from({ length: 10 }).map((_, i) => ({
  id: String(i + 1),
  actor: USERS[i % USERS.length].name,
  action: ACTIONS[i % ACTIONS.length],
  resource: i % 2 === 0 ? "Sales Agent" : "Knowledge Base",
  timestamp: new Date(Date.now() - i * 2700000).toISOString(),
}));

export async function getUsers(): Promise<OrgUser[]> {
  return delay(USERS);
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  return delay(AUDIT_LOGS);
}

const PERMISSIONS: Permission[] = [
  { key: "manage_agents", label: "Manage AI Agents" },
  { key: "manage_workflows", label: "Manage Workflows" },
  { key: "manage_integrations", label: "Manage Integrations" },
  { key: "manage_users", label: "Manage Users" },
  { key: "view_audit_logs", label: "View Audit Logs" },
  { key: "manage_knowledge_base", label: "Manage Knowledge Base" },
];

const ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: "Admin",
    permissions: {
      manage_agents: true,
      manage_workflows: true,
      manage_integrations: true,
      manage_users: true,
      view_audit_logs: true,
      manage_knowledge_base: true,
    },
  },
  {
    role: "Manager",
    permissions: {
      manage_agents: true,
      manage_workflows: true,
      manage_integrations: true,
      manage_users: false,
      view_audit_logs: true,
      manage_knowledge_base: true,
    },
  },
  {
    role: "Operator",
    permissions: {
      manage_agents: true,
      manage_workflows: true,
      manage_integrations: false,
      manage_users: false,
      view_audit_logs: false,
      manage_knowledge_base: true,
    },
  },
  {
    role: "Viewer",
    permissions: {
      manage_agents: false,
      manage_workflows: false,
      manage_integrations: false,
      manage_users: false,
      view_audit_logs: true,
      manage_knowledge_base: false,
    },
  },
];

export async function getPermissions(): Promise<Permission[]> {
  return delay(PERMISSIONS);
}

export async function getRolePermissions(): Promise<RolePermissions[]> {
  return delay(ROLE_PERMISSIONS);
}

const USAGE_SERIES: ChartPoint[] = [
  { label: "Mon", value: 420 },
  { label: "Tue", value: 512 },
  { label: "Wed", value: 489 },
  { label: "Thu", value: 601 },
  { label: "Fri", value: 578 },
  { label: "Sat", value: 210 },
  { label: "Sun", value: 190 },
];

const AGENT_COSTS: AgentCostEntry[] = [
  { agentName: "Sales Agent", cost: 42.5 },
  { agentName: "Customer Service Agent", cost: 38.2 },
  { agentName: "HR Agent", cost: 12.1 },
  { agentName: "Compliance Agent", cost: 9.8 },
  { agentName: "Finance Agent", cost: 15.6 },
];

export async function getUsageSeries(): Promise<ChartPoint[]> {
  return delay(USAGE_SERIES);
}

export async function getAgentCosts(): Promise<AgentCostEntry[]> {
  return delay(AGENT_COSTS);
}
