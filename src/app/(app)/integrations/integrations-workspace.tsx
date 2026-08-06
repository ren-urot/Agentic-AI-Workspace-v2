"use client";

import { IntegrationCard } from "./integration-card";
import { useAppStore } from "@/lib/store/app-store";
import type { IntegrationCategory } from "@/lib/mock-data/types";

const CATEGORY_ORDER: IntegrationCategory[] = ["CRM", "ERP", "Communication", "Identity", "Custom API"];

export function IntegrationsWorkspace() {
  const { integrations, setIntegrationStatus } = useAppStore();

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
                  onConnect={(id) => setIntegrationStatus(id, "connected")}
                  onDisconnect={(id) => setIntegrationStatus(id, "disconnected")}
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
