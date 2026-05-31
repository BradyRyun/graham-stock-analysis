import type { MetricsPeriod } from "@stock-analyzer/shared";
import type { MutableRefObject } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchStockMetrics } from "@/lib/stocks";

export function useStockMetrics(
  symbol: string | null,
  period: MetricsPeriod,
  forceRefreshRef?: MutableRefObject<boolean>
) {
  return useQuery({
    queryKey: ["stocks", symbol, "metrics", period],
    queryFn: () =>
      fetchStockMetrics(
        symbol!,
        period,
        forceRefreshRef?.current ?? false
      ),
    enabled: Boolean(symbol),
    staleTime: 5 * 60 * 1000,
  });
}
