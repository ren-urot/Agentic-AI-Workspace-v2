import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANT_STYLES = {
  primary: "bg-chip-primary text-chip-primary-foreground",
  success: "bg-chip-success text-chip-success-foreground",
  info: "bg-chip-info text-chip-info-foreground",
  warning: "bg-chip-warning text-chip-warning-foreground",
} as const;

export type IconChipVariant = keyof typeof VARIANT_STYLES;

export function IconChip({
  icon: Icon,
  variant,
  className,
}: {
  icon: LucideIcon;
  variant: IconChipVariant;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-[53px] shrink-0 items-center justify-center rounded-full",
        VARIANT_STYLES[variant],
        className,
      )}
    >
      <Icon className="size-5" />
    </div>
  );
}
