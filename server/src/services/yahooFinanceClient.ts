import type { MetricsPeriod } from "@stock-analyzer/shared";
import YahooFinance from "yahoo-finance2";
import type { CacheService } from "./cache.js";

type FundamentalsRow = Record<string, number | Date | string | undefined> & {
  date: Date;
};

export type YahooQuarterlyRow = {
  fiscalDateEnding: string;
  income: Record<string, number | null>;
  balance: Record<string, number | null>;
  cashFlow: Record<string, number | null>;
};

export type YahooPricePoint = { date: string; close: number };

export type YahooSymbolData = {
  quarterlyRows: YahooQuarterlyRow[];
  prices: YahooPricePoint[];
  quoteExtras: {
    trailingPe: number | null;
    trailingEps: number | null;
    priceToBook: number | null;
    bookValue: number | null;
    returnOnEquity: number | null;
    dividendYield: number | null;
    regularMarketChangePercent: number | null;
    sector: string | null;
    industry: string | null;
    companyName: string | null;
  };
  dividends: { date: Date; amount: number }[];
};

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function rowToNumbers(row: FundamentalsRow): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === "date" || key === "TYPE" || key === "periodType") continue;
    if (typeof value === "number" && Number.isFinite(value)) {
      out[key] = value;
    }
  }
  return out;
}

function periodStartDate(period: MetricsPeriod): Date {
  const d = new Date();
  const years = period === "1y" ? 1 : 3;
  d.setFullYear(d.getFullYear() - years);
  d.setMonth(d.getMonth() - 3);
  return d;
}

export class YahooFinanceClient {
  private yf = new YahooFinance({
    suppressNotices: ["ripHistorical"],
  });

  constructor(private cache: CacheService) {}

  private async cached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlHours?: number,
    forceRefresh = false
  ): Promise<T> {
    if (!forceRefresh) {
      const hit = this.cache.get(key);
      if (hit !== null) return hit as T;
    }

    const data = await fetcher();
    this.cache.set(
      key,
      data,
      ttlHours ?? this.cache.ttlForKey(key)
    );
    return data;
  }

  async searchSymbols(query: string) {
    const q = query.trim();
    return this.cached(`YAHOO:SEARCH:${q.toUpperCase()}`, async () => {
      const result = await this.yf.search(q, { quotesCount: 10, region: "US" });
      return (result.quotes ?? [])
        .filter(
          (item): item is typeof item & { symbol: string } =>
            typeof item.symbol === "string" && item.symbol.length > 0
        )
        .map((item) => ({
          symbol: item.symbol,
          name:
            ("longname" in item && item.longname) ||
            ("shortname" in item && item.shortname) ||
            item.symbol,
          type:
            ("quoteType" in item && String(item.quoteType)) || "EQUITY",
          region:
            ("exchDisp" in item && String(item.exchDisp)) ||
            ("exchange" in item && String(item.exchange)) ||
            "",
        }));
    });
  }

  async getSymbolData(
    symbol: string,
    period: MetricsPeriod,
    forceRefresh = false
  ): Promise<YahooSymbolData> {
    const s = symbol.toUpperCase();
    return this.cached(
      `YAHOO:SYMBOL_DATA:${s}:${period}`,
      () => this.fetchSymbolData(s, period),
      12,
      forceRefresh
    );
  }

  private async fetchSymbolData(
    symbol: string,
    period: MetricsPeriod
  ): Promise<YahooSymbolData> {
    const period1 = periodStartDate(period);
    const period2 = new Date();
    const limit = period === "1y" ? 4 : 12;

    const [financials, balanceSheet, cashFlow, chart, summary] =
      await Promise.all([
        this.yf.fundamentalsTimeSeries(symbol, {
          period1,
          period2,
          type: "quarterly",
          module: "financials",
        }) as Promise<FundamentalsRow[]>,
        this.yf.fundamentalsTimeSeries(symbol, {
          period1,
          period2,
          type: "quarterly",
          module: "balance-sheet",
        }) as Promise<FundamentalsRow[]>,
        this.yf.fundamentalsTimeSeries(symbol, {
          period1,
          period2,
          type: "quarterly",
          module: "cash-flow",
        }) as Promise<FundamentalsRow[]>,
        this.yf.chart(symbol, {
          period1: new Date(Date.now() - 5 * 365 * 86400000),
          period2,
          interval: "1d",
          events: "dividends",
        }),
        this.yf.quoteSummary(symbol, {
          modules: [
            "defaultKeyStatistics",
            "financialData",
            "summaryDetail",
            "summaryProfile",
            "price",
          ],
        }),
      ]);

    const byDate = new Map<string, YahooQuarterlyRow>();

    const merge = (
      rows: FundamentalsRow[],
      key: "income" | "balance" | "cashFlow"
    ) => {
      for (const row of rows) {
        const fiscalDateEnding = toDateKey(row.date);
        const existing = byDate.get(fiscalDateEnding) ?? {
          fiscalDateEnding,
          income: {},
          balance: {},
          cashFlow: {},
        };
        existing[key] = rowToNumbers(row);
        byDate.set(fiscalDateEnding, existing);
      }
    };

    merge(financials, "income");
    merge(balanceSheet, "balance");
    merge(cashFlow, "cashFlow");

    const quarterlyRows = [...byDate.values()]
      .sort((a, b) => b.fiscalDateEnding.localeCompare(a.fiscalDateEnding))
      .slice(0, limit)
      .reverse();

    const prices: YahooPricePoint[] = (chart.quotes ?? [])
      .map((q) => ({
        date: toDateKey(q.date),
        close: q.adjclose ?? q.close ?? 0,
      }))
      .filter((p) => p.close > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    const stats = summary.defaultKeyStatistics;
    const financial = summary.financialData;

    const asNum = (v: unknown): number | null =>
      typeof v === "number" && Number.isFinite(v) ? v : null;

    const companyName =
      typeof summary.price?.shortName === "string"
        ? summary.price.shortName
        : typeof summary.price?.longName === "string"
        ? summary.price.longName
        : null;

    const dividends = Array.isArray(chart.events?.dividends)
      ? chart.events.dividends
          .filter((d) => d && d.date instanceof Date && typeof d.amount === "number")
          .map((d) => ({
            date: d.date,
            amount: d.amount,
          }))
      : [];

    return {
      quarterlyRows,
      prices,
      dividends,
      quoteExtras: {
        trailingPe: asNum(stats?.trailingPE),
        trailingEps: asNum(stats?.trailingEps),
        priceToBook: asNum(stats?.priceToBook),
        bookValue: asNum(stats?.bookValue),
        returnOnEquity: asNum(financial?.returnOnEquity),
        dividendYield: asNum(summary.summaryDetail?.dividendYield),
        regularMarketChangePercent: asNum(
          summary.summaryDetail?.regularMarketChangePercent
        ),
        sector:
          typeof summary.summaryProfile?.sector === "string"
            ? summary.summaryProfile.sector
            : null,
        industry:
          typeof summary.summaryProfile?.industry === "string"
            ? summary.summaryProfile.industry
            : null,
        companyName,
      },
    };
  }
}
