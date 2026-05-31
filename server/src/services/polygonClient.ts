import type { MetricsPeriod } from "@stock-analyzer/shared";
import type { CacheService } from "./cache.js";

// Re-use the same types as YahooFinanceClient for compatibility
export type PolygonQuarterlyRow = {
  fiscalDateEnding: string;
  income: Record<string, number | null>;
  balance: Record<string, number | null>;
  cashFlow: Record<string, number | null>;
};

export type PolygonPricePoint = { date: string; close: number };

export type PolygonSymbolData = {
  quarterlyRows: PolygonQuarterlyRow[];
  prices: PolygonPricePoint[];
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

function periodStartDate(period: MetricsPeriod): Date {
  const d = new Date();
  const years = period === "1y" ? 1 : 3;
  d.setFullYear(d.getFullYear() - years);
  d.setMonth(d.getMonth() - 3);
  return d;
}

export class PolygonClient {
  private apiKey: string;
  private baseUrl = "https://api.polygon.io";

  constructor(private cache: CacheService) {
    this.apiKey = process.env.POLYGON_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("POLYGON_API_KEY environment variable is not set");
    }
  }

  private async fetch<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      headers: { "Authorization": `Bearer ${this.apiKey}` },
    });
    if (!response.ok) {
      throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

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
    const q = query.trim().toUpperCase();
    return this.cached(`POLYGON:SEARCH:${q}`, async () => {
      try {
        const url = `${this.baseUrl}/v3/reference/tickers?search=${encodeURIComponent(q)}&limit=10&apikey=${this.apiKey}`;
        const data = await this.fetch<{ results?: Array<{ ticker: string; name?: string; type?: string; primary_exchange?: string }> }>(url);

        return (data.results ?? [])
          .map((item: { ticker: string; name?: string; type?: string; primary_exchange?: string }) => ({
            symbol: item.ticker,
            name: item.name || item.ticker,
            type: item.type || "EQUITY",
            region: item.primary_exchange || "",
          }));
      } catch (error) {
        console.error("Polygon search error:", error);
        return [];
      }
    });
  }

  async getSymbolData(
    symbol: string,
    period: MetricsPeriod,
    forceRefresh = false
  ): Promise<PolygonSymbolData> {
    const s = symbol.toUpperCase();
    return this.cached(
      `POLYGON:SYMBOL_DATA:${s}:${period}`,
      () => this.fetchSymbolData(s, period),
      12,
      forceRefresh
    );
  }

  private async fetchSymbolData(
    symbol: string,
    period: MetricsPeriod
  ): Promise<PolygonSymbolData> {
    const periodStart = periodStartDate(period);
    const periodEnd = new Date();
    const limit = period === "1y" ? 4 : 12;

    try {
      const [financials, bars, tickerDetails, dividends] = await Promise.all([
        this.fetchFinancials(symbol, limit),
        this.fetchPrices(symbol, periodStart, periodEnd, period),
        this.fetchTickerDetails(symbol),
        this.fetchDividends(symbol, periodStart, periodEnd),
      ]);

      return {
        quarterlyRows: financials,
        prices: bars,
        dividends,
        quoteExtras: tickerDetails,
      };
    } catch (error) {
      console.error(`Polygon fetchSymbolData error for ${symbol}:`, error);
      return {
        quarterlyRows: [],
        prices: [],
        dividends: [],
        quoteExtras: {
          trailingPe: null,
          trailingEps: null,
          priceToBook: null,
          bookValue: null,
          returnOnEquity: null,
          dividendYield: null,
          regularMarketChangePercent: null,
          sector: null,
          industry: null,
          companyName: null,
        },
      };
    }
  }

  private async fetchFinancials(
    symbol: string,
    limit: number
  ): Promise<PolygonQuarterlyRow[]> {
    try {
      const url = `${this.baseUrl}/vx/reference/financials?ticker=${symbol}&limit=${limit}&sort=-filing_date&apikey=${this.apiKey}`;
      const data = await this.fetch<{ results?: Array<any> }>(url);

      const quarterlyRows: PolygonQuarterlyRow[] = [];
      
      for (const financial of data.results ?? []) {
        const date = financial.filing_date || financial.end_date;
        if (!date) continue;

        quarterlyRows.push({
          fiscalDateEnding: toDateKey(
            typeof date === "string" ? new Date(date) : date
          ),
          income: {
            totalRevenue: financial.income_statement?.revenues ?? null,
            operatingIncome:
              financial.income_statement?.operating_income ?? null,
            netIncome:
              financial.income_statement?.net_income_loss ?? null,
          },
          balance: {
            totalAssets:
              financial.balance_sheet?.assets?.current?.total ??
              financial.balance_sheet?.total_assets ??
              null,
            totalLiabilities:
              financial.balance_sheet?.liabilities?.total ?? null,
            totalEquity: financial.balance_sheet?.stockholders_equity ?? null,
          },
          cashFlow: {
            operatingCashFlow:
              financial.cash_flow_statement?.operating_cash_flow ?? null,
            investingCashFlow:
              financial.cash_flow_statement?.investing_cash_flow ?? null,
            financingCashFlow:
              financial.cash_flow_statement?.financing_cash_flow ?? null,
          },
        });
      }

      quarterlyRows.sort((a, b) =>
        b.fiscalDateEnding.localeCompare(a.fiscalDateEnding)
      );
      
      return quarterlyRows.slice(0, limit).reverse();
    } catch (error) {
      console.error(`Polygon financials fetch error for ${symbol}:`, error);
      return [];
    }
  }

  private async fetchPrices(
    symbol: string,
    from: Date,
    to: Date,
    period: MetricsPeriod
  ): Promise<PolygonPricePoint[]> {
    try {
      const fromStr = toDateKey(from);
      const toStr = toDateKey(to);

      const url = `${this.baseUrl}/v2/aggs/ticker/${symbol}/range/1/day/${fromStr}/${toStr}?sort=asc&limit=50000&apikey=${this.apiKey}`;
      const data = await this.fetch<{ results?: Array<any> }>(url);

      const prices: PolygonPricePoint[] = (data.results ?? [])
        .map((bar: any) => ({
          date: toDateKey(new Date(bar.t)),
          close: bar.c ?? 0,
        }))
        .filter((p: PolygonPricePoint) => p.close > 0)
        .sort((a: PolygonPricePoint, b: PolygonPricePoint) => a.date.localeCompare(b.date));

      return prices;
    } catch (error) {
      console.error(`Polygon prices fetch error for ${symbol}:`, error);
      return [];
    }
  }

  private async fetchTickerDetails(
    symbol: string
  ): Promise<PolygonSymbolData["quoteExtras"]> {
    try {
      const url = `${this.baseUrl}/v3/reference/tickers/${symbol}?apikey=${this.apiKey}`;
      const data = await this.fetch<{ results?: any }>(url);
      const ticker = data.results;

      if (!ticker) {
        return {
          trailingPe: null,
          trailingEps: null,
          priceToBook: null,
          bookValue: null,
          returnOnEquity: null,
          dividendYield: null,
          regularMarketChangePercent: null,
          sector: null,
          industry: null,
          companyName: null,
        };
      }

      const asNum = (v: unknown): number | null =>
        typeof v === "number" && Number.isFinite(v) ? v : null;

      return {
        trailingPe: asNum(ticker.fhk?.pe_ratio),
        trailingEps: asNum(ticker.fhk?.eps),
        priceToBook: asNum(ticker.fhk?.pb_ratio),
        bookValue: asNum(ticker.fhk?.book_value),
        returnOnEquity: asNum(ticker.fhk?.roe),
        dividendYield: asNum(ticker.fhk?.dividend_yield),
        regularMarketChangePercent: null, // Polygon doesn't provide this in ticker details
        sector: ticker.sic_description || null,
        industry: ticker.industry || null,
        companyName: ticker.name || null,
      };
    } catch (error) {
      console.error(`Polygon ticker details fetch error for ${symbol}:`, error);
      return {
        trailingPe: null,
        trailingEps: null,
        priceToBook: null,
        bookValue: null,
        returnOnEquity: null,
        dividendYield: null,
        regularMarketChangePercent: null,
        sector: null,
        industry: null,
        companyName: null,
      };
    }
  }

  private async fetchDividends(
    symbol: string,
    from: Date,
    to: Date
  ): Promise<Array<{ date: Date; amount: number }>> {
    try {
      const fromStr = toDateKey(from);
      const toStr = toDateKey(to);

      const url = `${this.baseUrl}/v3/reference/dividends?ticker=${symbol}&ex_dividend_date.gte=${fromStr}&ex_dividend_date.lte=${toStr}&limit=100&apikey=${this.apiKey}`;
      const data = await this.fetch<{ results?: Array<any> }>(url);

      return (data.results ?? [])
        .map((div: any) => ({
          date: new Date(div.ex_dividend_date),
          amount: div.cash_amount ?? 0,
        }))
        .filter((d: { date: Date; amount: number }) => d.amount > 0)
        .sort((a: { date: Date; amount: number }, b: { date: Date; amount: number }) => a.date.getTime() - b.date.getTime());
    } catch (error) {
      console.error(`Polygon dividends fetch error for ${symbol}:`, error);
      return [];
    }
  }
}
