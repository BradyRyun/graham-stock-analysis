import {
  METRIC_KEYS,
  METRIC_LABELS,
  shouldShowMetric,
  type MetricKey,
  type MetricPoint,
} from "@stock-analyzer/shared";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMetricValue } from "@/lib/formatMetric";

type MetricHistoryChartProps = {
  history: MetricPoint[];
  current: MetricPoint | null;
};

function historyMetricKeys(
  history: MetricPoint[],
  current: MetricPoint | null
): MetricKey[] {
  const sample = current ?? history[history.length - 1];
  if (!sample) return [...METRIC_KEYS];
  return METRIC_KEYS.filter((key) => {
    if (key === "dividendYieldGrowthYoY") return false;
    if (!shouldShowMetric(key, sample)) return false;
    return history.some((p) => p[key] !== null);
  });
}

export function MetricHistoryChart({
  history,
  current,
}: MetricHistoryChartProps) {
  const chartKeys = historyMetricKeys(history, current);
  const [selected, setSelected] = useState<MetricKey>(
    chartKeys[0] ?? "pe"
  );

  const chartData = useMemo(
    () =>
      history.map((point) => ({
        date: point.fiscalDateEnding,
        value: point[selected],
      })),
    [history, selected]
  );

  const chartConfig = useMemo(
    () =>
      ({
        value: {
          label: METRIC_LABELS[selected],
          color: "hsl(var(--chart-1))",
        },
      }) satisfies ChartConfig,
    [selected]
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle>Historical metrics</CardTitle>
          <CardDescription>
            Quarterly values for the selected period
          </CardDescription>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="metric-select">Metric</Label>
          <Select
            value={selected}
            onValueChange={(value) => setSelected(value as MetricKey)}
          >
            <SelectTrigger id="metric-select" className="w-[min(100%,280px)]">
              <SelectValue placeholder="Select a metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {chartKeys.map((key) => (
                  <SelectItem key={key} value={key}>
                    {METRIC_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>No history available</EmptyTitle>
              <EmptyDescription>
                Try another symbol or a longer time range.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ChartContainer config={chartConfig} className="h-80 w-full">
            <LineChart
              data={chartData}
              margin={{ left: 12, right: 12, top: 12, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(d) => String(d).slice(0, 7)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v) =>
                  formatMetricValue(selected, v as number)
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => `Quarter ending ${label}`}
                    formatter={(value) =>
                      formatMetricValue(selected, value as number | null)
                    }
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--color-value)" }}
                connectNulls={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
