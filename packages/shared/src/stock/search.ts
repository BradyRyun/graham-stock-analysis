import { z } from "zod";

export const StockSearchResult = z.object({
  symbol: z.string(),
  name: z.string(),
  type: z.string(),
  region: z.string(),
});
export type StockSearchResult = z.infer<typeof StockSearchResult>;

export const StockSearchResponse = z.object({
  results: z.array(StockSearchResult),
});
export type StockSearchResponse = z.infer<typeof StockSearchResponse>;
