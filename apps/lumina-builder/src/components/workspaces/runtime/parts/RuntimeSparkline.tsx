import {
  useId,
  useMemo,
} from "react";

import {
  cn,
} from "@/lib/utils";

export type RuntimeTelemetryMode =
  | "signal"
  | "health"
  | "cpu"
  | "memory"
  | "throughput"
  | "service";

export interface RuntimeSparklineProps {
  data: number[];
  secondaryData?: number[];
  mode?: RuntimeTelemetryMode;
  width?: number;
  height?: number;
  stroke?: string;
  secondaryStroke?: string;
  fill?: string;
  className?: string;
  label?: string;
}

interface Point {
  x: number;
  y: number;
}

function normalizeSeries(
  data: number[],
  width: number,
  height: number,
  padding: number,
): Point[] {
  if (!data.length) {
    return [];
  }

  const minimum =
    Math.min(...data);

  const maximum =
    Math.max(...data);

  const span =
    maximum - minimum || 1;

  const usableWidth =
    Math.max(
      1,
      width - padding * 2,
    );

  const usableHeight =
    Math.max(
      1,
      height - padding * 2,
    );

  const stepX =
    usableWidth /
    Math.max(
      1,
      data.length - 1,
    );

  return data.map(
    (value, index) => ({
      x:
        padding +
        index * stepX,

      y:
        padding +
        usableHeight -
        ((value - minimum) / span) *
          usableHeight,
    }),
  );
}

function smoothSeries(
  data: number[],
  radius = 3,
): number[] {
  return data.map(
    (_, index) => {
      const start =
        Math.max(
          0,
          index - radius,
        );

      const end =
        Math.min(
          data.length,
          index + radius + 1,
        );

      const window =
        data.slice(
          start,
          end,
        );

      return (
        window.reduce(
          (sum, value) =>
            sum + value,
          0,
        ) /
        Math.max(
          1,
          window.length,
        )
      );
    },
  );
}

function createSmoothPath(
  points: Point[],
): string {
  if (!points.length) {
    return "";
  }

  if (points.length === 1) {
    return (
      `M ${points[0].x.toFixed(2)}` +
      ` ${points[0].y.toFixed(2)}`
    );
  }

  let path =
    `M ${points[0].x.toFixed(2)}` +
    ` ${points[0].y.toFixed(2)}`;

  for (
    let index = 1;
    index < points.length - 1;
    index += 1
  ) {
    const current =
      points[index];

    const next =
      points[index + 1];

    const middleX =
      (current.x + next.x) / 2;

    const middleY =
      (current.y + next.y) / 2;

    path +=
      ` Q ${current.x.toFixed(2)}` +
      ` ${current.y.toFixed(2)}` +
      ` ${middleX.toFixed(2)}` +
      ` ${middleY.toFixed(2)}`;
  }

  const previous =
    points[
      points.length - 2
    ];

  const last =
    points[
      points.length - 1
    ];

  path +=
    ` Q ${previous.x.toFixed(2)}` +
    ` ${previous.y.toFixed(2)}` +
    ` ${last.x.toFixed(2)}` +
    ` ${last.y.toFixed(2)}`;

  return path;
}

