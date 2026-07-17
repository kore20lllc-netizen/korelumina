import type {
  LucideIcon,
} from "lucide-react";

import {
  CheckCircle2,
  CircleDot,
  ServerCog,
} from "lucide-react";

import {
  LuminaWorkspacePanel,
} from "@/components/lumina/workspace";

export interface KnowledgeContractWorkspaceProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  capabilities: string[];
}

export function KnowledgeContractWorkspace({
  eyebrow,
  title,
  description,
  icon: Icon,
  capabilities,
}: KnowledgeContractWorkspaceProps) {
  return (
    <LuminaWorkspacePanel className="min-h-[640px] p-0">
      <header
        className={[
          "flex flex-col gap-5 border-b px-6 py-6",
          "lg:flex-row lg:items-center lg:justify-between",
          "[border-color:var(--lumina-border-standard)]",
          "[background:var(--lumina-surface-compact)]",
        ].join(" ")}
      >
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={[
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border",
              "[border-color:var(--lumina-border-emphasis)]",
              "[background:var(--lumina-surface-selected)]",
              "[box-shadow:var(--lumina-shadow-selected)]",
            ].join(" ")}
          >
            <Icon
              className="h-5 w-5 text-cyan"
              strokeWidth={1.75}
            />
          </div>

          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan">
              {eyebrow}
            </div>

            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              {title}
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <div
          className={[
            "inline-flex shrink-0 items-center gap-2 self-start rounded-full border px-3 py-2",
            "text-[10px] font-semibold uppercase tracking-[0.16em]",
            "border-emerald-400/20 bg-emerald-400/5 text-emerald-200",
          ].join(" ")}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          UI contract established
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section
          aria-label={`${title} operational region`}
          className={[
            "relative min-h-[420px] overflow-hidden rounded-[28px] border",
            "[border-color:var(--lumina-border-standard)]",
            "[background:var(--lumina-surface-panel)]",
          ].join(" ")}
        >
          <div
            aria-hidden="true"
            className={[
              "absolute inset-0 opacity-60",
              "[background-image:linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)]",
              "[background-size:32px_32px]",
            ].join(" ")}
          />

          <div
            aria-hidden="true"
            className="absolute inset-0 [background:radial-gradient(circle_at_50%_45%,rgba(34,211,238,0.08),transparent_34%),radial-gradient(circle_at_20%_85%,rgba(124,92,255,0.06),transparent_30%)]"
          />

          <div className="relative flex min-h-[420px] items-center justify-center px-6 py-12">
            <div className="max-w-md text-center">
              <div
                className={[
                  "mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border",
                  "[border-color:var(--lumina-border-emphasis)]",
                  "[background:var(--lumina-surface-selected)]",
                  "[box-shadow:var(--lumina-shadow-selected)]",
                ].join(" ")}
              >
                <ServerCog
                  className="h-7 w-7 text-cyan"
                  strokeWidth={1.6}
                />
              </div>

              <h3 className="mt-6 text-xl font-semibold tracking-tight">
                Awaiting authoritative service
              </h3>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                The production interface contract is ready for governed
                runtime integration. No synthetic records or inferred
                operational state are displayed.
              </p>
            </div>
          </div>
        </section>

        <aside
          aria-label={`${title} capabilities`}
          className={[
            "flex flex-col rounded-[28px] border",
            "[border-color:var(--lumina-border-standard)]",
            "[background:var(--lumina-surface-compact)]",
          ].join(" ")}
        >
          <div className="border-b px-5 py-5 [border-color:var(--lumina-border-standard)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Operational contract
            </div>

            <h3 className="mt-2 text-lg font-semibold">
              Reserved capabilities
            </h3>
          </div>

          <div className="flex-1 space-y-2 p-4">
            {capabilities.map((capability) => (
              <div
                key={capability}
                className={[
                  "flex items-center gap-3 rounded-2xl border px-3 py-3",
                  "[border-color:var(--lumina-border-standard)]",
                  "[background:var(--lumina-surface-interactive)]",
                ].join(" ")}
              >
                <CircleDot
                  className="h-3.5 w-3.5 shrink-0 text-cyan"
                  strokeWidth={1.8}
                />

                <span className="text-xs font-medium text-foreground/90">
                  {capability}
                </span>
              </div>
            ))}
          </div>

          <footer className="border-t px-5 py-4 [border-color:var(--lumina-border-standard)]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Integration
              </span>

              <span className="text-[11px] font-medium text-amber-200">
                Runtime pending
              </span>
            </div>
          </footer>
        </aside>
      </div>
    </LuminaWorkspacePanel>
  );
}

export default KnowledgeContractWorkspace;
