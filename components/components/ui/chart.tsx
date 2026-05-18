import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

type ChartConfig = Record<
  string,
  {
    label?: string;
    icon?: React.ComponentType<any>;
  }
>;

const ChartContext = React.createContext<{ config: ChartConfig }>({
  config: {},
});

export function useChart() {
  return React.useContext(ChartContext);
}

export function ChartContainer({
  config = {},
  className,
  children,
}: {
  config?: ChartConfig;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <ChartContext.Provider value={{ config }}>
      <div className={className}>{children}</div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = RechartsPrimitive.Tooltip;
export const ChartLegend = RechartsPrimitive.Legend;

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  any
>((props, ref) => {
  const {
    active,
    payload,
    label,
    className,
  } = props;

  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  const first = payload[0];
  const key =
    String(first?.dataKey || first?.name || "value");

  const itemConfig = config[key];
  const title =
    itemConfig?.label ||
    (typeof label === "string" ? label : key);

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-md",
        className
      )}
    >
      {title && (
        <div className="mb-2 font-medium">
          {title}
        </div>
      )}

      <div className="space-y-1">
        {payload.map((item: any, index: number) => (
          <div
            key={`${item.dataKey}-${index}`}
            className="flex items-center justify-between gap-3"
          >
            <span className="text-muted-foreground">
              {item.name}
            </span>
            <span className="font-medium">
              {String(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

ChartTooltipContent.displayName = "ChartTooltip";

export const ChartLegendContent = RechartsPrimitive.DefaultLegendContent;
