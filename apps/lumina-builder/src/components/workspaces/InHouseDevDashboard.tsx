import { useEffect } from "react";
import { ShieldCheck, Activity, Wrench, Hammer, Rocket, Lock } from "lucide-react";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { useWorkspace } from "@/context/WorkspaceContext";
import { canAccess } from "@/services/workspaceAccessService";
import { MobilePackagingCard } from "./inhouse/MobilePackagingCard";

const MODULES = [
  { id: "repo-audit", label: "Repo Audit", icon: Activity, status: "Live" },
  { id: "auto-fix", label: "Auto Fix", icon: Wrench, status: "Live" },
  { id: "fix-green", label: "Build Until Green", icon: Hammer, status: "Live" },
  { id: "deployment", label: "Deployment", icon: Rocket, status: "Live" },
  { id: "hardening", label: "Production Hardening", icon: ShieldCheck, status: "Live" },
];

export function InHouseDevDashboard() {
  const { setView, activeProject } = useWorkspace();
  const allowed = canAccess("inhouseDevDashboard");
  const projectId = activeProject?.id ?? "current";

  useEffect(() => {
    if (!allowed) setView("dashboard");
  }, [allowed, setView]);

  if (!allowed) {
    return (
      <div className="flex-1 grid place-items-center p-10">
        <div className="max-w-md text-center rounded-2xl border border-white/10 glass-panel p-8">
          <Lock className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
          <div className="font-display text-xl font-semibold mb-1">Super Admin only</div>
          <p className="text-[13px] text-muted-foreground">
            The In-House Dev dashboard is restricted to super admins with the
            <span className="font-mono"> inhouseDevDashboard</span> capability.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-10 md:py-14 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 anim-in">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gold/15 border border-gold/30 text-gold text-[10px] uppercase tracking-[0.18em] mb-2">
              <ShieldCheck className="h-2.5 w-2.5" /> Super Admin · Internal
            </div>
            <h1 className="font-display text-3xl md:text-[40px] font-semibold tracking-[-0.025em] leading-[1.05]">
              In-House Dev <span className="text-gradient-lumina">Console</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-[13px]">
              Premium internal tooling for the KoreLumina engineering team.
            </p>
          </div>
          <LuminaButton variant="ghost" onClick={() => setView("dashboard")}>← Back to Projects</LuminaButton>
        </div>

        {/* Module strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {MODULES.map((m) => {
            const Icon = m.icon;
            const isRepo = m.id === "repo-audit";
            return (
              <button
                key={m.id}
                onClick={() => isRepo && setView("repo-audit")}
                className="group rounded-xl border border-white/10 bg-surface-1/60 hover:bg-surface-2/60 hover:border-white/20 transition px-3 py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-gold" />
                  <div className="text-[12px] font-medium">{m.label}</div>
                </div>
                <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mt-1">{m.status}</div>
              </button>
            );
          })}
        </div>

        {/* Mobile Packaging module */}
        <MobilePackagingCard projectId={projectId} />
      </div>
    </div>
  );
}