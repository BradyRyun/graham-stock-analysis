import type { MetricKey } from "@stock-analyzer/shared";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MetricRatingTooltipContent } from "@/components/MetricRatingTooltipContent";
import {
  getMetricRatingDisplay,
  type MetricRatingContext,
} from "@/lib/metricRating";
import { getMetricRatingTooltip } from "@/lib/metricRatingTooltips";
import { cn } from "@/lib/utils";

type MetricRatingBadgeProps = {
  metricKey: MetricKey;
  context: MetricRatingContext;
  className?: string;
};

export function MetricRatingBadge({
  metricKey,
  context,
  className,
}: MetricRatingBadgeProps) {
  const { label, variant } = getMetricRatingDisplay(metricKey, context);
  const tooltip = getMetricRatingTooltip(metricKey);

  const badge = (
    <Badge variant={variant} className={cn(className)}>
      {label}
    </Badge>
  );

  if (!tooltip) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex cursor-help rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className
          )}
        >
          <Badge variant={variant}>{label}</Badge>
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="left"
        align="start"
        className="max-w-xs border bg-popover p-0 text-popover-foreground shadow-md"
      >
        <MetricRatingTooltipContent
          metricKey={metricKey}
          activeLabel={label}
        />
      </TooltipContent>
    </Tooltip>
  );
}
