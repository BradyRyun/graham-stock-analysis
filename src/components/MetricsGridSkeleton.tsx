import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MetricsGridSkeleton() {
  return (
    <Card className="overflow-hidden py-0">
      <div className="flex flex-col">
        <div className="flex border-b px-6 py-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="ml-auto h-4 w-12" />
          <Skeleton className="ml-8 h-4 w-14" />
        </div>
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center border-b px-6 py-3 last:border-b-0"
          >
            <Skeleton className="h-4 w-36" />
            <Skeleton className="ml-auto h-4 w-16" />
            <Skeleton className="ml-8 h-4 w-14" />
          </div>
        ))}
      </div>
    </Card>
  );
}
