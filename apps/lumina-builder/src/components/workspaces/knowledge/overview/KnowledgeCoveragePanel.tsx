export function KnowledgeCoveragePanel() {
  const rows = [
    ["Documentation", "72%"],
    ["Architecture", "68%"],
    ["Repositories", "81%"],
    ["Conversations", "12%"],
    ["Decisions", "64%"],
    ["Runtime evidence", "58%"],
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Coverage
      </div>

      <div className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium tabular-nums">{value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet to-cyan"
                style={{
                  width: value,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
