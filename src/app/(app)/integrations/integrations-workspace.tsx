"use client";

import { IntegrationCard } from "./integration-card";
import { setIntegrationStatus } from "./actions";
import type { Integration, IntegrationCategory } from "@/lib/mock-data/types";

const CATEGORY_ORDER: IntegrationCategory[] = ["CRM", "ERP", "Communication", "Identity", "Custom API"];

export function IntegrationsWorkspace({ integrations }: { integrations: Integration[] }) {
  return (
    <>
      {CATEGORY_ORDER.map((category) => {
        const items = integrations.filter((i) => i.category === category);
        if (items.length === 0) return null;
        return (
          <div key={category}>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">{category}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onConnect={(id) => setIntegrationStatus(id, "connected", integration.name)}
                  onDisconnect={(id) => setIntegrationStatus(id, "disconnected", integration.name)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
