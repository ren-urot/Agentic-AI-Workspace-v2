import { PageHeader } from "@/components/shared/page-header";
import { IntegrationsWorkspace } from "./integrations-workspace";
import { WebhookList } from "./webhook-list";
import { getCurrentProfile } from "@/lib/db/profile";
import { getOrgIntegrations, getOrgWebhooks } from "@/lib/db/integrations";

export default async function IntegrationsPage() {
  const profile = await getCurrentProfile();
  const [integrations, webhooks] = profile
    ? await Promise.all([getOrgIntegrations(profile.orgId), getOrgWebhooks(profile.orgId)])
    : [[], []];

  return (
    <div className="space-y-8">
      <PageHeader title="Integration Center" description="Manage connections to your enterprise systems." />
      <IntegrationsWorkspace integrations={integrations} />
      <WebhookList initialWebhooks={webhooks} />
    </div>
  );
}
