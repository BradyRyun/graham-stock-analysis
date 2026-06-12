import type { MetricsPeriod } from "@stock-analyzer/shared";
import { ExclamationTriangleIcon, StarIcon } from "@radix-ui/react-icons";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AllTimeHighPositionIndicator } from "@/components/AllTimeHighPositionIndicator";
import { FiftyTwoWeekPositionIndicator } from "@/components/FiftyTwoWeekPositionIndicator";
import { StockSymbolHeaderSkeleton } from "@/components/StockSymbolHeaderSkeleton";
import { useFavorites } from "@/hooks/useFavorites";
import { useStockMetrics } from "@/hooks/useStockMetrics";
import { formatPercentChange, formatPrice } from "@/lib/formatPrice";
import { cn } from "@/lib/utils";

type StockSymbolHeaderProps = {
  symbol: string;
  period: MetricsPeriod;
};

function changeColorClass(value: number | null): string {
  if (value === null || value === 0) return "text-muted-foreground";
  return value > 0 ? "text-green-600" : "text-destructive";
}

type PriceChangeProps = {
  value: number | null;
  label: string;
};

function PriceChange({ value, label }: PriceChangeProps) {
  return (
    <span className={cn("text-sm font-medium tabular-nums", changeColorClass(value))}>
      {formatPercentChange(value)}{" "}
      <span className="font-normal text-muted-foreground">{label}</span>
    </span>
  );
}

type PriceLevelProps = {
  value: number | null;
  label: string;
};

function PriceLevel({ value, label }: PriceLevelProps) {
  return (
    <span className="text-sm font-medium tabular-nums">
      <span className="font-normal text-muted-foreground">{label}</span>{" "}
      {formatPrice(value)}
    </span>
  );
}

export function StockSymbolHeader({ symbol, period }: StockSymbolHeaderProps) {
  const forceRefreshRef = useRef(false);
  const { toggleFavorite, isFavorite } = useFavorites();
  const { data, isPending, isError, error, refetch, isRefetching } =
    useStockMetrics(symbol, period, forceRefreshRef);

  const handleRefetch = async () => {
    forceRefreshRef.current = true;
    try {
      await refetch();
    } finally {
      forceRefreshRef.current = false;
    }
  };

  const handleToggleFavorite = () => {
    toggleFavorite({
      symbol,
      name: data?.companyName ?? symbol,
    });
  };

  if (isPending && !data) {
    return <StockSymbolHeaderSkeleton />;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <ExclamationTriangleIcon />
        <AlertTitle>Could not load {symbol}</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  const periodLabel = period === "1y" ? "1Y" : "3Y";
  const favorited = isFavorite(symbol);

  const gradeVariant =
    data.buyModel.grade === "strong buy"
      ? "golden"
      : data.buyModel.grade === "buy"
        ? "success"
        : data.buyModel.grade === "cautious buy"
          ? "secondary"
          : "destructive";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-2xl">{data.symbol}</CardTitle>
            <Badge variant="secondary">Equity</Badge>
            <Badge
              variant={data.buyModel.model === "financial" ? "secondary" : "default"}
            >
              {data.buyModel.model === "financial"
                ? "Financial Model"
                : "Regular Model"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={favorited ? "golden" : "outline"}
              onClick={handleToggleFavorite}
            >
              <StarIcon className="mr-2 h-4 w-4" />
              {favorited ? "Favorited" : "Add Favorite"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefetch}
              disabled={isRefetching}
            >
              {isRefetching ? "Refetching..." : "Refetch"}
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <span className="text-3xl font-semibold tabular-nums tracking-tight">
              {formatPrice(data.price)}
            </span>
            <FiftyTwoWeekPositionIndicator
              price={data.price}
              fiftyTwoWeekHigh={data.fiftyTwoWeekHigh}
              fiftyTwoWeekLow={data.fiftyTwoWeekLow}
            />
            <AllTimeHighPositionIndicator
              price={data.price}
              allTimeHigh={data.allTimeHigh}
              allTimeHighSource={data.allTimeHighSource}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={gradeVariant} className="text-base font-semibold">
              {data.buyModel.grade}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Buy score {data.buyModel.score}/100
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <PriceChange value={data.priceChangePercentDay} label="Day" />
            <PriceChange value={data.priceChangePercentPeriod} label={periodLabel} />
            <PriceLevel value={data.fiftyTwoWeekHigh} label="52W High" />
            <PriceLevel value={data.fiftyTwoWeekLow} label="52W Low" />
            <PriceLevel value={data.allTimeHigh} label="ATH" />
          </div>
        </div>
        <CardDescription>
          Metrics as of {new Date(data.asOf).toLocaleString()}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
