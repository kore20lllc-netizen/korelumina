import { useState } from "react";
import { Check, Minus, ShieldCheck, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCurrentRole } from "@/hooks/use-current-role";
import {
  getCapabilities,
  type WorkspaceCapabilities,
  type WorkspaceRole,
} from "@/services/workspaceAccessService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { resetAllData } from "@/services/adminService";

const ROLES: { id: WorkspaceRole; label: string; description: string }[] = [
  { id: "user",        label: "User",         description: "Free tier. Core build tools only." },
  { id: "pro",         label: "Pro",          description: "Pro tier. Core build tools only." },
  { id: "business",    label: "Business",     description: "Team tier. Collaboration and shared workspaces." },
  { id: "enterprise",  label: "Enterprise",   description: "Enterprise tier. Includes enterprise preview controls." },
  { id: "inhouse-dev", label: "In-house dev", description: "Internal engineering tools, diagnostics, and repair surfaces." },
  { id: "admin",       label: "Admin",        description: "Platform operations: users, billing, projects, providers, and audit logs." },
  { id: "super_admin", label: "Super admin",  description: "Platform owner. Full access to admin and internal engineering surfaces." },
];

const CAPS: { key: keyof WorkspaceCapabilities; label: string }[] = [
  { key: "dashboard",              label: "Dashboard" },
  { key: "designer",               label: "Designer" },
  { key: "developer",              label: "Developer" },
  { key: "ai",                     label: "AI" },
  { key: "repoAudit",              label: "Repo audit" },
  { key: "securityAudit",          label: "Security audit" },
  { key: "repairConsole",          label: "Repair console" },
  { key: "deploymentDiagnostics",  label: "Deployment diagnostics" },
  { key: "adminTools",             label: "Admin tools" },
];

export function RoleSwitcher() {
  const [role, setRole] = useCurrentRole();
  const caps = getCapabilities(role);
  const current = ROLES.find((r) => r.id === role)!;
  const [pendingRole, setPendingRole] = useState<WorkspaceRole | null>(null);

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resettingMockData, setResettingMockData] = useState(false);


  const applyRole = (next: WorkspaceRole) => {
    setRole(next);
    const label = ROLES.find((r) => r.id === next)?.label ?? next;
    toast.success(`Role switched to ${label}`);
  };

  return (
    <div className="rounded-xl bg-surface-1 border border-border p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-lumina)" }}>
          <ShieldCheck className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <div className="text-[12px] uppercase tracking-widest text-muted-foreground">Role (testing)</div>
          <div className="text-[13px] font-medium mt-0.5">{current.label}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{current.description}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {ROLES.map((r) => {
          const active = r.id === role;
          return (
            <button
              key={r.id}
              onClick={() => {
                if (r.id === role) return;
                if (r.id === "inhouse-dev" || r.id === "admin" || r.id === "super_admin") {
                  setPendingRole(r.id);
                  return;
                }
                applyRole(r.id);
              }}
              className={cn(
                "h-8 px-3 rounded-full text-[12px] border transition",
                active
                  ? "bg-surface-3 text-foreground border-brand"
                  : "bg-surface-1 text-muted-foreground border-border hover:text-foreground hover:border-white/20",
              )}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {CAPS.map((c) => {
          const on = caps[c.key];
          return (
            <div key={c.key} className="flex items-center gap-2 text-[12px]">
              {on ? (
                <Check className="h-3.5 w-3.5 text-cyan" />
              ) : (
                <Minus className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className={on ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
            </div>
          );
        })}
      </div>

      <AlertDialog open={pendingRole !== null} onOpenChange={(open) => { if (!open) setPendingRole(null); }}>
        <AlertDialogContent className="glass-strong border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to privileged role?</AlertDialogTitle>
            <AlertDialogDescription>
              This grants privileged access for testing protected platform surfaces. Only switch
              if you intend to test admin, super-admin, diagnostics, or internal engineering tools.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (pendingRole) applyRole(pendingRole); setPendingRole(null); }}>
              Grant super admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="pt-3 border-t border-border flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-[12px] text-muted-foreground">Reset local mock data</div>
          <div className="text-[10px] text-muted-foreground/70">Clears projects, usage, billing, and notifications.</div>
        </div>
        <button
          onClick={() => {
            setResetDialogOpen(
              true,
            );
          }}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[11px] border border-border bg-surface-1 hover:text-foreground text-muted-foreground transition"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>
      <ResetMockDataDialog
        open={resetDialogOpen}
        resetting={resettingMockData}
        onOpenChange={(open) => {
          if (!resettingMockData) {
            setResetDialogOpen(open);
          }
        }}
        onConfirm={async () => {
          try {
            setResettingMockData(
              true,
            );

            toast(
              "Resetting…",
            );

            const mod = await import(
              "@/lib/seed"
            );

            mod.resetAllData();

            setResetDialogOpen(
              false,
            );
          } finally {
            setResettingMockData(
              false,
            );
          }
        }}
      />
    </div>
  );
}
