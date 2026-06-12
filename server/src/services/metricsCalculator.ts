import type { MetricsPeriod, BuyModelResult } from "@stock-analyzer/shared";
import type {
  MetricPoint,
  MetricValues,
  StockMetricsResponse,
} from "@stock-analyzer/shared";
import { computeDividendMetrics } from "./dividendMetrics.js";
import type {
  YahooFinanceClient,
  YahooPricePoint,
  YahooQuarterlyRow,
} from "./yahooFinanceClient.js";
import type { PolygonClient } from "./polygonClient.js";

type SymbolQuoteExtras = {
  trailingPe: number | null;
  trailingEps: number | null;
  priceToBook: number | null;
  bookValue: number | null;
  returnOnEquity: number | null;
  dividendYield: number | null;
  regularMarketChangePercent: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  allTimeHigh: number | null;
  sector: string | null;
  industry: string | null;
  companyName: string | null;
};

type SymbolData = {
  quarterlyRows: YahooQuarterlyRow[];
  prices: YahooPricePoint[];
  dividends: { date: Date; amount: number }[];
  quoteExtras: SymbolQuoteExtras;
};

function num(value: number | null | undefined): number | null {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return null;
  }
  return value;
}

function percentChange(current: number, prior: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(prior) || prior === 0) {
    return null;
  }
  return (current - prior) / prior;
}

function periodStartDateKey(period: MetricsPeriod): string {
  const d = new Date();
  const years = period === "1y" ? 1 : 3;
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

function computeDayChangePercent(
  prices: YahooPricePoint[],
  quoteDayChangePercent: number | null | undefined
): number | null {
  const quotePercent = num(quoteDayChangePercent);
  if (quotePercent !== null) {
    return num(quotePercent / 100);
  }
  if (prices.length >= 2) {
    const last = prices[prices.length - 1]!.close;
    const prev = prices[prices.length - 2]!.close;
    return num(percentChange(last, prev));
  }
  return null;
}

function computeFiftyTwoWeekRange(prices: YahooPricePoint[]): {
  high: number | null;
  low: number | null;
} {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const cutoff = oneYearAgo.toISOString().slice(0, 10);
  const window = prices.filter((p) => p.date >= cutoff);
  if (window.length === 0) {
    return { high: null, low: null };
  }

  let high = window[0]!.close;
  let low = window[0]!.close;
  for (const point of window) {
    if (point.close > high) high = point.close;
    if (point.close < low) low = point.close;
  }

  return { high, low };
}

function computePeriodChangePercent(
  prices: YahooPricePoint[],
  period: MetricsPeriod,
  currentPrice: number | null
): number | null {
  const price = num(currentPrice);
  if (price === null) return null;
  const startPrice = priceOnOrBefore(prices, periodStartDateKey(period));
  if (startPrice === null) return null;
  return num(percentChange(price, startPrice));
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

function dailyReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1];
    if (prev === 0) continue;
    returns.push((prices[i] - prev) / prev);
  }
  return returns;
}

function computeSharpe(
  prices: YahooPricePoint[],
  asOfDate: string,
  riskFreeRate: number
): number | null {
  const idx = prices.findIndex((p) => p.date > asOfDate);
  const sliceEnd = idx === -1 ? prices.length : idx;
  const window = prices.slice(Math.max(0, sliceEnd - 253), sliceEnd);
  if (window.length < 30) return null;

  const closes = window.map((p) => p.close);
  const returns = dailyReturns(closes);
  if (returns.length < 2) return null;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((a, r) => a + (r - mean) ** 2, 0) / (returns.length - 1);
  const std = Math.sqrt(variance);
  if (std === 0) return null;

  const annualizedReturn = mean * 252;
  const annualizedStd = std * Math.sqrt(252);
  return (annualizedReturn - riskFreeRate) / annualizedStd;
}

function effectiveTaxRate(income: Record<string, number | null>): number {
  const tax = num(income.taxProvision);
  const beforeTax = num(income.pretaxIncome);
  if (tax === null || beforeTax === null || beforeTax === 0) {
    return 0.21;
  }
  const rate = tax / beforeTax;
  if (rate < 0 || rate > 1) return 0.21;
  return rate;
}

