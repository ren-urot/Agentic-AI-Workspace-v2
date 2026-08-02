import { delay } from "@/lib/mock-data/delay";
import type { AuditLogEntry, OrgUser, UserRole, UserStatus } from "@/lib/mock-data/types";

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
