import { Bot, BookOpen, LayoutDashboard, Plug, ShieldCheck, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Agent Console", href: "/agents", icon: Bot },
  { label: "Knowledge Base", href: "/knowledge", icon: BookOpen },
  { label: "Workflow Builder", href: "/workflows", icon: Workflow },
  { label: "Integration Center", href: "/integrations", icon: Plug },
  { label: "Administration", href: "/admin", icon: ShieldCheck },
];
