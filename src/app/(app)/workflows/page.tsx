import { getWorkflows } from "@/lib/mock-data/workflows";
import { getAgents } from "@/lib/mock-data/agents";
import { isNewOrg } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { WorkflowsWorkspace } from "./workflows-workspace";

export default async function WorkflowsPage() {
  const [workflows, agents, newOrg] = await Promise.all([getWorkflows(), getAgents(), isNewOrg()]);

  return (
    <div className="space-y-6">
      <PageHeader title="Workflow Builder" description="Design and automate multi-step business processes." />
      <WorkflowsWorkspace initialWorkflows={newOrg ? [] : workflows} initialAgents={agents} />
    </div>
  );
}
