import type { MetricsPeriod } from "@stock-analyzer/shared";
import { useQuery } from "@tanstack/react-query";
import { fetchStockMetrics } from "@/lib/stocks";

export function useStockMetrics(
  symbol: string | null,
  period: MetricsPeriod
) {
  return useQuery({
    queryKey: ["stocks", symbol, "metrics", period],
    queryFn: () => fetchStockMetrics(symbol!, period),
    enabled: Boolean(symbol),
    staleTime: 5 * 60 * 1000,
  });
}
