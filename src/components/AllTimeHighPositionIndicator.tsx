import type { StockMetricsResponse } from "@stock-analyzer/shared";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getAllTimeHighPosition } from "@/lib/allTimeHighPosition";
import { formatPrice } from "@/lib/formatPrice";
import { cn } from "@/lib/utils";

type AllTimeHighPositionIndicatorProps = {
  price: number | null;
  allTimeHigh: number | null;
  allTimeHighSource: StockMetricsResponse["allTimeHighSource"];
};

export function AllTimeHighPositionIndicator({
  price,
  allTimeHigh,
  allTimeHighSource,
}: AllTimeHighPositionIndicatorProps) {
  const data = getAllTimeHighPosition(price, allTimeHigh);

  if (!data) {
    return null;
  }

  const { percentOfAth, distanceBelowAth, isNearAth } = data;
  const position = Math.max(0, Math.min(1, percentOfAth / 100));
  const sourceLabel =
    allTimeHighSource === "polygon"
      ? "Polygon full history"
      : "Available price history";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col gap-1.5 pb-0.5">
            <Badge
              variant={isNearAth ? "golden" : "secondary"}
              className="w-fit text-[11px] font-medium"
            >
              {isNearAth
                ? "Near ATH"
                : `${distanceBelowAth.toFixed(1)}% below ATH`}
            </Badge>
            <div
              className="relative h-1.5 w-24 rounded-full bg-muted"
              aria-hidden
            >
              <div
                className={cn(
                  "absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background",
                  isNearAth ? "bg-yellow-500" : "bg-muted-foreground"
                )}
                style={{ left: `${position * 100}%` }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {percentOfAth.toFixed(1)}% of all-time high ({formatPrice(allTimeHigh)}
          ). Source: {sourceLabel}.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
