import type { BuyModelResult, MetricsPeriod } from "@stock-analyzer/shared";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle className="text-2xl">{symbol}</CardTitle>
          <Badge variant="secondary">Equity</Badge>
          <Badge variant={buyModel.model === "financial" ? "secondary" : "default"}>
            {buyModel.model === "financial" ? "Financial Model" : "Regular Model"}
          </Badge>
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
