import { createClient } from "@/lib/supabase/server";
import { getAgents as getAgentCatalog } from "@/lib/mock-data/agents";
import type { Agent } from "@/lib/mock-data/types";

interface AgentDeploymentRow {
  agent_key: string;
  status: string;
  tasks_completed: number;
  success_rate: number;
  avg_latency_ms: number;
  last_active: string;
  system_prompt: string | null;
  tool_permissions: Agent["toolPermissions"] | null;
  short_term_memory: Agent["shortTermMemory"];
  long_term_memory: Agent["longTermMemory"];
  performance: Agent["performance"];
}

export async function getDeployedAgents(orgId: string): Promise<Agent[]> {
  const supabase = await createClient();
  const [catalog, { data: deployments }] = await Promise.all([
    getAgentCatalog(),
    supabase.from("agent_deployments").select("*").eq("org_id", orgId),
  ]);

  const byKey = new Map((deployments ?? []).map((d) => [d.agent_key, d as AgentDeploymentRow]));

  return catalog
    .filter((agent) => byKey.has(agent.id))
    .map((agent) => {
      const d = byKey.get(agent.id)!;
      return {
        ...agent,
        status: d.status as Agent["status"],
        tasksCompleted: d.tasks_completed,
        successRate: d.success_rate,
        avgLatencyMs: d.avg_latency_ms,
        lastActive: d.last_active,
        systemPrompt: d.system_prompt ?? agent.systemPrompt,
        toolPermissions: d.tool_permissions ?? agent.toolPermissions,
        shortTermMemory: d.short_term_memory,
        longTermMemory: d.long_term_memory,
        performance: d.performance,
      };
    });
}

export async function getAgentDeployment(orgId: string, agentKey: string): Promise<Agent | null> {
  const agents = await getDeployedAgents(orgId);
  return agents.find((a) => a.id === agentKey) ?? null;
}
