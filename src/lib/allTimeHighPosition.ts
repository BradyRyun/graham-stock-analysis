export type AllTimeHighPosition = {
  percentOfAth: number;
  distanceBelowAth: number;
  isNearAth: boolean;
};

export function getAllTimeHighPosition(
  price: number | null,
  allTimeHigh: number | null
): AllTimeHighPosition | null {
  if (price === null || allTimeHigh === null || allTimeHigh <= 0) {
    return null;
  }

  const percentOfAth = (price / allTimeHigh) * 100;
  const distanceBelowAth = Math.max(0, ((allTimeHigh - price) / allTimeHigh) * 100);

  return {
    percentOfAth,
    distanceBelowAth,
    isNearAth: percentOfAth >= 95,
  };
}
