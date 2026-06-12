import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getFiftyTwoWeekPosition } from "@/lib/fiftyTwoWeekPosition";
import { formatPrice } from "@/lib/formatPrice";
import { cn } from "@/lib/utils";

type FiftyTwoWeekPositionIndicatorProps = {
  price: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
};

export function FiftyTwoWeekPositionIndicator({
  price,
  fiftyTwoWeekHigh,
  fiftyTwoWeekLow,
}: FiftyTwoWeekPositionIndicatorProps) {
  const data = getFiftyTwoWeekPosition(
    price,
    fiftyTwoWeekHigh,
    fiftyTwoWeekLow
  );

  if (!data) {
    return null;
  }

  const { position, closerTo, percentOfRange } = data;
  const isNearHigh = closerTo === "high" && percentOfRange > 70;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col gap-1.5 pb-0.5">
            <Badge
              variant={isNearHigh ? "destructive" : "success"}
              className="w-fit text-[11px] font-medium"
            >
              {isNearHigh ? "Near 52W High" : "Near 52W Low"}
            </Badge>
            <div
              className="relative h-1.5 w-24 rounded-full bg-muted"
              aria-hidden
            >
              <div
                className={cn(
                  "absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background",
                  isNearHigh ? "bg-green-600" : "bg-destructive"
                )}
                style={{ left: `${position * 100}%` }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {percentOfRange.toFixed(0)}% of 52-week range (
          {formatPrice(fiftyTwoWeekLow)} – {formatPrice(fiftyTwoWeekHigh)})
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
