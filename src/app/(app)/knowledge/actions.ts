"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/db/profile";
import { logAudit } from "@/lib/db/audit";
import type { DocumentSourceType, DocumentStatus } from "@/lib/mock-data/types";

export async function uploadDocument(params: { name: string; sourceType: DocumentSourceType; keywords: string[] }) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase.from("documents").insert({
    org_id: profile.orgId,
    name: params.name,
    source_type: params.sourceType,
    version: 1,
    status: "pending",
    keywords: params.keywords,
  });
  if (error) throw new Error(error.message);

  await logAudit(supabase, { orgId: profile.orgId, actorName: profile.name, action: "Uploaded document", resource: params.name });
  revalidatePath("/knowledge");
}

export async function setDocumentStatus(id: string, status: DocumentStatus, name: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase.from("documents").update({ status }).eq("id", id).eq("org_id", profile.orgId);
  if (error) throw new Error(error.message);

  const action = status === "approved" ? "Approved document" : status === "rejected" ? "Rejected document" : "Updated document status";
  await logAudit(supabase, { orgId: profile.orgId, actorName: profile.name, action, resource: name });
  revalidatePath("/knowledge");
}
