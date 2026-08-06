import { getIntegrations, getWebhooks } from "@/lib/mock-data/integrations";
import { isNewOrg } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { IntegrationCard } from "./integration-card";
import { WebhookList } from "./webhook-list";
import type { IntegrationCategory } from "@/lib/mock-data/types";

const CATEGORY_ORDER: IntegrationCategory[] = ["CRM", "ERP", "Communication", "Identity", "Custom API"];

export default async function IntegrationsPage() {
  const [rawIntegrations, rawWebhooks, newOrg] = await Promise.all([getIntegrations(), getWebhooks(), isNewOrg()]);
  const integrations = newOrg ? rawIntegrations.map((i) => ({ ...i, status: "disconnected" as const })) : rawIntegrations;
  const webhooks = newOrg ? [] : rawWebhooks;

  return (
    <div className="space-y-8">
      <PageHeader title="Integration Center" description="Manage connections to your enterprise systems." />
      {CATEGORY_ORDER.map((category) => {
        const items = integrations.filter((i) => i.category === category);
        if (items.length === 0) return null;
        return (
          <div key={category}>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">{category}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          </div>
        );
      })}
      <WebhookList initialWebhooks={webhooks} />
    </div>
  );
}
