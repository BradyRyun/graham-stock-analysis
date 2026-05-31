import { z } from "zod";

const nullableNumber = z.preprocess(
  (value) =>
    typeof value === "number" && Number.isFinite(value) ? value : null,
  z.number().nullable()
);

export const MetricValues = z.object({
  pe: nullableNumber,
  sharpe: nullableNumber,
  cashFlowYield: nullableNumber,
  bookValuePerShare: nullableNumber,
  priceToBook: nullableNumber,
  grahamNcav: nullableNumber,
  roe: nullableNumber,
  roic: nullableNumber,
  debtToAssets: nullableNumber,
  dividendYield: nullableNumber,
  dividendYieldGrowthYoY: nullableNumber,
});
export type MetricValues = z.infer<typeof MetricValues>;

export const MetricPoint = MetricValues.extend({
  fiscalDateEnding: z.string(),
});
export type MetricPoint = z.infer<typeof MetricPoint>;

export const StockMetricsResponse = z.object({
  symbol: z.string(),
  asOf: z.string(),
  price: nullableNumber,
  priceChangePercentDay: nullableNumber,
  priceChangePercentPeriod: nullableNumber,
  current: MetricValues,
  history: z.array(MetricPoint),
});
export type StockMetricsResponse = z.infer<typeof StockMetricsResponse>;

export const METRIC_KEYS = [
  "pe",
  "sharpe",
  "cashFlowYield",
  "bookValuePerShare",
  "priceToBook",
  "grahamNcav",
  "roe",
  "roic",
  "debtToAssets",
  "dividendYield",
  "dividendYieldGrowthYoY",
] as const;

export type MetricKey = (typeof METRIC_KEYS)[number];

export const METRIC_LABELS: Record<MetricKey, string> = {
  pe: "P/E",
  sharpe: "Sharpe Ratio",
  cashFlowYield: "Cash Flow Yield",
  bookValuePerShare: "Book Value / Share",
  priceToBook: "Price to Book",
  grahamNcav: "Graham NCAV",
  roe: "Return on Equity",
  roic: "Return on Invested Capital",
  debtToAssets: "Debt to Assets",
  dividendYield: "Dividend Yield",
  dividendYieldGrowthYoY: "Dividend Yield Growth (YoY)",
};

const DIVIDEND_METRIC_KEYS = new Set<MetricKey>([
  "dividendYield",
  "dividendYieldGrowthYoY",
]);

export function shouldShowMetric(
  key: MetricKey,
  current: MetricValues
): boolean {
  if (DIVIDEND_METRIC_KEYS.has(key)) {
    return current.dividendYield !== null && current.dividendYield > 0;
  }
  return true;
}
