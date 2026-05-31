import type { BuyModelResult, MetricsPeriod } from "@stock-analyzer/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StarIcon } from "@radix-ui/react-icons";
import { formatPercentChange, formatPrice } from "@/lib/formatPrice";
import { cn } from "@/lib/utils";

type StockSymbolHeaderProps = {
  symbol: string;
  asOf: string;
  price: number | null;
  priceChangePercentDay: number | null;
  priceChangePercentPeriod: number | null;
  period: MetricsPeriod;
  buyModel: BuyModelResult;
  onRefetch: () => void;
  isRefetching: boolean;
  onToggleFavorite: () => void;
  isFavorite: boolean;
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

export function StockSymbolHeader({
  symbol,
  asOf,
  price,
  priceChangePercentDay,
  priceChangePercentPeriod,
  period,
  buyModel,
  onRefetch,
  isRefetching,
  onToggleFavorite,
  isFavorite,
}: StockSymbolHeaderProps) {
  const periodLabel = period === "1y" ? "1Y" : "3Y";

  const gradeVariant =
    buyModel.grade === "strong buy"
      ? "golden"
      : buyModel.grade === "buy"
      ? "success"
      : buyModel.grade === "cautious buy"
      ? "secondary"
      : "destructive";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-2xl">{symbol}</CardTitle>
            <Badge variant="secondary">Equity</Badge>
            <Badge variant={buyModel.model === "financial" ? "secondary" : "default"}>
              {buyModel.model === "financial" ? "Financial Model" : "Regular Model"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isFavorite ? "golden" : "outline"}
              onClick={onToggleFavorite}
            >
              <StarIcon className="mr-2 h-4 w-4" />
              {isFavorite ? "Favorited" : "Add Favorite"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onRefetch}
              disabled={isRefetching}
            >
              {isRefetching ? "Refetching..." : "Refetch"}
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-3xl font-semibold tabular-nums tracking-tight">
            {formatPrice(price)}
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={gradeVariant} className="text-base font-semibold">
              {buyModel.grade}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Buy score {buyModel.score}/100
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <PriceChange value={priceChangePercentDay} label="Day" />
            <PriceChange value={priceChangePercentPeriod} label={periodLabel} />
          </div>
        </div>
        <CardDescription>
          Metrics as of {new Date(asOf).toLocaleString()}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
