import { createClient } from "@/lib/supabase/server";
import { getIntegrations as getIntegrationCatalog } from "@/lib/mock-data/integrations";
import type { Integration, Webhook } from "@/lib/mock-data/types";

export async function getOrgIntegrations(orgId: string): Promise<Integration[]> {
  const supabase = await createClient();
  const [catalog, { data: rows }] = await Promise.all([
    getIntegrationCatalog(),
    supabase.from("integrations").select("integration_key, status").eq("org_id", orgId),
  ]);

  const statusByKey = new Map((rows ?? []).map((r) => [r.integration_key, r.status]));
  return catalog.map((integration) => ({
    ...integration,
    status: (statusByKey.get(integration.id) ?? "disconnected") as Integration["status"],
  }));
}

export async function getOrgWebhooks(orgId: string): Promise<Webhook[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("webhooks")
    .select("id, url, event, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({ id: row.id, url: row.url, event: row.event, createdAt: row.created_at }));
}
