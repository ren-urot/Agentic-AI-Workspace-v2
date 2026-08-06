import type { SupabaseClient } from "@supabase/supabase-js";

export async function logAudit(
  supabase: SupabaseClient,
  params: { orgId: string; actorName: string; action: string; resource: string },
) {
  await supabase.from("audit_logs").insert({
    org_id: params.orgId,
    actor_name: params.actorName,
    action: params.action,
    resource: params.resource,
  });
}
