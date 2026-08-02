import { delay } from "@/lib/mock-data/delay";
import type { Integration } from "@/lib/mock-data/types";

const INTEGRATIONS: Integration[] = [
  { id: "1", name: "Salesforce", category: "CRM", status: "connected", description: "Sync leads, opportunities, and accounts." },
  { id: "2", name: "SAP", category: "ERP", status: "connected", description: "Inventory, procurement, and finance data." },
  { id: "3", name: "Slack", category: "Communication", status: "connected", description: "Agent notifications and approvals." },
  { id: "4", name: "Microsoft Teams", category: "Communication", status: "disconnected", description: "Chat-based agent interactions." },
  { id: "5", name: "WhatsApp Business", category: "Communication", status: "error", description: "Customer messaging channel." },
  { id: "6", name: "Okta", category: "Identity", status: "connected", description: "Single sign-on and user provisioning." },
  { id: "7", name: "NetSuite", category: "ERP", status: "disconnected", description: "Financial and order management." },
  { id: "8", name: "HubSpot", category: "CRM", status: "disconnected", description: "Marketing and sales pipeline sync." },
  { id: "9", name: "Custom REST API", category: "Custom API", status: "connected", description: "Internal service integration." },
  { id: "10", name: "Zendesk", category: "Communication", status: "connected", description: "Helpdesk ticket sync." },
];

export async function getIntegrations(): Promise<Integration[]> {
  return delay(INTEGRATIONS);
}
