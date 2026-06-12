import { useQuery } from "@tanstack/react-query";
import { fetchBusinessProfile } from "@/lib/stocks";

export function useBusinessProfile(symbol: string | null) {
  return useQuery({
    queryKey: ["stocks", symbol, "business-profile"],
    queryFn: () => fetchBusinessProfile(symbol!),
    enabled: Boolean(symbol),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });
}
