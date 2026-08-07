"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/db/profile";
import type { MemoryEntry, ToolPermission } from "@/lib/mock-data/types";

export async function updateAgentPrompt(agentKey: string, systemPrompt: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase
    .from("agent_deployments")
    .update({ system_prompt: systemPrompt })
    .eq("org_id", profile.orgId)
    .eq("agent_key", agentKey);
  if (error) throw new Error(error.message);
  revalidatePath(`/agents/${agentKey}`);
}

export async function updateAgentTools(agentKey: string, toolPermissions: ToolPermission[]) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase
    .from("agent_deployments")
    .update({ tool_permissions: toolPermissions })
    .eq("org_id", profile.orgId)
    .eq("agent_key", agentKey);
  if (error) throw new Error(error.message);
  revalidatePath(`/agents/${agentKey}`);
}

export async function updateAgentMemory(
  agentKey: string,
  field: "short_term_memory" | "long_term_memory",
  value: MemoryEntry[],
) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase
    .from("agent_deployments")
    .update({ [field]: value })
    .eq("org_id", profile.orgId)
    .eq("agent_key", agentKey);
  if (error) throw new Error(error.message);
  revalidatePath(`/agents/${agentKey}`);
}
