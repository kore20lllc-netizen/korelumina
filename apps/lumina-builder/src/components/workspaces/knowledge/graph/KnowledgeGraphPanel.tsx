import {
  BookOpenCheck,
  Boxes,
  Brain,
  Cpu,
  Database,
  GitBranch,
  Layers3,
  Maximize2,
  MousePointer2,
  Network,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Waypoints,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

import type {
  KnowledgeOperationsSnapshot,
} from "@korelumina/platform-sdk";

import {
  LuminaButton,
} from "@/components/lumina/LuminaButton";

interface Props {
  snapshot: KnowledgeOperationsSnapshot | null;
}

interface GraphStatistic {
  label: string;
  value: string;
  icon: LucideIcon;
}

interface LegendItem {
  label: string;
  icon: LucideIcon;
  accentClassName: string;
}

interface StatusItemProps {
  label: string;
  value: string;
  state?: "available" | "pending";
}

const LEGEND_ITEMS: LegendItem[] = [
  {
    label: "Repository",
    icon: GitBranch,
    accentClassName:
      "border-violet/30 bg-violet/10 text-violet-200",
  },
  {
    label: "Architecture",
    icon: Boxes,
    accentClassName:
      "border-cyan/30 bg-cyan/10 text-cyan-200",
  },
  {
    label: "Evidence",
    icon: Database,
    accentClassName:
      "border-magenta/30 bg-magenta/10 text-magenta-200",
  },
  {
    label: "Canonical",
    icon: BookOpenCheck,
    accentClassName:
      "border-gold/30 bg-gold/10 text-gold",
  },
  {
    label: "Runtime",
    icon: Cpu,
    accentClassName:
      "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  },
  {
    label: "Reasoning",
    icon: Brain,
    accentClassName:
      "border-blue-400/30 bg-blue-400/10 text-blue-200",
  },
];

function formatNumber(
  value: number | undefined,
): string {
  return value === undefined
    ? "—"
    : value.toLocaleString();
}

function GraphStatisticCard({
  label,
  value,
  icon: Icon,
}: GraphStatistic) {
  return (
    <div
      className={[
        "group flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-3",
        "transition-[border-color,background-color,box-shadow] duration-200",
        "[border-color:var(--lumina-border-standard)]",
        "[background:var(--lumina-surface-compact)]",
        "[box-shadow:var(--lumina-shadow-panel)]",
        "hover:[border-color:var(--lumina-border-emphasis)]",
        "hover:[background:var(--lumina-surface-interactive)]",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
          "transition-[border-color,background-color] duration-200",
          "[border-color:var(--lumina-border-standard)]",
          "[background:var(--lumina-surface-interactive)]",
          "group-hover:[border-color:var(--lumina-border-emphasis)]",
          "group-hover:[background:var(--lumina-surface-selected)]",
        ].join(" ")}
      >
        <Icon
          className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-cyan"
          strokeWidth={1.75}
        />
      </div>

      <div className="min-w-0">
        <div className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </div>

        <div className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
          {value}
        </div>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  value,
  state = "pending",
}: StatusItemProps) {
  const dotClassName =
    state === "available"
      ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]"
      : "bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.55)]";

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        aria-hidden="true"
        className={[
          "h-1.5 w-1.5 shrink-0 rounded-full",
          dotClassName,
        ].join(" ")}
      />

      <span className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>

      <span className="truncate text-[11px] font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

function EmptyGraphIllustration() {
  return (
    <div
      aria-hidden="true"
      className="relative h-48 w-48 shrink-0 sm:h-56 sm:w-56"
    >
      <div className="absolute inset-0 rounded-full bg-cyan/5 blur-3xl" />

      <svg
        viewBox="0 0 240 240"
        className="relative h-full w-full overflow-visible"
        fill="none"
      >
        <defs>
          <linearGradient
            id="knowledge-graph-line"
            x1="32"
            y1="34"
            x2="206"
            y2="202"
            gradientUnits="userSpaceOnUse"
          >
            <stop
              stopColor="hsl(var(--violet))"
              stopOpacity="0.72"
            />
            <stop
              offset="0.52"
              stopColor="hsl(var(--cyan))"
              stopOpacity="0.7"
            />
            <stop
              offset="1"
              stopColor="hsl(var(--magenta))"
              stopOpacity="0.62"
            />
          </linearGradient>

          <radialGradient
            id="knowledge-graph-node"
            cx="0"
            cy="0"
            r="1"
            gradientTransform="translate(0.35 0.28) rotate(45) scale(1)"
          >
            <stop
              stopColor="white"
              stopOpacity="0.95"
            />
            <stop
              offset="0.25"
              stopColor="hsl(var(--cyan))"
              stopOpacity="0.92"
            />
            <stop
              offset="1"
              stopColor="hsl(var(--violet))"
              stopOpacity="0.38"
            />
          </radialGradient>

          <filter
            id="knowledge-graph-glow"
            x="-60%"
            y="-60%"
            width="220%"
            height="220%"
          >
            <feGaussianBlur
              stdDeviation="5"
              result="blur"
            />

            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx="120"
          cy="120"
          r="96"
          stroke="hsl(var(--cyan))"
          strokeOpacity="0.08"
          strokeDasharray="4 8"
        />

        <circle
          cx="120"
          cy="120"
          r="68"
          stroke="hsl(var(--violet))"
          strokeOpacity="0.08"
          strokeDasharray="3 7"
        />

        <path
          d="M60 77L111 119L169 67M111 119L181 158M111 119L72 174M72 174L181 158M60 77L72 174M169 67L181 158"
          stroke="url(#knowledge-graph-line)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeOpacity="0.72"
        />

        <path
          d="M60 77L181 158"
          stroke="hsl(var(--cyan))"
          strokeWidth="1"
          strokeOpacity="0.18"
          strokeDasharray="4 6"
        />

        <path
          d="M169 67L72 174"
          stroke="hsl(var(--magenta))"
          strokeWidth="1"
          strokeOpacity="0.15"
          strokeDasharray="4 6"
        />

        {[
          [60, 77, 10],
          [111, 119, 14],
          [169, 67, 10],
          [181, 158, 11],
          [72, 174, 10],
        ].map(([cx, cy, radius]) => (
          <g
            key={`${cx}-${cy}`}
            filter="url(#knowledge-graph-glow)"
          >
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="url(#knowledge-graph-node)"
              stroke="white"
              strokeOpacity="0.24"
            />

            <circle
              cx={cx}
              cy={cy}
              r={radius + 6}
              stroke="hsl(var(--cyan))"
              strokeOpacity="0.1"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

function GraphMinimap() {
  return (
    <div
      aria-label="Graph minimap"
      className={[
        "absolute bottom-4 left-4 hidden h-[104px] w-[148px] overflow-hidden rounded-2xl border p-3 sm:block",
        "[border-color:var(--lumina-border-standard)]",
        "[background:var(--lumina-surface-panel)]",
        "[box-shadow:var(--lumina-shadow-panel)]",
        "[backdrop-filter:var(--lumina-blur-surface)]",
      ].join(" ")}
    >
      <div
        className={[
          "absolute inset-0 opacity-60",
          "[background-image:linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)]",
          "[background-size:12px_12px]",
        ].join(" ")}
      />

      <div className="relative flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Minimap
        </span>

        <span className="text-[9px] font-medium text-muted-foreground">
          Awaiting graph
        </span>
      </div>

      <div className="relative mt-3 h-12 rounded-lg border border-dashed border-white/10 bg-black/10">
        <div className="absolute left-[28%] top-[22%] h-7 w-14 rounded-md border border-cyan/25 bg-cyan/5" />
      </div>
    </div>
  );
}

function GraphLegend() {
  return (
    <aside
      aria-label="Knowledge graph legend"
      className={[
        "absolute right-4 top-4 hidden w-[180px] rounded-2xl border p-3 lg:block",
        "[border-color:var(--lumina-border-standard)]",
        "[background:var(--lumina-surface-panel)]",
        "[box-shadow:var(--lumina-shadow-panel)]",
        "[backdrop-filter:var(--lumina-blur-surface)]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Entity legend
        </span>

        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[8px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Contract
        </span>
      </div>

      <div className="mt-3 grid gap-2">
        {LEGEND_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="flex items-center gap-2"
            >
              <span
                className={[
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border",
                  item.accentClassName,
                ].join(" ")}
              >
                <Icon
                  className="h-3 w-3"
                  strokeWidth={1.8}
                />
              </span>

              <span className="truncate text-[10px] font-medium text-foreground/90">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export function KnowledgeGraphPanel({
  snapshot,
}: Props) {
  const statistics: GraphStatistic[] = [
    {
      label: "Nodes",
      value: formatNumber(
        snapshot?.summary.totalKnowledgeItems,
      ),
      icon: Network,
    },
    {
      label: "Edges",
      value: "—",
      icon: Waypoints,
    },
    {
      label: "Connected components",
      value: "—",
      icon: Layers3,
    },
    {
      label: "Selected",
      value: "—",
      icon: MousePointer2,
    },
  ];

  return (
    <section
      aria-label="Knowledge Graph workspace"
      className={[
        "flex h-full min-h-[760px] min-w-0 flex-col overflow-hidden rounded-[32px] border",
        "[border-color:var(--lumina-border-standard)]",
        "[background:var(--lumina-surface-panel)]",
        "[box-shadow:var(--lumina-shadow-panel)]",
      ].join(" ")}
    >
      <header
        className={[
          "flex flex-col gap-4 border-b px-5 py-5",
          "items-stretch",
          "[border-color:var(--lumina-border-standard)]",
          "[background:var(--lumina-surface-compact)]",
          "[backdrop-filter:var(--lumina-blur-surface)]",
        ].join(" ")}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div
              className={[
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border",
                "[border-color:var(--lumina-border-emphasis)]",
                "[background:var(--lumina-surface-selected)]",
                "[box-shadow:var(--lumina-shadow-selected)]",
              ].join(" ")}
            >
              <Network
                className="h-5 w-5 text-cyan"
                strokeWidth={1.75}
              />
            </div>

            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan">
                Intelligence topology
              </div>

              <h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-foreground">
                Knowledge Graph
              </h2>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <label className="relative min-w-[180px] flex-[1_1_240px]">
            <span className="sr-only">
              Search graph entities
            </span>

            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.75}
            />

            <input
              type="search"
              disabled
              placeholder="Search entities…"
              title="Graph search becomes available when the Knowledge Graph Service is connected."
              className={[
                "h-9 w-full rounded-xl border pl-9 pr-3 text-xs text-foreground outline-none",
                "disabled:cursor-not-allowed disabled:opacity-70",
                "[border-color:var(--lumina-border-standard)]",
                "[background:var(--lumina-surface-interactive)]",
                "placeholder:text-muted-foreground",
              ].join(" ")}
            />
          </label>

          <LuminaButton
            type="button"
            variant="toolbar"
            size="sm"
            disabled
            title="Graph filters become available when the Knowledge Graph Service is connected."
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </LuminaButton>

          <select
            aria-label="Graph layout"
            disabled
            defaultValue="force"
            title="Graph layouts become available when the rendering engine is connected."
            className={[
              "h-9 rounded-xl border px-3 text-xs text-foreground outline-none",
              "disabled:cursor-not-allowed disabled:opacity-70",
              "[border-color:var(--lumina-border-standard)]",
              "[background:var(--lumina-surface-interactive)]",
            ].join(" ")}
          >
            <option value="force">
              Force layout
            </option>

            <option value="hierarchy">
              Hierarchy
            </option>

            <option value="radial">
              Radial
            </option>
          </select>

          <div
            className={[
              "flex items-center gap-1 rounded-xl border p-1",
              "[border-color:var(--lumina-border-standard)]",
              "[background:var(--lumina-surface-interactive)]",
            ].join(" ")}
          >
            <LuminaButton
              type="button"
              variant="ghost"
              size="icon"
              disabled
              aria-label="Zoom out"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </LuminaButton>

            <LuminaButton
              type="button"
              variant="ghost"
              size="icon"
              disabled
              aria-label="Zoom in"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </LuminaButton>

            <LuminaButton
              type="button"
              variant="ghost"
              size="icon"
              disabled
              aria-label="Fit graph to viewport"
              title="Fit graph to viewport"
            >
              <Maximize2 className="h-4 w-4" />
            </LuminaButton>

            <LuminaButton
              type="button"
              variant="ghost"
              size="icon"
              disabled
              aria-label="Reset graph viewport"
              title="Reset graph viewport"
            >
              <RotateCcw className="h-4 w-4" />
            </LuminaButton>
          </div>
        </div>
      </header>

      <div
        aria-label="Knowledge graph statistics"
        className={[
          "grid grid-cols-2 gap-3 border-b px-5 py-4",
          "sm:grid-cols-2",
          "[border-color:var(--lumina-border-standard)]",
          "[background:var(--lumina-surface-panel)]",
        ].join(" ")}
      >
        {statistics.map((statistic) => (
          <GraphStatisticCard
            key={statistic.label}
            {...statistic}
          />
        ))}
      </div>

      <div className="relative min-h-[560px] flex-1 overflow-hidden">
        <div
          aria-hidden="true"
          className={[
            "absolute inset-0",
            "[background-image:linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)]",
            "[background-size:32px_32px]",
          ].join(" ")}
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 [background:radial-gradient(circle_at_50%_42%,rgba(34,211,238,0.08),transparent_32%),radial-gradient(circle_at_28%_72%,rgba(139,92,246,0.07),transparent_28%),radial-gradient(circle_at_78%_24%,rgba(217,70,239,0.05),transparent_26%)]"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 [background:linear-gradient(to_bottom,transparent_58%,rgba(0,0,0,0.18))]"
        />

        <div className="relative z-10 flex min-h-[560px] h-full items-center justify-center px-6 py-16 sm:px-10">
          <div className="flex w-full max-w-[520px] flex-col items-center text-center">
            <EmptyGraphIllustration />

            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/5 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              Knowledge Graph Service pending
            </div>

            <h3 className="mt-5 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              The graph contract is ready for authoritative knowledge
            </h3>

            <p className="mt-3 max-w-[560px] text-pretty text-sm leading-6 text-muted-foreground">
              Connect the governed Knowledge Graph Service to render
              canonical entities, evidence provenance, relationships,
              architecture lineage, runtime observations, and Chief Agent
              consumption paths.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <LuminaButton
                type="button"
                variant="primary"
                size="sm"
                disabled
                title="Evidence acquisition will be enabled after authoritative service wiring."
              >
                <Database className="h-3.5 w-3.5" />
                Acquire evidence
              </LuminaButton>

              <LuminaButton
                type="button"
                variant="toolbar"
                size="sm"
                disabled
                title="Provider configuration will be enabled after authoritative service wiring."
              >
                <GitBranch className="h-3.5 w-3.5" />
                Configure sources
              </LuminaButton>
            </div>

            <div
              className={[
                "mt-6 flex max-w-full flex-wrap items-center justify-center gap-x-4 gap-y-2",
                "rounded-2xl border px-4 py-3",
                "[border-color:var(--lumina-border-standard)]",
                "[background:var(--lumina-surface-compact)]",
              ].join(" ")}
            >
              {[
                "Acquire evidence",
                "Govern knowledge",
                "Compile graph",
              ].map((step, index) => (
                <div
                  key={step}
                  className="flex min-w-0 items-center gap-2"
                >
                  <span
                    className={[
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      "text-[9px] font-semibold tabular-nums text-cyan",
                      "[border-color:var(--lumina-border-emphasis)]",
                      "[background:var(--lumina-surface-selected)]",
                    ].join(" ")}
                  >
                    {index + 1}
                  </span>

                  <span className="whitespace-nowrap text-[10px] font-medium text-muted-foreground">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <GraphMinimap />
        <GraphLegend />
      </div>

      <footer
        className={[
          "grid gap-3 border-t px-5 py-3",
          "sm:grid-cols-2",
          "[border-color:var(--lumina-border-standard)]",
          "[background:var(--lumina-surface-compact)]",
          "[backdrop-filter:var(--lumina-blur-surface)]",
        ].join(" ")}
      >
        <StatusItem
          label="Render mode"
          value="Authoritative"
          state="available"
        />

        <StatusItem
          label="Synchronization"
          value="Not connected"
        />

        <StatusItem
          label="Rendering engine"
          value="Not mounted"
        />

        <StatusItem
          label="Runtime status"
          value="Awaiting graph service"
        />
      </footer>
    </section>
  );
}

export default KnowledgeGraphPanel;
