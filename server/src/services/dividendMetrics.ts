import type { YahooPricePoint } from "./yahooFinanceClient.js";

export type DividendPayment = { date: Date; amount: number };

export type DividendMetricsResult = {
  dividendYield: number | null;
  dividendYieldGrowthYoY: number | null;
  quarterlyDividendYield: (fiscalDateEnding: string) => number | null;
};

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function normalizeDividendYield(yahooYield: number | null): number | null {
  if (yahooYield === null || !Number.isFinite(yahooYield) || yahooYield <= 0) {
    return null;
  }
  if (yahooYield < 1) return yahooYield;
  return yahooYield / 100;
}

function sumDividendsBetween(
  dividends: DividendPayment[],
  startExclusive: Date,
  endInclusive: Date
): number {
  return dividends
    .filter((d) => d.date > startExclusive && d.date <= endInclusive)
    .reduce((sum, d) => sum + d.amount, 0);
}

function priceOnOrBefore(
  prices: YahooPricePoint[],
  fiscalDateEnding: string
): number | null {
  let best: number | null = null;
  for (const p of prices) {
    if (p.date <= fiscalDateEnding) {
      best = p.close;
    } else {
      break;
    }
  }
  return best;
}

export function computeDividendMetrics(
  dividends: DividendPayment[],
  prices: YahooPricePoint[],
  currentPrice: number | null,
  summaryYield: number | null
): DividendMetricsResult {
  const noOp = () => null;

  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const twoYearsAgo = new Date(now);
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  const ttmCurrent = sumDividendsBetween(dividends, oneYearAgo, now);
  const ttmPrior = sumDividendsBetween(dividends, twoYearsAgo, oneYearAgo);
  const yieldFromSummary = normalizeDividendYield(summaryYield);

  const hasDividends =
    ttmCurrent > 0 || ttmPrior > 0 || yieldFromSummary !== null;

  if (!hasDividends) {
    return {
      dividendYield: null,
      dividendYieldGrowthYoY: null,
      quarterlyDividendYield: noOp,
    };
  }

  const dividendYield =
    yieldFromSummary ??
    (currentPrice !== null && currentPrice > 0 && ttmCurrent > 0
      ? ttmCurrent / currentPrice
      : null);

  const pricePrior =
    priceOnOrBefore(prices, toDateKey(oneYearAgo)) ?? currentPrice;
  const yieldNow =
    currentPrice !== null && currentPrice > 0 && ttmCurrent > 0
      ? ttmCurrent / currentPrice
      : dividendYield;
  const yieldPrior =
    pricePrior !== null && pricePrior > 0 && ttmPrior > 0
      ? ttmPrior / pricePrior
      : null;

  let dividendYieldGrowthYoY: number | null = null;
  if (yieldNow !== null && yieldPrior !== null && yieldPrior > 0) {
    dividendYieldGrowthYoY = yieldNow / yieldPrior - 1;
  } else if (ttmPrior > 0 && ttmCurrent > 0) {
    dividendYieldGrowthYoY = ttmCurrent / ttmPrior - 1;
  }

  const quarterlyDividendYield = (fiscalDateEnding: string): number | null => {
    const end = new Date(`${fiscalDateEnding}T23:59:59.000Z`);
    const start = new Date(end);
    start.setUTCFullYear(start.getUTCFullYear() - 1);
    const ttm = sumDividendsBetween(dividends, start, end);
    const price = priceOnOrBefore(prices, fiscalDateEnding);
    if (price === null || price <= 0 || ttm <= 0) return null;
    return ttm / price;
  };

  return {
    dividendYield,
    dividendYieldGrowthYoY,
    quarterlyDividendYield,
  };
}
