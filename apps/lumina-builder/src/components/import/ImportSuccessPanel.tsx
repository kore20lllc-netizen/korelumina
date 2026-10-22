import { CheckCircle2, FileCode2, Layers, Palette, Sparkles, ShieldCheck, ArrowRight, ClipboardCheck, LayoutTemplate } from "lucide-react";
import { ImportButton } from "./ImportButton";
import { TransformButton } from "@/components/transform/TransformButton";
import { useWorkspace } from "@/context/WorkspaceContext";
import { cn } from "@/lib/utils";

export interface DetectedRepo {
  framework: string;
  appType: string;
  pages: number;
  components: number;
  designScore: number;
}

interface Props {
  label: string;
  detected?: DetectedRepo;
  onOpenImports: () => void;
}

const DEFAULT_DETECTED: DetectedRepo = {
  framework: "Unknown",
  appType: "Imported repository",
  pages: 0,
  components: 0,
  designScore: 0,
};

/**
 * Premium "Repository Imported Successfully" screen — shown after import
 * finishes, before navigating to the imports list. Surfaces detected stats
 * and the suggested action set, including the gold-accented Transform CTA.
 */
export function ImportSuccessPanel({ label, detected = DEFAULT_DETECTED, onOpenImports }: Props) {
  const { setView, setMode } = useWorkspace();
  const scoreAccent =
    detected.designScore <= 0
      ? "text-sky-300/70"
      : detected.designScore >= 8
        ? "text-emerald-200"
        : detected.designScore >= 6.5
          ? "text-amber-200"
          : "text-rose-400";

  const pagesValue =
    detected.pages > 0
      ? String(detected.pages)
      : "Not scanned";

  const componentsValue =
    detected.components > 0
      ? String(detected.components)
      : "Not scanned";

  const designValue =
    detected.designScore > 0
      ? `${detected.designScore}/10`
      : "Not scored";

  return (
    <div className="space-y-5 anim-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[20px] border border-amber-300/30 p-5 bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,.14),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(217,119,6,.18),transparent_55%)]">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 grid place-items-center rounded-[14px] bg-emerald-400/15 text-emerald-200 border border-emerald-300/30 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-amber-400">Repository imported successfully</div>
            <div className="text-[12px] text-sky-300/70 truncate mt-0.5">{label}</div>
          </div>
        </div>
      </div>

      {/* Detection grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Stat icon={FileCode2} label="Framework" value={detected.framework} />
        <Stat icon={Layers}    label="Type"      value={detected.appType} />
        <Stat icon={Layers}    label="Pages"     value={pagesValue} />
        <Stat icon={Sparkles}  label="Components" value={componentsValue} />
        <Stat icon={Palette}   label="Design"    value={designValue} valueClassName={scoreAccent} accent="gold" />
      </div>

      {/* Suggested actions */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/80 mb-2">Suggested actions</div>
        <div className="grid sm:grid-cols-2 gap-2">
          <ActionRow
            icon={<LayoutTemplate className="h-3.5 w-3.5" />}
            title="Open in Builder"
            subtitle="Edit code with AI assist"
            onClick={() => { setMode("developer"); setView("workspace"); onOpenImports(); }}
          />
          <ActionRow
            icon={<Palette className="h-3.5 w-3.5" />}
            title="Open in Designer"
            subtitle="Tune layout & visuals"
            onClick={() => { setMode("designer"); setView("workspace"); onOpenImports(); }}
          />
          <ActionRow
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            title="Audit Architecture"
            subtitle="Find issues & repair plan"
            onClick={() => { setView("repo-audit"); onOpenImports(); }}
          />
          <ActionRow
            icon={<ClipboardCheck className="h-3.5 w-3.5" />}
            title="Generate Landing Page"
            subtitle="Single hero-first marketing page"
            onClick={() => { setMode("designer"); setView("workspace"); onOpenImports(); }}
          />
        </div>
      </div>

      {/* Premium transform CTA */}
      <div className="rounded-[20px] border border-amber-300/30 p-4 bg-gradient-to-br from-blue-500/15 via-violet-500/10 to-amber-400/15">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 grid place-items-center rounded-[14px] bg-amber-400/15 border border-amber-300/40 text-amber-200 shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[14px]">Transform App → Website</div>
            <p className="text-[12px] text-sky-300/70 mt-0.5">
              Generate a premium conversion-focused marketing site while preserving your application.
            </p>
          </div>
          <TransformButton
            source="import-success"
            detected={detected}
            label="Transform"
            size="sm"
            className="shrink-0"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <ImportButton variant="ghost" size="md" onClick={onOpenImports}>
          Go to imports <ArrowRight className="h-3.5 w-3.5" />
        </ImportButton>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon, label, value, accent, valueClassName,
}: {
  icon: typeof FileCode2;
  label: string;
  value: string;
  accent?: "gold";
  valueClassName?: string;
}) {
  return (
    <div className={cn(
      "rounded-[14px] border bg-slate-950/40 p-3",
      accent === "gold" ? "border-amber-300/30" : "border-cyan-300/15"
    )}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">
        <Icon className="h-3 w-3" />{label}
      </div>
      <div className={cn("font-semibold text-[14px] mt-1 truncate", valueClassName)}>{value}</div>
    </div>
  );
}

function ActionRow({ icon, title, subtitle, onClick }: { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 text-left p-3 rounded-[14px] border border-cyan-300/15 bg-slate-950/40 hover:bg-slate-900/70 hover:border-cyan-300/30 transition"
    >
      <span className="h-8 w-8 grid place-items-center rounded-[12px] bg-slate-900/70 text-sky-100/80 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium">{title}</div>
        <div className="text-[11px] text-sky-300/70 truncate">{subtitle}</div>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-sky-300/70" />
    </button>
  );
}