import {
  Bot,
  Briefcase,
  Calculator,
  Headset,
  Laptop,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserSearch,
  Users,
} from "lucide-react";
import type { AgentType } from "@/lib/mock-data/types";

const ICONS: Record<AgentType, typeof Bot> = {
  sales: Briefcase,
  "customer-service": Headset,
  hr: Users,
  recruitment: UserSearch,
  procurement: ShoppingCart,
  finance: Calculator,
  compliance: ShieldCheck,
  operations: Truck,
  "executive-assistant": ScrollText,
  "knowledge-assistant": Bot,
  "it-helpdesk": Laptop,
};

export function AgentIcon({ type, className }: { type: AgentType; className?: string }) {
  const Icon = ICONS[type];
  return <Icon className={className} />;
}
