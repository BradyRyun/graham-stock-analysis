import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

export function MetricsLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-row items-center gap-3">
            <Spinner className="size-5" />
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
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-4 w-full max-w-md" />
        </CardFooter>
      </Card>
    </div>
  );
}