function isMissingSymbolData(data: SymbolData): boolean {
  const quote = data.quoteExtras;
  const essentialQuoteValuesMissing =
    quote.trailingPe === null &&
    quote.trailingEps === null &&
    quote.priceToBook === null &&
    quote.bookValue === null &&
    quote.returnOnEquity === null;

  return (
    data.quarterlyRows.length === 0 ||
    data.prices.length === 0 ||
    data.dividends.length === 0 ||
    data.quoteExtras.companyName === null ||
    data.quoteExtras.sector === null ||
    data.quoteExtras.industry === null ||
    essentialQuoteValuesMissing
  );
}

function mergeSymbolData(primary: SymbolData, fallback: SymbolData): SymbolData {
  const quoteExtras: SymbolQuoteExtras = {
    trailingPe:
      primary.quoteExtras.trailingPe ?? fallback.quoteExtras.trailingPe,
    trailingEps:
      primary.quoteExtras.trailingEps ?? fallback.quoteExtras.trailingEps,
    priceToBook:
      primary.quoteExtras.priceToBook ?? fallback.quoteExtras.priceToBook,
    bookValue:
      primary.quoteExtras.bookValue ?? fallback.quoteExtras.bookValue,
    returnOnEquity:
      primary.quoteExtras.returnOnEquity ?? fallback.quoteExtras.returnOnEquity,
    dividendYield:
      primary.quoteExtras.dividendYield ?? fallback.quoteExtras.dividendYield,
    regularMarketChangePercent:
      primary.quoteExtras.regularMarketChangePercent ??
      fallback.quoteExtras.regularMarketChangePercent,
    fiftyTwoWeekHigh:
      primary.quoteExtras.fiftyTwoWeekHigh ??
      fallback.quoteExtras.fiftyTwoWeekHigh,
    fiftyTwoWeekLow:
      primary.quoteExtras.fiftyTwoWeekLow ??
      fallback.quoteExtras.fiftyTwoWeekLow,
    allTimeHigh:
      primary.quoteExtras.allTimeHigh ?? fallback.quoteExtras.allTimeHigh,
    sector: primary.quoteExtras.sector ?? fallback.quoteExtras.sector,
    industry: primary.quoteExtras.industry ?? fallback.quoteExtras.industry,
    companyName:
      primary.quoteExtras.companyName ?? fallback.quoteExtras.companyName,
  };

  return {
    quarterlyRows:
      primary.quarterlyRows.length > 0
        ? primary.quarterlyRows
        : fallback.quarterlyRows,
    prices:
      primary.prices.length > 0 ? primary.prices : fallback.prices,
    dividends:
      primary.dividends.length > 0 ? primary.dividends : fallback.dividends,
    quoteExtras,
  };
}

function scorePe(value: number): number {
  if (value <= 0) return 0;
  if (value <= 12) return 1;
  if (value <= 15) return 0.9;
  if (value <= 20) return 0.7;
  if (value <= 30) return 0.4;
  if (value <= 50) return 0.15;
  return 0;
}

function scoreCashFlowYield(value: number): number {
  if (value < 0) return 0;
  if (value >= 0.08) return 1;
  if (value >= 0.06) return 0.9;
  if (value >= 0.04) return 0.8;
  if (value >= 0.02) return 0.5;
  return 0.2;
}

function scoreRoic(value: number): number {
  if (value < 0) return 0;
  if (value >= 0.15) return 1;
  if (value >= 0.12) return 0.9;
  if (value >= 0.08) return 0.7;
  if (value >= 0.05) return 0.4;
  return 0.15;
}

function scoreRoe(value: number): number {
  if (value < 0) return 0;
  if (value >= 0.18) return 1;
  if (value >= 0.12) return 0.85;
  if (value >= 0.08) return 0.6;
  if (value >= 0.03) return 0.3;
  return 0.1;
}

