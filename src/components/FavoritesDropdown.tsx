import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { FavoriteStock } from "@/hooks/useFavorites";

type FavoritesDropdownProps = {
  favorites: FavoriteStock[];
  onSelect: (symbol: string) => void;
  onRemove: (symbol: string) => void;
};

export function FavoritesDropdown({
  favorites,
  onSelect,
  onRemove,
}: FavoritesDropdownProps) {
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
              <div
                key={favorite.symbol}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent/70"
              >
                <Checkbox
                  checked
                  aria-label={`Remove ${favorite.symbol} from favorites`}
                  onCheckedChange={(checked) => {
                    if (!checked) onRemove(favorite.symbol);
                  }}
                  onClick={(event) => event.stopPropagation()}
                />
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
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
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
