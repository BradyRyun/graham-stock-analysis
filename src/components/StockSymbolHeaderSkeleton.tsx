import {
  Card,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StockSymbolHeaderSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3">
        <div className="flex flex-row items-center gap-3">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-5 w-14" />
        </div>
        <div className="flex flex-wrap items-baseline gap-4">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-4 w-64" />
      </CardHeader>
    </Card>
  );
}
