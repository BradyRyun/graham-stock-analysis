import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useStockSearch } from "@/hooks/useStockSearch";
import { cn } from "@/lib/utils";

type TickerSearchProps = {
  value: string;
  onSymbolSelect: (symbol: string) => void;
};

export function TickerSearch({ value, onSymbolSelect }: TickerSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const debouncedQuery = useDebouncedValue(query, 300);
  const { data, isPending, isError, error } = useStockSearch(debouncedQuery);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const results = data?.results ?? [];

  return (
    <div className="flex max-w-md flex-col gap-2">
      <Label htmlFor="ticker-combobox">Ticker symbol</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="ticker-combobox"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {value ? (
              <span className="font-medium">{value}</span>
            ) : (
              <span className="text-muted-foreground">Search ticker…</span>
            )}
            <MagnifyingGlassIcon className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Type symbol or company name…"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {isPending && debouncedQuery.trim().length >= 1 && (
                <div className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                  <Spinner />
                  Searching…
                </div>
              )}
              {isError && (
                <CommandEmpty>{error.message}</CommandEmpty>
              )}
              {!isPending &&
                !isError &&
                debouncedQuery.trim().length >= 1 &&
                results.length === 0 && (
                  <CommandEmpty>No matches found.</CommandEmpty>
                )}
              {!isPending && !isError && results.length > 0 && (
                <CommandGroup heading="Symbols">
                  {results.map((r) => (
                    <CommandItem
                      key={r.symbol}
                      value={r.symbol}
                      onSelect={() => {
                        onSymbolSelect(r.symbol);
                        setQuery(r.symbol);
                        setOpen(false);
                      }}
                    >
                      <span className="font-medium">{r.symbol}</span>
                      <span
                        className={cn(
                          "ml-2 truncate text-muted-foreground"
                        )}
                      >
                        {r.name}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
