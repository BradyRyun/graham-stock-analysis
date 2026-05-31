import {
  MetricsPeriod,
  StockMetricsResponse,
  StockSearchResponse,
} from "@stock-analyzer/shared";
import { api } from "./api";

export async function searchStocks(query: string) {
  return api.get("/api/stocks/search", StockSearchResponse, {
    params: { q: query },
  });
}

export async function fetchStockMetrics(
  symbol: string,
  period: MetricsPeriod,
  forceRefresh = false
) {
  return api.get(
    `/api/stocks/${encodeURIComponent(symbol)}/metrics`,
    StockMetricsResponse,
    { params: { period, forceRefresh } }
  );
}
