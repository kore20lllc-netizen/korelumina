export interface LuminaFlowConnectorProps {
  stageCount?: number;
}

export function LuminaFlowConnector({
  stageCount = 5,
}: LuminaFlowConnectorProps) {
  const centers = Array.from(
    { length: stageCount },
    (_, index) =>
      ((index + 0.5) / stageCount) * 100,
  );

  const firstCenter =
    centers[0] ?? 0;

  const lastCenter =
    centers[centers.length - 1] ?? 100;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient
          id="lumina-flow-connector"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop
            offset="0%"
            stopColor="rgb(34 211 238 / 0.18)"
          />

          <stop
            offset="50%"
            stopColor="rgb(34 211 238 / 0.42)"
          />

          <stop
            offset="100%"
            stopColor="rgb(34 211 238 / 0.18)"
          />
        </linearGradient>
      </defs>

      <line
        x1={firstCenter}
        y1="18"
        x2={lastCenter}
        y2="18"
        stroke="url(#lumina-flow-connector)"
        strokeWidth="0.45"
      />

      {centers.map((x) => (
        <g key={x}>
          <circle
            cx={x}
            cy="18"
            r="0.9"
            fill="rgb(34 211 238 / 0.9)"
          />

          <circle
            cx={x}
            cy="18"
            r="1.8"
            fill="none"
            stroke="rgb(34 211 238 / 0.25)"
            strokeWidth="0.25"
          />
        </g>
      ))}
    </svg>
  );
}