function scorePriceToBook(value: number, financial: boolean): number {
  if (value < 0) return 0;
  if (financial) {
    if (value < 1.0) return 1;
    if (value < 1.5) return 0.9;
    if (value < 2.5) return 0.75;
    if (value < 4.0) return 0.4;
    return 0.1;
  }
  if (value < 1.0) return 1;
  if (value < 1.5) return 0.85;
  if (value < 2.5) return 0.6;
  if (value < 4.0) return 0.3;
  return 0.1;
}

function scoreDebtToAssets(value: number): number {
  if (value < 0) return 0;
  if (value < 0.35) return 1;
  if (value < 0.5) return 0.75;
  if (value < 0.7) return 0.45;
  return 0.15;
}

function scoreDividendGrowth(value: number): number {
  if (value < 0) return 0;
  if (value <= 0.12) return 1;
  if (value <= 0.2) return 0.7;
  if (value <= 0.35) return 0.35;
  return 0.15;
}

function scoreSharpe(value: number): number {
  if (value < 0) return 0.1;
  if (value >= 1.0) return 1;
  if (value >= 0.75) return 0.85;
  if (value >= 0.5) return 0.65;
  if (value >= 0.25) return 0.4;
  return 0.2;
}

function isFinancialCompany(sector: string | null, industry: string | null): boolean {
  const financialTerms = [
    "bank",
    "insurance",
    "financial",
    "fund",
    "asset management",
    "capital markets",
    "brokerage",
    "reinsurance",
    "capital",
  ];

  const normalized = [sector, industry]
    .filter(Boolean)
    .map((value) => value!.toLowerCase());

  return normalized.some((value) =>
    financialTerms.some((term) => value.includes(term))
  );
}

function gradeBuyScore(score: number): "don't buy" | "cautious buy" | "buy" | "strong buy" {
  if (score >= 80) return "strong buy";
  if (score >= 60) return "buy";
  if (score >= 45) return "cautious buy";
  return "don't buy";
}

function computeBuyModelResult(
  current: MetricValues,
  price: number | null,
  quoteExtras: {
    sector: string | null;
    industry: string | null;
  }
): BuyModelResult {
  const isFinancial = isFinancialCompany(quoteExtras.sector, quoteExtras.industry);
  const model = isFinancial ? "financial" : "regular";

  const netNet =
    price !== null &&
    current.grahamNcav !== null &&
    current.grahamNcav > price;
  if (netNet) {
    return {
      model,
      score: 100,
      grade: "strong buy",
      note: "Graham Net-Net opportunity overrides the normal model.",
    };
  }

  const weights: Record<string, number> = isFinancial
    ? {
        priceToBook: 0.3,
        roe: 0.20,
        debtToAssets: 0.20,
        pe: 0.15,
        dividendYieldGrowthYoY: 0.05,
        sharpe: 0.05,
      }
    : {
        cashFlowYield: 0.25,
        roic: 0.15,
        pe: 0.20,
        priceToBook: 0.15,
        debtToAssets: 0.15,
        dividendYieldGrowthYoY: 0.05,
        sharpe: 0.05,
      };

  let weightedScore = 0;
  let availableWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const value = current[key as keyof MetricValues];
    if (value === null) continue;

    let metricScore = 0;
    switch (key) {
      case "pe":
        metricScore = scorePe(value);
        break;
      case "cashFlowYield":
        metricScore = scoreCashFlowYield(value);
        break;
      case "roic":
        metricScore = scoreRoic(value);
        break;
      case "roe":
        metricScore = scoreRoe(value);
        break;
      case "priceToBook":
        metricScore = scorePriceToBook(value, isFinancial);
        break;
      case "debtToAssets":
        metricScore = scoreDebtToAssets(value);
        break;
      case "dividendYieldGrowthYoY":
        metricScore = scoreDividendGrowth(value);
        break;
      case "sharpe":
        metricScore = scoreSharpe(value);
        break;
    }

    weightedScore += metricScore * weight;
    availableWeight += weight;
  }

  const score = availableWeight > 0 ? (weightedScore / availableWeight) * 100 : 50;
  return {
    model,
    score: Math.round(score),
    grade: gradeBuyScore(score),
    note: isFinancial
      ? "Financial company model selected based on sector or industry classification."
      : "Regular company model selected based on sector and industry data.",
  };
}

