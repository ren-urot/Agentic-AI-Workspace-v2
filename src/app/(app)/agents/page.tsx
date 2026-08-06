import { PageHeader } from "@/components/shared/page-header";
import { AgentsWorkspace } from "./agents-workspace";

export default function AgentsPage() {
  return (
    <div>
      <PageHeader title="AI Agent Console" description="Manage, configure, and monitor every agent in your workspace." />
      <AgentsWorkspace />
    </div>
  );
}
