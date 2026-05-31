import { useQuery } from "@tanstack/react-query";
import { searchStocks } from "@/lib/stocks";

export function useStockSearch(query: string) {
  return useQuery({
    queryKey: ["stocks", "search", query],
    queryFn: () => searchStocks(query),
    enabled: query.trim().length >= 1,
    staleTime: 60_000,
  });
}