function computeMetricsForQuarter(
  row: YahooQuarterlyRow,
  quarterEndPrice: number | null,
  prices: YahooPricePoint[],
  riskFreeRate: number
): MetricValues {
  const { income, balance, cashFlow } = row;

  const shares =
    num(balance.ordinarySharesNumber) ?? num(income.dilutedAverageShares);
  const equity = num(balance.stockholdersEquity);
  const totalAssets = num(balance.totalAssets);
  const totalLiabilities = num(balance.totalLiabilitiesNetMinorityInterest);
  const currentAssets = num(balance.currentAssets);
  const currentLiabilities = num(balance.currentLiabilities);
  const cash =
    num(balance.cashAndCashEquivalents) ?? num(balance.cashFinancial);
  const netIncome = num(income.netIncome);
  const operatingIncome = num(income.operatingIncome);
  const operatingCashflow = num(cashFlow.operatingCashFlow);

  const eps =
    netIncome !== null && shares !== null && shares !== 0
      ? netIncome / shares
      : null;

  const bookValuePerShare =
    equity !== null && shares !== null && shares !== 0
      ? equity / shares
      : null;

  const grahamNcav =
    currentAssets !== null &&
    totalLiabilities !== null &&
    shares !== null &&
    shares !== 0
      ? (currentAssets - totalLiabilities) / shares
      : null;

  const pe =
    quarterEndPrice !== null && eps !== null && eps !== 0
      ? quarterEndPrice / eps
      : null;

  const priceToBook =
    quarterEndPrice !== null &&
    bookValuePerShare !== null &&
    bookValuePerShare !== 0
      ? quarterEndPrice / bookValuePerShare
      : null;

  const roe =
    netIncome !== null && equity !== null && equity !== 0
      ? netIncome / equity
      : null;

  const taxRate = effectiveTaxRate(income);
  const nopat =
    operatingIncome !== null ? operatingIncome * (1 - taxRate) : null;
  const investedCapital =
    totalAssets !== null && currentLiabilities !== null && cash !== null
      ? totalAssets - currentLiabilities - cash
      : null;
  const roic =
    nopat !== null && investedCapital !== null && investedCapital !== 0
      ? nopat / investedCapital
      : null;

  const debtToAssets =
    totalLiabilities !== null && totalAssets !== null && totalAssets !== 0
      ? totalLiabilities / totalAssets
      : null;

  const marketCap =
    quarterEndPrice !== null && shares !== null
      ? quarterEndPrice * shares
      : null;
  const cashFlowYield =
    operatingCashflow !== null && marketCap !== null && marketCap !== 0
      ? operatingCashflow / marketCap
      : null;

  const sharpe = computeSharpe(prices, row.fiscalDateEnding, riskFreeRate);

  return {
    pe,
    sharpe,
    cashFlowYield,
    bookValuePerShare,
    priceToBook,
    grahamNcav,
    roe,
    roic,
    debtToAssets,
    dividendYield: null,
    dividendYieldGrowthYoY: null,
  };
}

