import { PageHeader } from "@/components/shared/page-header";
import { WorkflowsWorkspace } from "./workflows-workspace";
import { getAgents } from "@/lib/mock-data/agents";
import { getCurrentProfile } from "@/lib/db/profile";
import { getWorkflows } from "@/lib/db/workflows";

export default async function WorkflowsPage() {
  const [agents, profile] = await Promise.all([getAgents(), getCurrentProfile()]);
  const workflows = profile ? await getWorkflows(profile.orgId) : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Workflow Builder" description="Design and automate multi-step business processes." />
      <WorkflowsWorkspace initialWorkflows={workflows} agents={agents} />
    </div>
  );
}
