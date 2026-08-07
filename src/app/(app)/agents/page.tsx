import { PageHeader } from "@/components/shared/page-header";
import { AgentsWorkspace } from "./agents-workspace";
import { getCurrentProfile } from "@/lib/db/profile";
import { getDeployedAgents } from "@/lib/db/agents";

export default async function AgentsPage() {
  const profile = await getCurrentProfile();
  const agents = profile ? await getDeployedAgents(profile.orgId) : [];

  return (
    <div>
      <PageHeader title="AI Agent Console" description="Manage, configure, and monitor every agent in your workspace." />
      <AgentsWorkspace agents={agents} />
    </div>
  );
}