export async function calculateStockMetrics(
  client: YahooFinanceClient,
  symbol: string,
  period: MetricsPeriod,
  riskFreeRate: number,
  forceRefresh = false,
  fallbackClient?: PolygonClient
): Promise<StockMetricsResponse> {
  const s = symbol.toUpperCase();
  const yahooResult = await client.getSymbolData(s, period, forceRefresh);
  let symbolData: SymbolData = yahooResult;

  if (fallbackClient && isMissingSymbolData(yahooResult)) {
    const polygonResult = await fallbackClient.getSymbolData(
      s,
      period,
      forceRefresh
    );
    symbolData = mergeSymbolData(yahooResult, polygonResult);
  }

  const { quarterlyRows, prices, quoteExtras, dividends } = symbolData;

  const currentPrice =
    prices.length > 0 ? prices[prices.length - 1].close : null;

  const dividendMetrics = computeDividendMetrics(
    dividends,
    prices,
    currentPrice,
    quoteExtras.dividendYield
  );

  const history: MetricPoint[] = quarterlyRows.map((row) => {
    const quarterEndPrice = priceOnOrBefore(prices, row.fiscalDateEnding);
    const metrics = computeMetricsForQuarter(
      row,
      quarterEndPrice,
      prices,
      riskFreeRate
    );
    return {
      fiscalDateEnding: row.fiscalDateEnding,
      ...metrics,
      dividendYield: dividendMetrics.quarterlyDividendYield(
        row.fiscalDateEnding
      ),
      dividendYieldGrowthYoY: null,
    };
  });

  let current: MetricValues = {
    pe: null,
    sharpe: null,
    cashFlowYield: null,
    bookValuePerShare: null,
    priceToBook: null,
    grahamNcav: null,
    roe: null,
    roic: null,
    debtToAssets: null,
    dividendYield: null,
    dividendYieldGrowthYoY: null,
  };

  if (quarterlyRows.length > 0) {
    const lastRow = quarterlyRows[quarterlyRows.length - 1];
    current = computeMetricsForQuarter(
      lastRow,
      currentPrice ?? priceOnOrBefore(prices, lastRow.fiscalDateEnding),
      prices,
      riskFreeRate
    );
  }

  if (quoteExtras.trailingPe !== null) {
    current = { ...current, pe: quoteExtras.trailingPe };
  } else if (
    quoteExtras.trailingEps !== null &&
    currentPrice !== null &&
    currentPrice > 0
  ) {
    current = {
      ...current,
      pe: num(currentPrice / quoteExtras.trailingEps),
    };
  }
  if (quoteExtras.returnOnEquity !== null) {
    current = { ...current, roe: quoteExtras.returnOnEquity };
  }
  if (quoteExtras.bookValue !== null) {
    current = { ...current, bookValuePerShare: quoteExtras.bookValue };
  }
  if (quoteExtras.priceToBook !== null) {
    current = { ...current, priceToBook: quoteExtras.priceToBook };
  }

  if (currentPrice !== null && history.length > 0) {
    const asOf = quarterlyRows[quarterlyRows.length - 1]?.fiscalDateEnding;
    if (asOf) {
      current = {
        ...current,
        sharpe: computeSharpe(prices, asOf, riskFreeRate),
      };
    }
  }

  current = {
    ...current,
    dividendYield: dividendMetrics.dividendYield,
    dividendYieldGrowthYoY: dividendMetrics.dividendYieldGrowthYoY,
  };

  const computedFiftyTwoWeekRange = computeFiftyTwoWeekRange(prices);

  let allTimeHigh = quoteExtras.allTimeHigh;
  let allTimeHighSource: "polygon" | "history" | null =
    allTimeHigh !== null ? "history" : null;

  if (fallbackClient) {
    const polygonAllTimeHigh = await fallbackClient.getAllTimeHigh(
      s,
      forceRefresh
    );
    if (polygonAllTimeHigh !== null) {
      allTimeHigh = polygonAllTimeHigh;
      allTimeHighSource = "polygon";
    }
  }

  return {
    symbol: s,
    companyName: quoteExtras.companyName ?? null,
    asOf: new Date().toISOString(),
    price: currentPrice,
    priceChangePercentDay: computeDayChangePercent(
      prices,
      quoteExtras.regularMarketChangePercent
    ),
    priceChangePercentPeriod: computePeriodChangePercent(
      prices,
      period,
      currentPrice
    ),
    fiftyTwoWeekHigh:
      quoteExtras.fiftyTwoWeekHigh ?? computedFiftyTwoWeekRange.high,
    fiftyTwoWeekLow:
      quoteExtras.fiftyTwoWeekLow ?? computedFiftyTwoWeekRange.low,
    allTimeHigh,
    allTimeHighSource,
    current,
    history,
    buyModel: computeBuyModelResult(current, currentPrice, {
      sector: quoteExtras.sector,
      industry: quoteExtras.industry,
    }),
  };
}
