import { notFound } from "next/navigation";
import { getAgentById } from "@/lib/mock-data/agents";
import { PageHeader } from "@/components/shared/page-header";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AgentDetailTabs } from "./agent-detail-tabs";
import { AgentStatusBadge } from "./agent-status-badge";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await getAgentById(id);

  if (!agent) {
    notFound();
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: "AI Agent Console", href: "/agents" }, { label: agent.name }]} />
      <div className="mt-[30px]">
        <PageHeader
          title={agent.name}
          description={agent.description}
          actions={<AgentStatusBadge agentId={agent.id} fallback={agent.status} />}
        />
        <AgentDetailTabs agent={agent} />
      </div>
    </div>
  );
}
