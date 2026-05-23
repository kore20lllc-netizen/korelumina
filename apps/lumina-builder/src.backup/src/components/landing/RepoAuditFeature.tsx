import { useReveal } from "@/hooks/use-reveal";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { goToRepoAudit, contactSales } from "@/services/navigationService";
import { canAccess } from "@/services/workspaceAccessService";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PackageSearch,
  AlertTriangle,
  KeyRound,
  ShieldCheck,
  Wand2,
  Zap,
  ArrowRight,
  Github,
  ScanLine,
  FileText,
  ListChecks,
  Wrench,
} from "lucide-react";

const cards = [
  { icon: PackageSearch, title: "Missing Dependencies Detection", body: "Surface packages the project needs but never installs." },
  { icon: AlertTriangle, title: "Build & Type Error Analysis", body: "Trace failing builds and TypeScript errors to their root cause." },
  { icon: KeyRound, title: "Environment Variable Discovery", body: "Identify required env vars and flag missing values." },
  { icon: ShieldCheck, title: "Security & Architecture Review", body: "Detect vulnerable patterns and risky architectural choices." },
  { icon: Wand2, title: "AI-Generated Repair Plan", body: "Receive a prioritized, step-by-step plan to restore the project." },
  { icon: Zap, title: "One-Click Fix Application", body: "Apply repairs from the plan without leaving the workspace." },
];

const workflow = [
  { icon: Github, label: "GitHub Repo" },
  { icon: ScanLine, label: "Automated Audit" },
  { icon: FileText, label: "Technical Report" },
  { icon: ListChecks, label: "Repair Plan" },
  { icon: Wrench, label: "Apply Fixes" },
];

export function RepoAuditFeature() {
  const ref = useReveal<HTMLDivElement>();
  const canRun = canAccess("repoAudit");
  return (
    <section id="repo-audit" className="py-24 md:py-32 px-6">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0">
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina mb-3">Repo Audit Engine</p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-gradient-royal-gold">
            Import Any Repository. Instantly Understand What's Broken.
          </h2>
          <p className="text-muted-foreground leading-relaxed mt-5">
            KoreLumina analyzes dependencies, build failures, type errors, environment requirements, and security issues,
            then generates a step-by-step repair plan.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="glass-panel-landing rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 hover:border-white/20"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "var(--gradient-lumina)" }}
              >
                <Icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* Workflow visualization */}
        <div className="relative glass-panel-landing rounded-3xl p-6 md:p-10 mt-10">
          <div
            className="absolute -inset-px rounded-3xl pointer-events-none"
            style={{ background: "var(--gradient-lumina)", opacity: 0.08, filter: "blur(40px)" }}
            aria-hidden
          />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina mb-6 text-center">
              How it flows
            </p>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {workflow.map(({ icon: Icon, label }, i) => (
                <div key={label} className="flex items-center gap-3 md:flex-col md:gap-2 md:flex-1">
                  <div className="flex items-center gap-3 md:flex-col md:gap-2">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 bg-white/[0.04]"
                      style={{ boxShadow: "var(--glow-violet)" }}
                    >
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    <span className="text-sm font-medium tracking-tight text-center">{label}</span>
                  </div>
                  {i < workflow.length - 1 && (
                    <ArrowRight className="hidden md:block w-4 h-4 text-muted-foreground md:absolute md:static" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-10">
          {canRun ? (
            <LuminaButton variant="primary" size="lg" onClick={goToRepoAudit}>
              Run a Repo Audit
            </LuminaButton>
          ) : (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* Wrap the disabled button in a span so the tooltip trigger
                      still receives pointer events (disabled buttons swallow them). */}
                  <span
                    tabIndex={0}
                    role="button"
                    aria-disabled="true"
                    aria-describedby="repo-audit-locked-reason"
                    onClick={contactSales}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        contactSales();
                      }
                    }}
                    className="inline-flex flex-col items-center gap-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
                  >
                    <LuminaButton
                      variant="primary"
                      size="lg"
                      disabled
                      aria-label="Run a Repo Audit (requires repoAudit capability)"
                      tabIndex={-1}
                    >
                      Run a Repo Audit
                    </LuminaButton>
                    <p
                      id="repo-audit-locked-reason"
                      className="text-xs text-muted-foreground"
                    >
                      Requires the <span className="font-mono text-foreground/80">repoAudit</span> capability.
                    </p>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                  <p className="font-medium text-foreground mb-1">Repo Audit is unavailable</p>
                  <p className="text-muted-foreground">
                    Your account doesn't include the <span className="font-mono">repoAudit</span> capability.
                    It's available on Business and Enterprise plans, or with an active in-house developer engagement.
                  </p>
                  <button
                    type="button"
                    onClick={contactSales}
                    className="mt-2 inline-flex items-center gap-1 text-cyan hover:text-cyan/80 underline-offset-2 hover:underline"
                  >
                    Contact sales to unlock →
                  </button>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </section>
  );
}