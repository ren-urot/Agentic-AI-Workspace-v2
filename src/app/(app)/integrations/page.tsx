import { PageHeader } from "@/components/shared/page-header";
import { IntegrationsWorkspace } from "./integrations-workspace";
import { WebhookList } from "./webhook-list";

export default function IntegrationsPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Integration Center" description="Manage connections to your enterprise systems." />
      <IntegrationsWorkspace />
      <WebhookList />
    </div>
  );
}
