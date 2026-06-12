import type { MetricsPeriod } from "@stock-analyzer/shared";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useSearchParams } from "react-router-dom";
import { BusinessProfileCard } from "@/components/BusinessProfileCard";
import { MetricHistoryChart } from "@/components/MetricHistoryChart";
import { MetricHistoryChartSkeleton } from "@/components/MetricHistoryChartSkeleton";
import { MetricsGrid } from "@/components/MetricsGrid";
import { MetricsGridSkeleton } from "@/components/MetricsGridSkeleton";
import { PeriodToggle } from "@/components/PeriodToggle";
import { StockSymbolHeader } from "@/components/StockSymbolHeader";
import { FavoritesDropdown } from "@/components/FavoritesDropdown";
import { TickerSearch } from "@/components/TickerSearch";
import { useFavorites } from "@/hooks/useFavorites";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { Separator } from "@/components/ui/separator";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { useStockMetrics } from "@/hooks/useStockMetrics";

export function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const symbol = searchParams.get("symbol");
  const period = (searchParams.get("period") ?? "1y") as MetricsPeriod;
  const validPeriod: MetricsPeriod = period === "3y" ? "3y" : "1y";

  const { favorites, removeFavorite } = useFavorites();
  const { data, isPending } = useStockMetrics(symbol, validPeriod);
  const {
    data: businessProfile,
    isPending: isBusinessProfilePending,
    isError: isBusinessProfileError,
    error: businessProfileError,
  } = useBusinessProfile(symbol);

  const setSymbol = (next: string) => {
    setSearchParams({ symbol: next, period: validPeriod });
  };

  const setPeriod = (next: MetricsPeriod) => {
    if (symbol) {
      setSearchParams({ symbol, period: next });
    }
  };

  const showMetricsSkeleton = Boolean(symbol && isPending && !data);

  return (
    <PageWrapper>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">Stock Analyzer</h1>
            <p className="text-muted-foreground">
              Fundamental metrics with quarterly history via Yahoo Finance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <FavoritesDropdown
              favorites={favorites}
              onSelect={setSymbol}
              onRemove={removeFavorite}
            />
            <PeriodToggle value={validPeriod} onChange={setPeriod} />
          </div>
        </header>

        <Separator />

        <TickerSearch value={symbol ?? ""} onSymbolSelect={setSymbol} />

        {!symbol && (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MagnifyingGlassIcon />
              </EmptyMedia>
              <EmptyTitle>Search for a stock</EmptyTitle>
              <EmptyDescription>
                Enter a ticker symbol above to load P/E, Sharpe ratio, cash flow
                yield, and other fundamentals.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {symbol && (
          <div className="flex flex-col gap-8">
            <StockSymbolHeader symbol={symbol} period={validPeriod} />

            <BusinessProfileCard
              isPending={isBusinessProfilePending}
              isError={isBusinessProfileError}
              error={businessProfileError}
              data={businessProfile}
            />

            {data ? (
              <MetricsGrid current={data.current} price={data.price} />
            ) : showMetricsSkeleton ? (
              <MetricsGridSkeleton />
            ) : null}

            {data ? (
              <MetricHistoryChart
                history={data.history}
                current={{
                  fiscalDateEnding: data.asOf.slice(0, 10),
                  ...data.current,
                }}
              />
            ) : showMetricsSkeleton ? (
              <MetricHistoryChartSkeleton />
            ) : null}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
