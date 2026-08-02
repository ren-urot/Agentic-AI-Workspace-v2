import { getWorkflows } from "@/lib/mock-data/workflows";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkflowCanvas } from "./workflow-canvas";

export default async function WorkflowsPage() {
  const workflows = await getWorkflows();

  return (
    <div className="space-y-6">
      <PageHeader title="Workflow Builder" description="Design and automate multi-step business processes." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {workflows.map((wf) => (
          <Card key={wf.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">{wf.name}</CardTitle>
              <StatusBadge status={wf.status} />
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Success rate: {wf.successRate}% · Last run {new Date(wf.lastRun).toLocaleString()}
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium">Canvas</h2>
        <WorkflowCanvas />
      </div>
    </div>
  );
}
