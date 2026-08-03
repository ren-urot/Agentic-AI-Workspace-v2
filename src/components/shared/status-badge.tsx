import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  AgentStatus,
  DocumentStatus,
  WorkflowStatus,
  IntegrationStatus,
  UserStatus,
} from "@/lib/mock-data/types";

export type Status = AgentStatus | DocumentStatus | WorkflowStatus | IntegrationStatus | UserStatus;

const STATUS_STYLES: Record<Status, string> = {
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  connected: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  idle: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  draft: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  paused: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  invited: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  error: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  disconnected: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  rejected: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  disabled: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant="outline" className={cn("capitalize", STATUS_STYLES[status] ?? "")}>
      {status}
    </Badge>
  );
}
