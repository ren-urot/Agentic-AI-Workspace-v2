"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/db/profile";
import { logAudit } from "@/lib/db/audit";
import type { UserRole, UserStatus } from "@/lib/mock-data/types";

export async function inviteUser(name: string, email: string, role: UserRole) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { signup_type: "invited", org_id: profile.orgId, role, name },
  });
  if (error) throw new Error(error.message);

  const supabase = await createClient();
  await logAudit(supabase, { orgId: profile.orgId, actorName: profile.name, action: "Invited user", resource: email });
  revalidatePath("/admin");
}

export async function setUserRole(userId: string, role: UserRole, userName: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId).eq("org_id", profile.orgId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, { orgId: profile.orgId, actorName: profile.name, action: `Changed role to ${role}`, resource: userName });
  revalidatePath("/admin");
}

export async function setUserStatus(userId: string, status: UserStatus, userName: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").update({ status }).eq("id", userId).eq("org_id", profile.orgId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    orgId: profile.orgId,
    actorName: profile.name,
    action: `Changed user status to ${status}`,
    resource: userName,
  });
  revalidatePath("/admin");
}

export async function toggleRolePermission(role: UserRole, permissionKey: string, nextAllowed: boolean) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase
    .from("role_permissions")
    .upsert(
      { org_id: profile.orgId, role, permission_key: permissionKey, allowed: nextAllowed },
      { onConflict: "org_id,role,permission_key" },
    );
  if (error) throw new Error(error.message);

  await logAudit(supabase, { orgId: profile.orgId, actorName: profile.name, action: "Updated role permissions", resource: role });
  revalidatePath("/admin");
}

export async function setSecurityPolicy(policyKey: string, enabled: boolean) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase
    .from("security_policies")
    .upsert({ org_id: profile.orgId, policy_key: policyKey, enabled }, { onConflict: "org_id,policy_key" });
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    orgId: profile.orgId,
    actorName: profile.name,
    action: enabled ? "Enabled security policy" : "Disabled security policy",
    resource: policyKey,
  });
  revalidatePath("/admin");
}

export async function updateOrgSettings(orgName: string, timezone: string, locale: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase.from("organizations").update({ name: orgName, timezone, locale }).eq("id", profile.orgId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, { orgId: profile.orgId, actorName: profile.name, action: "Updated organization settings", resource: orgName });
  revalidatePath("/admin");
}
