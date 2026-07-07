import { useMemo } from "react";
import { cn } from "@/lib/utils";

/** Inline SVG sparkline. No chart library. */
export function RuntimeSparkline({
  data, width = 120, height = 32, stroke = "hsl(var(--violet))", fill = "hsl(var(--violet) / 0.15)", className,
}: {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  className?: string;
}) {
  const { d, area } = useMemo(() => {
    if (!data.length) return { d: "", area: "" };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const stepX = width / Math.max(1, data.length - 1);
    const pts = data.map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / span) * height;
      return [x, y] as const;
    });
    const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    const area = `${d} L${width},${height} L0,${height} Z`;
    return { d, area };
  }, [data, width, height]);

  return (
    <svg
      role="img" aria-label="Trend"
      width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      className={cn("block overflow-visible", className)}
    >
      <path d={area} fill={fill} />
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}