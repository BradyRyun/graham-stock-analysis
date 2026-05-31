import type { MetricsPeriod } from "@stock-analyzer/shared";
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
}: StockSymbolHeaderProps) {
  const periodLabel = period === "1y" ? "1Y" : "3Y";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle className="text-2xl">{symbol}</CardTitle>
          <Badge variant="secondary">Equity</Badge>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 flex-col">
          <span className="text-3xl font-semibold tabular-nums tracking-tight">
            {formatPrice(price)}
          </span>
          <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1 flex-col">
          <PriceChange value={priceChangePercentDay} label="Day" />
          <PriceChange
            value={priceChangePercentPeriod}
            label={periodLabel}
          />
          </span>

        </div>
        <CardDescription>
          Metrics as of {new Date(asOf).toLocaleString()}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