function createLinearPath(
  points: Point[],
): string {
  return points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}` +
        ` ${point.x.toFixed(2)}` +
        ` ${point.y.toFixed(2)}`,
    )
    .join(" ");
}

function createStepPath(
  points: Point[],
): string {
  if (!points.length) {
    return "";
  }

  let path =
    `M ${points[0].x.toFixed(2)}` +
    ` ${points[0].y.toFixed(2)}`;

  for (
    let index = 1;
    index < points.length;
    index += 1
  ) {
    const previous =
      points[index - 1];

    const current =
      points[index];

    const middleX =
      (previous.x + current.x) / 2;

    path +=
      ` H ${middleX.toFixed(2)}` +
      ` V ${current.y.toFixed(2)}` +
      ` H ${current.x.toFixed(2)}`;
  }

  return path;
}

function createAreaPath(
  linePath: string,
  points: Point[],
  height: number,
  padding: number,
): string {
  if (
    !linePath ||
    !points.length
  ) {
    return "";
  }

  const first =
    points[0];

  const last =
    points[
      points.length - 1
    ];

  const floor =
    height - padding;

  return (
    `${linePath} ` +
    `L ${last.x.toFixed(2)} ${floor.toFixed(2)} ` +
    `L ${first.x.toFixed(2)} ${floor.toFixed(2)} Z`
  );
}

function RuntimeGrid({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return (
    <g
      stroke="var(--lumina-border-standard)"
      strokeWidth="0.7"
      opacity="0.42"
    >
      {[0.25, 0.5, 0.75].map(
        (ratio) => (
          <line
            key={`horizontal-${ratio}`}
            x1="0"
            y1={height * ratio}
            x2={width}
            y2={height * ratio}
          />
        ),
      )}

      {[0.2, 0.4, 0.6, 0.8].map(
        (ratio) => (
          <line
            key={`vertical-${ratio}`}
            x1={width * ratio}
            y1="0"
            x2={width * ratio}
            y2={height}
          />
        ),
      )}
    </g>
  );
}

export function RuntimeSparkline({
  data,
  secondaryData = [],
  mode = "signal",
  width = 260,
  height = 64,
  stroke = "hsl(var(--cyan))",
  secondaryStroke =
    "hsl(var(--magenta))",
  fill =
    "hsl(var(--cyan) / 0.12)",
  className,
  label = "Runtime telemetry",
}: RuntimeSparklineProps) {
  const baseId =
    useId().replace(
      /:/g,
      "",
    );

  const gradientId =
    `${baseId}-gradient`;

  const glowId =
    `${baseId}-glow`;

  const padding = 4;

  const telemetry =
    useMemo(() => {
      const primarySource =
        mode === "memory"
          ? smoothSeries(
              data,
              4,
            )
          : data;

      const primaryPoints =
        normalizeSeries(
          primarySource,
          width,
          height,
          padding,
        );

      const secondaryPoints =
        normalizeSeries(
          secondaryData,
          width,
          height,
          padding,
        );

      const primaryPath =
        mode === "health"
          ? createStepPath(
              primaryPoints,
            )
          : mode === "cpu" ||
              mode === "throughput"
            ? createLinearPath(
                primaryPoints,
              )
            : createSmoothPath(
                primaryPoints,
              );

      const secondaryPath =
        createSmoothPath(
          secondaryPoints,
        );

      return {
        primaryPoints,
        secondaryPoints,
        primaryPath,
        secondaryPath,
        areaPath:
          createAreaPath(
            primaryPath,
            primaryPoints,
            height,
            padding,
          ),
        latest:
          primaryPoints[
            primaryPoints.length -
              1
          ] ?? null,
      };
    }, [
      data,
      height,
      mode,
      secondaryData,
      width,
    ]);

  const showArea =
    mode === "memory" ||
    mode === "signal";

  const showGrid =
    mode !== "health";

  const showPulse =
    mode === "health" ||
    mode === "cpu" ||
    mode === "service";

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
            stopOpacity="0.78"
          />

          <stop
            offset="100%"
            stopColor={fill}
            stopOpacity="0"
          />
        </linearGradient>

        <filter
          id={glowId}
          x="-40%"
          y="-80%"
          width="180%"
          height="260%"
        >
          <feGaussianBlur
            stdDeviation="2"
            result="blur"
          />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {showGrid && (
        <RuntimeGrid
          width={width}
          height={height}
        />
      )}

      {mode === "health" && (
        <line
          x1="0"
          y1={height * 0.72}
          x2={width}
          y2={height * 0.72}
          stroke="var(--lumina-border-standard)"
          strokeWidth="0.8"
          opacity="0.55"
        />
      )}

      {showArea &&
        telemetry.areaPath && (
          <path
            d={
              telemetry.areaPath
            }
            fill={`url(#${gradientId})`}
          />
        )}

      {mode === "throughput" ? (
        <g
          stroke={stroke}
          strokeLinecap="round"
          filter={`url(#${glowId})`}
        >
          {telemetry.primaryPoints.map(
            (point, index) => {
              const baseline =
                height - padding;

              const intensity =
                Math.max(
                  2,
                  baseline -
                    point.y,
                );

              return (
                <line
                  key={`${point.x}-${index}`}
                  x1={point.x}
                  y1={baseline}
                  x2={point.x}
                  y2={
                    baseline -
                    intensity
                  }
                  strokeWidth={
                    index % 3 === 0
                      ? 2.2
                      : 1.35
                  }
                  opacity={
                    index % 4 === 0
                      ? 0.95
                      : 0.58
                  }
                />
              );
            },
          )}
        </g>
      ) : (
        <>
          {telemetry.primaryPath && (
            <>
              <path
                d={
                  telemetry.primaryPath
                }
                fill="none"
                stroke={stroke}
                strokeWidth={
                  mode === "health"
                    ? 3.5
                    : 4
                }
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.16"
                filter={`url(#${glowId})`}
              />

              <path
                d={
                  telemetry.primaryPath
                }
                fill="none"
                stroke={stroke}
                strokeWidth={
                  mode === "health"
                    ? 1.45
                    : 1.75
                }
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#${glowId})`}
              />
            </>
          )}

          {mode === "service" &&
            telemetry.secondaryPath && (
              <>
                <path
                  d={
                    telemetry.secondaryPath
                  }
                  fill="none"
                  stroke={
                    secondaryStroke
                  }
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.12"
                  filter={`url(#${glowId})`}
                />

                <path
                  d={
                    telemetry.secondaryPath
                  }
                  fill="none"
                  stroke={
                    secondaryStroke
                  }
                  strokeWidth="1.35"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.82"
                />
              </>
            )}
        </>
      )}

      {showPulse &&
        telemetry.latest && (
          <>
            <circle
              cx={
                telemetry.latest.x
              }
              cy={
                telemetry.latest.y
              }
              r="4"
              fill={stroke}
              opacity="0.18"
            >
              <animate
                attributeName="r"
                values="3;6.5;3"
                dur={
                  mode === "health"
                    ? "2.6s"
                    : "1.8s"
                }
                repeatCount="indefinite"
              />

              <animate
                attributeName="opacity"
                values="0.42;0.08;0.42"
                dur={
                  mode === "health"
                    ? "2.6s"
                    : "1.8s"
                }
                repeatCount="indefinite"
              />
            </circle>

            <circle
              cx={
                telemetry.latest.x
              }
              cy={
                telemetry.latest.y
              }
              r="2"
              fill={stroke}
            />
          </>
        )}
    </svg>
  );
}

export default RuntimeSparkline;
