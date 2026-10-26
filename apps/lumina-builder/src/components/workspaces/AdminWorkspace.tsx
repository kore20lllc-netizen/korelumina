import { useEffect, useState } from "react";
import {
  Activity, Boxes, CreditCard, Flag, LayoutDashboard, Rocket,
  ScrollText, ServerCog, ShieldCheck, Users,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkspace } from "@/context/WorkspaceContext";
import { getCapabilities, getCurrentRole } from "@/services/workspaceAccessService";
import { OverviewTab } from "@/components/workspaces/admin/OverviewTab";
import { UsersTab } from "@/components/workspaces/admin/UsersTab";
import { BillingTab } from "@/components/workspaces/admin/BillingTab";
import { ProjectsTab } from "@/components/workspaces/admin/ProjectsTab";
import { DeploymentsTab } from "@/components/workspaces/admin/DeploymentsTab";
import { AIUsageTab } from "@/components/workspaces/admin/AIUsageTab";
import { FeatureFlagsTab } from "@/components/workspaces/admin/FeatureFlagsTab";
import { ProvidersTab } from "@/components/workspaces/admin/ProvidersTab";
import { AuditLogsTab } from "@/components/workspaces/admin/AuditLogsTab";
import { MaintenanceTab } from "@/components/workspaces/admin/MaintenanceTab";
import { auth } from "@/providers/auth-registry";

const ADMIN_TAB_KEY = "korelumina:adminTab";
const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "projects", label: "Projects", icon: Boxes },
  { id: "deployments", label: "Deployments", icon: Rocket },
  { id: "ai", label: "AI Usage", icon: Activity },
  { id: "flags", label: "Feature Flags", icon: Flag },
  { id: "providers", label: "Providers", icon: ServerCog },
  { id: "logs", label: "Audit Logs", icon: ScrollText },
  { id: "maintenance", label: "Maintenance", icon: ShieldCheck },
] as const;
type AdminTab = (typeof SECTIONS)[number]["id"];

function readTab(): AdminTab {
  if (typeof window === "undefined") return "overview";
  try {
    const stored = window.localStorage.getItem(ADMIN_TAB_KEY);
    const matched = SECTIONS.find((section) => section.id === stored);
    if (matched) return matched.id;
  } catch { /* Storage may be disabled. */ }
  return "overview";
}

export function AdminWorkspace() {
  const { setView } = useWorkspace();
  const [role, setRole] = useState(getCurrentRole());
  const [tab, setTab] = useState<AdminTab>(readTab);
  const canUseAdminTools = getCapabilities(role).adminTools;

  useEffect(() => auth.onChange(() => setRole(getCurrentRole())), []);
  useEffect(() => {
    if (!canUseAdminTools) setView("dashboard");
  }, [canUseAdminTools, setView]);

  function onTabChange(value: string) {
    const section = SECTIONS.find((item) => item.id === value);
    if (!section) return;
    setTab(section.id);
    try { window.localStorage.setItem(ADMIN_TAB_KEY, section.id); } catch { /* Storage may be disabled. */ }
  }

  if (!canUseAdminTools) {
    return (
      <div className="p-8">
        <div className="glass rounded-xl p-6 max-w-md mx-auto text-center">
          <h2 className="text-lg font-semibold mb-2">Admin only</h2>
          <p className="text-sm text-muted-foreground">Sign in as an administrator to access this workspace.</p>
        </div>
      </div>
    );
  }

  return (
    <section aria-label="Administration" className="relative flex h-full min-h-0 w-full flex-col overflow-x-hidden overflow-y-auto overscroll-contain bg-transparent text-white">
      <div className="relative z-30 px-6 pt-6">
        <header className="relative min-w-0 overflow-hidden rounded-[30px] border border-blue-400/70 bg-slate-950/[0.48] backdrop-blur-[44px] ring-1 ring-inset ring-cyan-300/20 shadow-[0_0_30px_rgba(37,99,235,.16),0_28px_160px_rgba(0,0,0,.40)]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_6%_8%,rgba(217,119,6,.20),transparent_30%),radial-gradient(circle_at_30%_70%,rgba(124,58,237,.22),transparent_34%)]" />
          <div className="relative z-10 flex flex-wrap items-center gap-5 px-8 py-8">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10 text-amber-200"><ShieldCheck className="h-7 w-7" aria-hidden="true" /></span>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-100/80">Platform Governance</span>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] md:text-5xl">
                <span className="text-gradient-lumina">Super</span>{" "}
                <span className="bg-gradient-to-r from-[#D9A441] via-[#B97A18] to-[#7A4B05] bg-clip-text text-transparent">Admin</span>
              </h1>
              <p className="mt-2 text-sm text-sky-300/70">Platform-wide controls, analytics and maintenance.</p>
            </div>
          </div>
        </header>
      </div>
      <Tabs value={tab} onValueChange={onTabChange} className="min-w-0">
        <nav aria-label="Administration sections" className="sticky top-4 z-40 px-6 pt-5">
          <TabsList className="flex h-auto w-full justify-start gap-2 overflow-x-auto rounded-[20px] border border-white/10 bg-slate-950/80 p-2 backdrop-blur-2xl">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <TabsTrigger key={id} value={id}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${tab === id ? "border-cyan-300/50 bg-cyan-400/10 text-cyan-100" : "border-white/10 text-sky-300/65 hover:border-white/30 hover:text-white"}`}>
                <Icon className="h-4 w-4" />{label}
              </TabsTrigger>
            ))}
          </TabsList>
        </nav>
        <main aria-label="Administration canvas" className="relative z-10 min-w-0 px-6 pb-6 pt-5">
          <TabsContent value="overview" className="mt-0"><OverviewTab /></TabsContent>
          <TabsContent value="users" className="mt-0"><UsersTab /></TabsContent>
          <TabsContent value="billing" className="mt-0"><BillingTab /></TabsContent>
          <TabsContent value="projects" className="mt-0"><ProjectsTab /></TabsContent>
          <TabsContent value="deployments" className="mt-0"><DeploymentsTab /></TabsContent>
          <TabsContent value="ai" className="mt-0"><AIUsageTab /></TabsContent>
          <TabsContent value="flags" className="mt-0"><FeatureFlagsTab /></TabsContent>
          <TabsContent value="providers" className="mt-0"><ProvidersTab /></TabsContent>
          <TabsContent value="logs" className="mt-0"><AuditLogsTab /></TabsContent>
          <TabsContent value="maintenance" className="mt-0"><MaintenanceTab /></TabsContent>
        </main>
      </Tabs>
    </section>
  );
}
