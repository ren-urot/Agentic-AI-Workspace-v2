import Link from "next/link";
import { getAgents } from "@/lib/mock-data/agents";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { AgentIcon } from "@/components/shared/agent-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <div>
      <PageHeader title="AI Agent Console" description="Manage, configure, and monitor every agent in your workspace." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Link key={agent.id} href={`/agents/${agent.id}`}>
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <AgentIcon type={agent.type} className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{agent.name}</CardTitle>
                </div>
                <StatusBadge status={agent.status} />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{agent.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{agent.tasksCompleted} tasks completed</span>
                  <span>{agent.successRate}% success</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
