"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/db/profile";
import { logAudit } from "@/lib/db/audit";
import type { WorkflowStatus, WorkflowTriggerType } from "@/lib/mock-data/types";

function zeroPerformance() {
  return Array.from({ length: 7 }).map((_, i) => ({ label: `Day ${i + 1}`, value: 0 }));
}

export async function createWorkflow(params: {
  name: string;
  status: WorkflowStatus;
  triggerType: WorkflowTriggerType;
  agentIds: string[];
}) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { data: workflow, error } = await supabase
    .from("workflows")
    .insert({
      org_id: profile.orgId,
      name: params.name,
      status: params.status,
      trigger_type: params.triggerType,
      success_rate: 0,
      last_run: null,
    })
    .select("id")
    .single();
  if (error || !workflow) throw new Error(error?.message ?? "Failed to create workflow");

  if (params.agentIds.length > 0) {
    const { error: linkError } = await supabase
      .from("workflow_agents")
      .insert(params.agentIds.map((agentKey) => ({ workflow_id: workflow.id, agent_key: agentKey })));
    if (linkError) throw new Error(linkError.message);

    // Atomic upsert: only agents not already deployed get fresh (zeroed) stats.
    // ignoreDuplicates leaves an existing (org_id, agent_key) row untouched
    // rather than overwriting it, and makes this race-safe against a
    // concurrent createWorkflow call deploying the same agent.
    const { error: deployError } = await supabase.from("agent_deployments").upsert(
      params.agentIds.map((agentKey) => ({
        org_id: profile.orgId,
        agent_key: agentKey,
        status: "idle",
        tasks_completed: 0,
        success_rate: 0,
        avg_latency_ms: 0,
        last_active: new Date().toISOString(),
        short_term_memory: [],
        long_term_memory: [],
        performance: zeroPerformance(),
      })),
      { onConflict: "org_id,agent_key", ignoreDuplicates: true },
    );
    if (deployError) throw new Error(deployError.message);
  }

  await logAudit(supabase, { orgId: profile.orgId, actorName: profile.name, action: "Created workflow", resource: params.name });

  revalidatePath("/workflows");
  revalidatePath("/agents");
  revalidatePath("/dashboard");
}

export async function runWorkflow(id: string, name: string, agentKeys: string[]) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const nowIso = new Date().toISOString();
  const successRate = Math.min(100, 88 + Math.floor(Math.random() * 12));

  const { error } = await supabase
    .from("workflows")
    .update({ last_run: nowIso, success_rate: successRate })
    .eq("id", id)
    .eq("org_id", profile.orgId);
  if (error) throw new Error(error.message);

  for (const agentKey of agentKeys) {
    const { data: deployment } = await supabase
      .from("agent_deployments")
      .select("tasks_completed")
      .eq("org_id", profile.orgId)
      .eq("agent_key", agentKey)
      .single();
    if (!deployment) continue;

    await supabase
      .from("agent_deployments")
      .update({
        status: "active",
        tasks_completed: deployment.tasks_completed + 1,
        last_active: nowIso,
      })
      .eq("org_id", profile.orgId)
      .eq("agent_key", agentKey);
  }

  await logAudit(supabase, { orgId: profile.orgId, actorName: profile.name, action: "Ran automation", resource: name });

  revalidatePath("/workflows");
  revalidatePath("/agents");
  revalidatePath("/dashboard");
}

export async function updateWorkflowStatus(id: string, status: WorkflowStatus, name: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase.from("workflows").update({ status }).eq("id", id).eq("org_id", profile.orgId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    orgId: profile.orgId,
    actorName: profile.name,
    action: `Changed workflow status to ${status}`,
    resource: name,
  });
  revalidatePath("/workflows");
}
