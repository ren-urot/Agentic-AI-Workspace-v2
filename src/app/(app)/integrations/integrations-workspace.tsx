"use client";

import { useState } from "react";
import { IntegrationCard } from "./integration-card";
import type { Integration, IntegrationCategory } from "@/lib/mock-data/types";

const CATEGORY_ORDER: IntegrationCategory[] = ["CRM", "ERP", "Communication", "Identity", "Custom API"];

export function IntegrationsWorkspace({ initialIntegrations }: { initialIntegrations: Integration[] }) {
  const [integrations, setIntegrations] = useState(initialIntegrations);

  function handleConnect(id: string) {
    setIntegrations((prev) => prev.map((i) => (i.id === id ? { ...i, status: "connected" } : i)));
  }

  function handleDisconnect(id: string) {
    setIntegrations((prev) => prev.map((i) => (i.id === id ? { ...i, status: "disconnected" } : i)));
  }

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
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
