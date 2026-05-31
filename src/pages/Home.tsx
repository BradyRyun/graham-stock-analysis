import type { MetricsPeriod } from "@stock-analyzer/shared";
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import { useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { MetricHistoryChart } from "@/components/MetricHistoryChart";
import { MetricsGrid } from "@/components/MetricsGrid";
import { MetricsLoadingSkeleton } from "@/components/MetricsLoadingSkeleton";
import { PeriodToggle } from "@/components/PeriodToggle";
import { StockSymbolHeader } from "@/components/StockSymbolHeader";
import { FavoritesDropdown } from "@/components/FavoritesDropdown";
import { TickerSearch } from "@/components/TickerSearch";
import { useFavorites } from "@/hooks/useFavorites";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { Separator } from "@/components/ui/separator";
import { useStockMetrics } from "@/hooks/useStockMetrics";

export function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const symbol = searchParams.get("symbol");
  const period = (searchParams.get("period") ?? "1y") as MetricsPeriod;
  const validPeriod: MetricsPeriod = period === "3y" ? "3y" : "1y";

  const forceRefreshRef = useRef(false);
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { data, isPending, isError, error, refetch, isRefetching } =
    useStockMetrics(symbol, validPeriod, forceRefreshRef);

  const setSymbol = (next: string) => {
    setSearchParams({ symbol: next, period: validPeriod });
  };

  const handleSelectFavorite = (favoriteSymbol: string) => {
    setSymbol(favoriteSymbol);
  };

  const handleToggleFavorite = () => {
    if (!data?.symbol) return;
    toggleFavorite({
      symbol: data.symbol,
      name: data.companyName ?? data.symbol,
    });
  };

  const currentIsFavorite = data ? isFavorite(data.symbol) : false;

  const setPeriod = (next: MetricsPeriod) => {
    if (symbol) {
      setSearchParams({ symbol, period: next });
    }
  };

  const handleRefetch = async () => {
    if (!symbol) return;
    forceRefreshRef.current = true;
    try {
      await refetch();
    } finally {
      forceRefreshRef.current = false;
    }
  };

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
              onSelect={handleSelectFavorite}
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

        {symbol && isPending && <MetricsLoadingSkeleton />}

        {symbol && isError && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon />
            <AlertTitle>Could not load {symbol}</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {symbol && data && (
          <div className="flex flex-col gap-8">
            <StockSymbolHeader
              symbol={data.symbol}
              asOf={data.asOf}
              price={data.price}
              priceChangePercentDay={data.priceChangePercentDay}
              priceChangePercentPeriod={data.priceChangePercentPeriod}
              period={validPeriod}
              buyModel={data.buyModel}
              onRefetch={handleRefetch}
              isRefetching={isRefetching}
              onToggleFavorite={handleToggleFavorite}
              isFavorite={currentIsFavorite}
            />
            <MetricsGrid current={data.current} price={data.price} />
            <MetricHistoryChart
              history={data.history}
              current={{
                fiscalDateEnding: data.asOf.slice(0, 10),
                ...data.current,
              }}
            />
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
