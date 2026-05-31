import { useCallback, useEffect, useState } from "react";

export type FavoriteStock = {
  symbol: string;
  name: string;
};

const STORAGE_KEY = "stock-analyzer:favorites";

function loadFavorites(): FavoriteStock[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is FavoriteStock =>
        item && typeof item.symbol === "string" && typeof item.name === "string"
    );
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteStock[]>(() =>
    loadFavorites()
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // ignore write failures
    }
  }, [favorites]);

  const addFavorite = useCallback((favorite: FavoriteStock) => {
    setFavorites((current) => {
      const filtered = current.filter((item) => item.symbol !== favorite.symbol);
      return [favorite, ...filtered];
    });
  }, []);

  const removeFavorite = useCallback((symbol: string) => {
    setFavorites((current) => current.filter((item) => item.symbol !== symbol));
  }, []);

  const toggleFavorite = useCallback((favorite: FavoriteStock) => {
    setFavorites((current) => {
      const exists = current.some((item) => item.symbol === favorite.symbol);
      if (exists) {
        return current.filter((item) => item.symbol !== favorite.symbol);
      }
      return [favorite, ...current];
    });
  }, []);

  const isFavorite = useCallback(
    (symbol: string) => favorites.some((item) => item.symbol === symbol),
    [favorites]
  );

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
}
