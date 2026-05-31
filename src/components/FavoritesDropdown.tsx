import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { FavoriteStock } from "@/hooks/useFavorites";

type FavoritesDropdownProps = {
  favorites: FavoriteStock[];
  onSelect: (symbol: string) => void;
};

export function FavoritesDropdown({ favorites, onSelect }: FavoritesDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          Favorites
          <ChevronDown className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <div className="divide-y rounded-md border bg-popover text-popover-foreground">
          <div className="px-4 py-3 text-sm font-medium">Favorites</div>
          {favorites.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No favorites yet.
            </div>
          ) : (
            favorites.map((favorite) => (
              <button
                key={favorite.symbol}
                type="button"
                className="w-full px-4 py-3 text-left hover:bg-accent/70"
                onClick={() => {
                  onSelect(favorite.symbol);
                  setOpen(false);
                }}
              >
                <div className="font-medium">{favorite.name}</div>
                <div className="text-xs text-muted-foreground">
                  {favorite.symbol}
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
