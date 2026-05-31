import type { MetricKey } from "@stock-analyzer/shared";

export function formatMetricValue(
  key: MetricKey,
  value: number | null
): string {
  if (value === null) return "—";

  switch (key) {
    case "cashFlowYield":
    case "dividendYield":
    case "roe":
    case "roic":
    case "debtToAssets":
      return `${(value * 100).toFixed(2)}%`;
    case "dividendYieldGrowthYoY": {
      const pct = value * 100;
      const sign = pct > 0 ? "+" : "";
      return `${sign}${pct.toFixed(2)}%`;
    }
    case "sharpe":
      return value.toFixed(2);
    case "bookValuePerShare":
    case "grahamNcav":
      return `$${value.toFixed(2)}`;
    default:
      return value.toFixed(2);
  }
}
