import {
  useId,
  useMemo,
} from "react";

import {
  cn,
} from "@/lib/utils";

export interface RuntimeSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  className?: string;
  label?: string;
}

interface Point {
  x: number;
  y: number;
}

function createSmoothPath(
  points: Point[],
): string {
  if (!points.length) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path =
    `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (
    let index = 1;
    index < points.length - 1;
    index += 1
  ) {
    const current =
      points[index];

    const next =
      points[index + 1];

    const controlX =
      (current.x + next.x) / 2;

    const controlY =
      (current.y + next.y) / 2;

    path +=
      ` Q ${current.x.toFixed(2)} ${current.y.toFixed(2)}` +
      ` ${controlX.toFixed(2)} ${controlY.toFixed(2)}`;
  }

  const previous =
    points[points.length - 2];

  const last =
    points[points.length - 1];

  path +=
    ` Q ${previous.x.toFixed(2)} ${previous.y.toFixed(2)}` +
    ` ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;

  return path;
}

export function RuntimeSparkline({
  data,
  width = 260,
  height = 64,
  stroke = "hsl(var(--cyan))",
  fill = "hsl(var(--cyan) / 0.12)",
  className,
  label = "Runtime activity",
}: RuntimeSparklineProps) {
  const gradientId =
    useId().replace(/:/g, "");

  const glowId =
    `${gradientId}-glow`;

  const {
    linePath,
    areaPath,
    latest,
  } = useMemo(() => {
    if (!data.length) {
      return {
        linePath: "",
        areaPath: "",
        latest: null,
      };
    }

    const padding =
      4;

    const usableWidth =
      Math.max(1, width - padding * 2);

    const usableHeight =
      Math.max(1, height - padding * 2);

    const minimum =
      Math.min(...data);

    const maximum =
      Math.max(...data);

    const span =
      maximum - minimum || 1;

    const stepX =
      usableWidth /
      Math.max(1, data.length - 1);

    const points: Point[] =
      data.map((value, index) => ({
        x:
          padding +
          index * stepX,
        y:
          padding +
          usableHeight -
          ((value - minimum) / span) *
            usableHeight,
      }));

    const line =
      createSmoothPath(points);

    const lastPoint =
      points[points.length - 1];

    const firstPoint =
      points[0];

    return {
      linePath: line,
      areaPath:
        `${line} ` +
        `L ${lastPoint.x.toFixed(2)} ${(height - padding).toFixed(2)} ` +
        `L ${firstPoint.x.toFixed(2)} ${(height - padding).toFixed(2)} Z`,
      latest: lastPoint,
    };
  }, [
    data,
    height,
    width,
  ]);

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn(
        "block h-16 w-full overflow-visible",
        className,
      )}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor={fill}
            stopOpacity="0.9"
          />

          <stop
            offset="100%"
            stopColor={fill}
            stopOpacity="0"
          />
        </linearGradient>

        <filter
          id={glowId}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur
            stdDeviation="2.5"
            result="blur"
          />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g
        stroke="var(--lumina-border-standard)"
        strokeWidth="0.7"
        opacity="0.5"
      >
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={`horizontal-${ratio}`}
            x1="0"
            y1={height * ratio}
            x2={width}
            y2={height * ratio}
          />
        ))}

        {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
          <line
            key={`vertical-${ratio}`}
            x1={width * ratio}
            y1="0"
            x2={width * ratio}
            y2={height}
          />
        ))}
      </g>

      {areaPath && (
        <path
          d={areaPath}
          fill={`url(#${gradientId})`}
        />
      )}

      {linePath && (
        <>
          <path
            d={linePath}
            fill="none"
            stroke={stroke}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.18"
            filter={`url(#${glowId})`}
          />

          <path
            d={linePath}
            fill="none"
            stroke={stroke}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${glowId})`}
          />
        </>
      )}

      <line
        x1="0"
        y1="0"
        x2="0"
        y2={height}
        stroke={stroke}
        strokeWidth="1"
        opacity="0.45"
      >
        <animate
          attributeName="x1"
          values={`0;${width};0`}
          dur="4s"
          repeatCount="indefinite"
        />

        <animate
          attributeName="x2"
          values={`0;${width};0`}
          dur="4s"
          repeatCount="indefinite"
        />

        <animate
          attributeName="opacity"
          values="0;0.65;0"
          dur="4s"
          repeatCount="indefinite"
        />
      </line>

      {latest && (
        <>
          <circle
            cx={latest.x}
            cy={latest.y}
            r="5"
            fill={stroke}
            opacity="0.18"
          >
            <animate
              attributeName="r"
              values="3;7;3"
              dur="1.8s"
              repeatCount="indefinite"
            />

            <animate
              attributeName="opacity"
              values="0.45;0.08;0.45"
              dur="1.8s"
              repeatCount="indefinite"
            />
          </circle>

          <circle
            cx={latest.x}
            cy={latest.y}
            r="2.25"
            fill={stroke}
          />
        </>
      )}
    </svg>
  );
}

export default RuntimeSparkline;
