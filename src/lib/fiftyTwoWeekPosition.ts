export type FiftyTwoWeekPosition = {
  position: number;
  closerTo: "high" | "low";
  percentOfRange: number;
};

export function getFiftyTwoWeekPosition(
  price: number | null,
  high: number | null,
  low: number | null
): FiftyTwoWeekPosition | null {
  if (price === null || high === null || low === null || high <= low) {
    return null;
  }

  const position = (price - low) / (high - low);
  const clamped = Math.max(0, Math.min(1, position));

  return {
    position: clamped,
    closerTo: clamped >= 0.5 ? "high" : "low",
    percentOfRange: clamped * 100,
  };
}
