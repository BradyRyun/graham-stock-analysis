import type { MetricsPeriod } from "@stock-analyzer/shared";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type PeriodToggleProps = {
  value: MetricsPeriod;
  onChange: (period: MetricsPeriod) => void;
};

export function PeriodToggle({ value, onChange }: PeriodToggleProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label>History period</Label>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => {
          if (next === "1y" || next === "3y") onChange(next);
        }}
        variant="outline"
      >
        <ToggleGroupItem value="1y" aria-label="1 year quarterly history">
          1Y
        </ToggleGroupItem>
        <ToggleGroupItem value="3y" aria-label="3 year quarterly history">
          3Y
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
