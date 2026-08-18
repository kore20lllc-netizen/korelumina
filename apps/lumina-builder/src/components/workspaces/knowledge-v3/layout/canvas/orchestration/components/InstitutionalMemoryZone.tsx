export function InstitutionalMemoryZone() {
  import {
  KNOWLEDGE_PACKAGES,
} from "../data/knowledgePackages";

const domains = [
    {
      name: "Architecture",
      confidence: 96,
      freshness: "Fresh",
      relationships: 184,
    },
    {
      name: "Runtime",
      confidence: 93,
      freshness: "Stable",
      relationships: 142,
    },
    {
      name: "Security",
      confidence: 88,
      freshness: "Needs Review",
      relationships: 91,
    },
    {
      name: "Knowledge Compiler",
      confidence: 97,
      freshness: "Fresh",
      relationships: 213,
    },
  ];

  return (
    <section
      className="
        mt-8
        rounded-3xl
        border
        border-emerald-300/20
        bg-gradient-to-br
        from-emerald-500/[0.06]
        via-slate-950
        to-cyan-950/40
        p-6
      "
    >
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-300/80">
            Institutional Memory
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-white">
            Living Organizational Intelligence
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Canonical knowledge is continuously integrated into the institutional knowledge graph and remains available for future learning, validation, and refresh.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/[0.08] px-5 py-4 text-right">
          <div className="text-3xl font-semibold text-emerald-200">
            742
          </div>

          <div className="mt-1 text-xs uppercase tracking-[0.24em] text-emerald-300/75">
            Canonical Nodes
          </div>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-4">
        {domains.map((domain) => {
  const count =
    KNOWLEDGE_PACKAGES.filter(
      (pkg) =>
        pkg.institutionalDomain ===
        domain.name,
    ).length;

  return (
          <article
            key={domain.name}
            className="
              rounded-2xl
              border
              border-white/[0.08]
              bg-white/[0.03]
              p-4
            "
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">
                {domain.name}
              </h3>

              <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-emerald-200">
                {domain.freshness}
              </span>
            </div>

            <div className="mt-5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Confidence</span>
                <span>{domain.confidence}%</span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-300"
                  style={{
                    width: `${domain.confidence}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-sm">
              <span className="text-slate-400">
                Relationships
              </span>

              <span className="font-medium text-white">
                {domain.relationships}

              <div className="mt-2 text-xs text-cyan-300/80">
                {count} linked package{count === 1 ? "" : "s"}
              </div>
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
})
}
