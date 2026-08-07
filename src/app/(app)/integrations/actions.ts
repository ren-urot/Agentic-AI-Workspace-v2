"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/db/profile";
import { logAudit } from "@/lib/db/audit";
import type { IntegrationStatus } from "@/lib/mock-data/types";

export async function setIntegrationStatus(integrationKey: string, status: IntegrationStatus, integrationName: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase
    .from("integrations")
    .upsert({ org_id: profile.orgId, integration_key: integrationKey, status }, { onConflict: "org_id,integration_key" });
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    orgId: profile.orgId,
    actorName: profile.name,
    action: status === "connected" ? "Connected integration" : "Disconnected integration",
    resource: integrationName,
  });
  revalidatePath("/integrations");
}

export async function addWebhook(url: string, event: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase.from("webhooks").insert({ org_id: profile.orgId, url, event });
  if (error) throw new Error(error.message);

  await logAudit(supabase, { orgId: profile.orgId, actorName: profile.name, action: "Added webhook", resource: url });
  revalidatePath("/integrations");
}

export async function removeWebhook(id: string, url: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase.from("webhooks").delete().eq("id", id).eq("org_id", profile.orgId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, { orgId: profile.orgId, actorName: profile.name, action: "Removed webhook", resource: url });
  revalidatePath("/integrations");
}
