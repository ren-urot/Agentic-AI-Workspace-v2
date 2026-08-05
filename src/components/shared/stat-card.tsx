import { ArrowDown, ArrowRight, ArrowUp, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { IconChip, type IconChipVariant } from "@/components/shared/icon-chip";
import type { KpiMetric } from "@/lib/mock-data/types";

const DIVIDER_COLOR: Record<IconChipVariant, string> = {
  primary: "bg-chip-primary",
  success: "bg-chip-success",
  info: "bg-chip-info",
  warning: "bg-chip-warning",
};

export function StatCard({
  metric,
  icon,
  variant,
}: {
  metric: KpiMetric;
  icon: LucideIcon;
  variant: IconChipVariant;
}) {
  const TrendIcon = metric.trend === "up" ? ArrowUp : metric.trend === "down" ? ArrowDown : ArrowRight;
  const trendColor =
    metric.trend === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : metric.trend === "down"
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";

  return (
    <Card className="ring-0">
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <IconChip icon={icon} variant={variant} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-muted-foreground">{metric.label}</p>
            <div className={cn("mt-2 h-px w-full", DIVIDER_COLOR[variant])} />
          </div>
        </div>
        <div className="text-2xl font-semibold">{metric.value}</div>
        <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
          <TrendIcon className="h-3 w-3" />
          <span>{Math.abs(metric.delta)}%</span>
          <span className="font-normal text-muted-foreground">vs last 7 days</span>
        </div>
      </CardContent>
    </Card>
  );
}
