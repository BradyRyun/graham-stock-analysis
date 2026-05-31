import type { MetricKey } from "@stock-analyzer/shared";
import { cn } from "@/lib/utils";
import {
  getMetricRatingTooltip,
  type MetricRatingTooltipTier,
} from "@/lib/metricRatingTooltips";

const TIER_LABEL_CLASS: Record<string, string> = {
  Good: "text-green-600 dark:text-green-400",
  Ok: "text-muted-foreground",
  Bad: "text-destructive",
};

type MetricRatingTooltipContentProps = {
  metricKey: MetricKey;
  activeLabel: string;
};

function tierLabelClass(label: string): string {
  return TIER_LABEL_CLASS[label] ?? "text-amber-600 dark:text-amber-400";
}

function TooltipTier({
  tier,
  isActive,
}: {
  tier: MetricRatingTooltipTier;
  isActive: boolean;
}) {
  return (
    <li
      className={cn(
        "flex flex-col gap-0.5",
        isActive && "rounded-sm bg-muted/60 px-2 py-1.5 -mx-2"
      )}
    >
      <p className="text-xs leading-snug">
        <span className={cn("font-semibold", tierLabelClass(tier.label))}>
          {tier.label}
        </span>
        <span className="text-foreground">: {tier.range}</span>
      </p>
      <p className="text-muted-foreground text-xs leading-relaxed">
        {tier.description}
      </p>
    </li>
  );
}

export function MetricRatingTooltipContent({
  metricKey,
  activeLabel,
}: MetricRatingTooltipContentProps) {
  const tooltip = getMetricRatingTooltip(metricKey);
  if (!tooltip) return null;

  const normalizedActive =
    activeLabel === "N/A" ? null : activeLabel;

  return (
    <div className="flex max-w-xs flex-col gap-2 p-3 text-left">
      <p className="text-sm font-semibold leading-snug">{tooltip.title}</p>
      {tooltip.note ? (
        <p className="text-muted-foreground text-xs leading-relaxed">
          {tooltip.note}
        </p>
      ) : null}
      <ul className="flex flex-col gap-2.5">
        {tooltip.tiers.map((tier) => (
          <TooltipTier
            key={tier.label}
            tier={tier}
            isActive={
              normalizedActive !== null && tier.label === normalizedActive
            }
          />
        ))}
      </ul>
    </div>
  );
}
