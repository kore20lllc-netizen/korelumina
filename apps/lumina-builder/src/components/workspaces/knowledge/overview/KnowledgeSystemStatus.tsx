export function KnowledgeSystemStatus() {
  const systems = [
    ["Acquisition", "Ready"],
    ["Compiler", "Pending"],
    ["Knowledge Graph", "Ready"],
    ["Retrieval", "Ready"],
    ["Learning", "Active"],
    ["Reasoning", "Queued"],
    ["Memory", "Synchronized"],
    ["Autonomous Improvement", "Governed"],
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Platform Health
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {systems.map(([label, status]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3"
          >
            <span className="text-[12px] font-medium">{label}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
