import {
  METRIC_KEYS,
  METRIC_LABELS,
  shouldShowMetric,
  type MetricKey,
  type MetricValues,
} from "@stock-analyzer/shared";
import { MetricRatingBadge } from "@/components/MetricRatingBadge";
import { Card } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MetricRatingContext } from "@/lib/metricRating";
import { formatMetricValue } from "@/lib/formatMetric";

type MetricsGridProps = {
  current: MetricValues;
  price: number | null;
};

const RATING_METRIC_KEYS = new Set<MetricKey>([
  "pe",
  "sharpe",
  "cashFlowYield",
  "bookValuePerShare",
  "priceToBook",
  "grahamNcav",
  "roe",
  "roic",
  "debtToAssets",
  "dividendYieldGrowthYoY",
]);

export function MetricsGrid({ current, price }: MetricsGridProps) {
  const ratingContext: MetricRatingContext = { current, price };
  const visibleKeys = METRIC_KEYS.filter((key) =>
    shouldShowMetric(key, current)
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Metric</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="pr-6 text-right">Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleKeys.map((key) => (
              <TableRow key={key}>
                <TableCell className="pl-6 font-medium">
                  {METRIC_LABELS[key]}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMetricValue(key, current[key])}
                </TableCell>
                <TableCell className="pr-6 text-right">
                  {RATING_METRIC_KEYS.has(key) ? (
                    <MetricRatingBadge
                      metricKey={key}
                      context={ratingContext}
                      className="ml-auto"
                    />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </TooltipProvider>
  );
}
