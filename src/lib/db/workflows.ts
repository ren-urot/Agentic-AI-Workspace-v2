import { createClient } from "@/lib/supabase/server";
import type { WorkflowStatus, WorkflowSummary } from "@/lib/mock-data/types";

export async function getWorkflows(orgId: string): Promise<WorkflowSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workflows")
    .select("id, name, status, last_run, success_rate, workflow_agents(agent_key)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status as WorkflowStatus,
    lastRun: row.last_run ?? "",
    successRate: row.success_rate,
    agentIds: (row.workflow_agents ?? []).map((wa: { agent_key: string }) => wa.agent_key),
  }));
}
