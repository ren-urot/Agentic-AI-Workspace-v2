"use client";

import { StatusBadge } from "@/components/shared/status-badge";
import { useAppStore } from "@/lib/store/app-store";
import type { AgentStatus } from "@/lib/mock-data/types";

export function AgentStatusBadge({ agentId, fallback }: { agentId: string; fallback: AgentStatus }) {
  const { agentOverrides } = useAppStore();
  return <StatusBadge status={agentOverrides[agentId]?.status ?? fallback} />;
}
