import { PageHeader } from "@/components/shared/page-header";
import { WorkflowsWorkspace } from "./workflows-workspace";

export default function WorkflowsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Workflow Builder" description="Design and automate multi-step business processes." />
      <WorkflowsWorkspace />
    </div>
  );
}
