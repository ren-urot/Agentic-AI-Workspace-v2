import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AgentDetailTabs } from "./agent-detail-tabs";
import { getCurrentProfile } from "@/lib/db/profile";
import { getAgentDeployment } from "@/lib/db/agents";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const agent = profile ? await getAgentDeployment(profile.orgId, id) : null;

  if (!agent) {
    notFound();
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: "AI Agent Console", href: "/agents" }, { label: agent.name }]} />
      <div className="mt-[30px]">
        <PageHeader title={agent.name} description={agent.description} actions={<StatusBadge status={agent.status} />} />
        <AgentDetailTabs agent={agent} />
      </div>
    </div>
  );
}
