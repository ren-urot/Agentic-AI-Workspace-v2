import { notFound } from "next/navigation";
import { getAgentById } from "@/lib/mock-data/agents";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { AgentDetailTabs } from "./agent-detail-tabs";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await getAgentById(id);

  if (!agent) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={agent.name}
        description={agent.description}
        actions={<StatusBadge status={agent.status} />}
      />
      <AgentDetailTabs agent={agent} />
    </div>
  );
}
