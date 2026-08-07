import { createClient } from "@/lib/supabase/server";
import { getPermissions as getPermissionCatalog } from "@/lib/mock-data/admin";
import type { AuditLogEntry, OrgUser, RolePermissions } from "@/lib/mock-data/types";

const ROLES = ["Admin", "Manager", "Operator", "Viewer"] as const;

export async function getOrgUsers(orgId: string): Promise<OrgUser[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, status")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as OrgUser[];
}

export async function getOrgRolePermissions(orgId: string): Promise<RolePermissions[]> {
  const supabase = await createClient();
  const [catalog, { data: rows }] = await Promise.all([
    getPermissionCatalog(),
    supabase.from("role_permissions").select("role, permission_key, allowed").eq("org_id", orgId),
  ]);

  const byRole = new Map<string, Record<string, boolean>>(ROLES.map((r) => [r, {}]));
  for (const row of rows ?? []) {
    const perms = byRole.get(row.role);
    if (perms) perms[row.permission_key] = row.allowed;
  }

  return ROLES.map((role) => ({
    role,
    permissions: Object.fromEntries(catalog.map((p) => [p.key, byRole.get(role)?.[p.key] ?? false])),
  }));
}

export async function getOrgSecurityPolicies(orgId: string): Promise<Record<string, boolean>> {
  const supabase = await createClient();
  const { data } = await supabase.from("security_policies").select("policy_key, enabled").eq("org_id", orgId);
  const defaults: Record<string, boolean> = { mfa: true, sso: false, "session-timeout": true, ip: false };
  for (const row of data ?? []) defaults[row.policy_key] = row.enabled;
  return defaults;
}

export async function getOrgSettings(orgId: string): Promise<{ orgName: string; timezone: string; locale: string }> {
  const supabase = await createClient();
  const { data } = await supabase.from("organizations").select("name, timezone, locale").eq("id", orgId).single();
  return { orgName: data?.name ?? "", timezone: data?.timezone ?? "America/New_York", locale: data?.locale ?? "en-US" };
}

export async function getOrgAuditLogs(orgId: string): Promise<AuditLogEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, actor_name, action, resource, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    actor: row.actor_name,
    action: row.action,
    resource: row.resource,
    timestamp: row.created_at,
  }));
}
