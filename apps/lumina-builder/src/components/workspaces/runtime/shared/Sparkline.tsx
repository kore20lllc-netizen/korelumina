/* MS-2026-0011: a measured series as a line; nothing drawn when nothing was measured. */
export function Sparkline({ values, max = 100, label, className = "text-cyan-300" }: { values: readonly number[]; max?: number; label: string; className?: string }) {
  if (values.length < 2) {
    return <div className="flex h-14 items-center text-[11px] text-sky-300/50">Collecting samples…</div>;
  }
  const width = 240;
  const height = 56;
  const top = Math.max(max, ...values, 1);
  const points = values.map((value, index) => `${((index / (values.length - 1)) * width).toFixed(1)},${(height - (Math.max(0, value) / top) * (height - 4) - 2).toFixed(1)}`);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={label} className={`h-14 w-full ${className}`}>
      <polyline points={`0,${height} ${points.join(" ")} ${width},${height}`} fill="currentColor" opacity={0.12} stroke="none" />
      <polyline points={points.join(" ")} fill="none" stroke="currentColor" strokeWidth={1.6} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}
