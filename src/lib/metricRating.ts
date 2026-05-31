import type { MetricKey, MetricValues } from "@stock-analyzer/shared";

export type MetricRating = "good" | "ok" | "bad" | "unknown";

export type MetricRatingContext = {
  price: number | null;
  current: MetricValues;
};

function isNegative(value: number | null): boolean {
  return value !== null && value < 0;
}

function isNull(value: number | null): boolean {
  return value === null || !Number.isFinite(value);
}

function rateDividendYieldGrowthYoY(value: number): MetricRating {
  if (isNegative(value)) return "bad";
  if (value >= 0.05 && value <= 0.12) return "good";
  if (value >= 0.13 && value <= 0.2) return "ok";
  if (value > 0.25) return "bad";
  return "ok";
}

export function rateMetric(
  key: MetricKey,
  ctx: MetricRatingContext
): MetricRating {
  const raw = ctx.current[key];

  if (isNull(raw)) {
    return "unknown";
  }

  const value = raw as number;
  const { price } = ctx;
  const stockPrice =
    price !== null && Number.isFinite(price) ? price : null;

  switch (key) {
    case "pe": {
      if (isNegative(value)) return "bad";
      if (value >= 10 && value <= 15) return "good";
      if (value >= 16 && value <= 25) return "ok";
      if (value > 25) return "bad";
      return "ok";
    }
    case "cashFlowYield": {
      if (isNegative(value)) return "bad";
      if (value > 0.07) return "good";
      if (value >= 0.04 && value <= 0.06) return "ok";
      if (value < 0.03) return "bad";
      return "ok";
    }
    case "bookValuePerShare": {
      if (isNegative(value)) return "bad";
      if (stockPrice === null || stockPrice <= 0) return "unknown";
      if (value > stockPrice) return "good";
      if (value > 0 && stockPrice / value <= 1.25) return "ok";
      return "bad";
    }
    case "priceToBook": {
      if (isNegative(value)) return "bad";
      if (value < 1.0) return "good";
      if (value >= 1.0 && value <= 3.0) return "ok";
      if (value > 4.0) return "bad";
      return "ok";
    }
    case "grahamNcav": {
      if (isNegative(value) || value === 0) return "bad";
      if (stockPrice === null || stockPrice <= 0) return "unknown";
      if (stockPrice < value) return "good";
      if (stockPrice <= value * 1.5) return "ok";
      return "bad";
    }
    case "roe": {
      if (isNegative(value)) return "bad";
      if (value > 0.15) return "good";
      if (value >= 0.1 && value < 0.15) return "ok";
      if (value < 0.1) return "bad";
      return "unknown";
    }
    case "roic": {
      if (isNegative(value)) return "bad";
      if (value > 0.12) return "good";
      if (value >= 0.08 && value <= 0.11) return "ok";
      if (value < 0.07) return "bad";
      return "unknown";
    }
    case "debtToAssets": {
      if (isNegative(value)) return "bad";
      if (value < 0.4) return "good";
      if (value >= 0.4 && value <= 0.6) return "ok";
      if (value > 0.7) return "bad";
      return "unknown";
    }
    case "sharpe": {
      if (isNegative(value)) return "bad";
      if (value > 1.0) return "good";
      if (value >= 0.5 && value <= 0.99) return "ok";
      if (value < 0.5) return "bad";
      return "ok";
    }
    case "dividendYieldGrowthYoY":
      return rateDividendYieldGrowthYoY(value);
    default:
      return "unknown";
  }
}

export const METRIC_RATING_LABELS: Record<MetricRating, string> = {
  good: "Good",
  ok: "Ok",
  bad: "Bad",
  unknown: "N/A",
};

export const BVPS_ABOVE_PRICE_LABEL = "Above Price";

export type MetricRatingBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "golden";

export type MetricRatingDisplay = {
  label: string;
  variant: MetricRatingBadgeVariant;
};

const RATING_BADGE_VARIANT: Record<MetricRating, MetricRatingBadgeVariant> = {
  good: "success",
  ok: "secondary",
  bad: "destructive",
  unknown: "outline",
};

export function isBvpsAboveSharePrice(ctx: MetricRatingContext): boolean {
  const bvps = ctx.current.bookValuePerShare;
  const { price } = ctx;
  if (
    bvps === null ||
    !Number.isFinite(bvps) ||
    price === null ||
    !Number.isFinite(price) ||
    price <= 0
  ) {
    return false;
  }
  return bvps > price;
}

export function getMetricRatingDisplay(
  key: MetricKey,
  ctx: MetricRatingContext
): MetricRatingDisplay {
  if (key === "bookValuePerShare" && isBvpsAboveSharePrice(ctx)) {
    return { label: BVPS_ABOVE_PRICE_LABEL, variant: "golden" };
  }

  const rating = rateMetric(key, ctx);
  return {
    label: METRIC_RATING_LABELS[rating],
    variant: RATING_BADGE_VARIANT[rating],
  };
}
