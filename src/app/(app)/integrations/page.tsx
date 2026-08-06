import { getIntegrations, getWebhooks } from "@/lib/mock-data/integrations";
import { isNewOrg } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { IntegrationsWorkspace } from "./integrations-workspace";
import { WebhookList } from "./webhook-list";

export default async function IntegrationsPage() {
  const [rawIntegrations, rawWebhooks, newOrg] = await Promise.all([getIntegrations(), getWebhooks(), isNewOrg()]);
  const integrations = newOrg ? rawIntegrations.map((i) => ({ ...i, status: "disconnected" as const })) : rawIntegrations;
  const webhooks = newOrg ? [] : rawWebhooks;

  return (
    <div className="space-y-8">
      <PageHeader title="Integration Center" description="Manage connections to your enterprise systems." />
      <IntegrationsWorkspace initialIntegrations={integrations} />
      <WebhookList initialWebhooks={webhooks} />
    </div>
  );
}
