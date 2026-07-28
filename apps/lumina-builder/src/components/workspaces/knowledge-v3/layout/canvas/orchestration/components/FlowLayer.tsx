const STAGES = 5;

export function FlowLayer() {
  const centers = Array.from(
    { length: STAGES },
    (_, i) => ((i + 0.5) / STAGES) * 100,
  );

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient
          id="knowledge-flow"
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
        x1={centers[0]}
        y1="18"
        x2={centers[4]}
        y2="18"
        stroke="url(#knowledge-flow)"
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
