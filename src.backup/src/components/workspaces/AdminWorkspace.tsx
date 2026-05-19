import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkspace } from "@/context/WorkspaceContext";
import { getCurrentRole } from "@/services/workspaceAccessService";
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
import { auth } from "@/providers/registry";

const ADMIN_TAB_KEY = "korelumina:adminTab";
const TABS = ["overview","users","billing","projects","deployments","ai","flags","providers","logs","maintenance"] as const;
type AdminTab = typeof TABS[number];
const readTab = (): AdminTab => {
  if (typeof window === "undefined") return "overview";
  try {
    const v = window.localStorage.getItem(ADMIN_TAB_KEY) as AdminTab | null;
    if (v && (TABS as readonly string[]).includes(v)) return v;
  } catch {}
  return "overview";
};

export function AdminWorkspace() {
  const { setView } = useWorkspace();
  const [role, setRole] = useState(getCurrentRole());
  const [tab, setTab] = useState<AdminTab>(readTab);
  const onTabChange = (v: string) => {
    setTab(v as AdminTab);
    try { window.localStorage.setItem(ADMIN_TAB_KEY, v); } catch {}
  };

  useEffect(() => auth.onChange(() => setRole(getCurrentRole())), []);

  useEffect(() => {
    if (role !== "admin") setView("dashboard");
  }, [role, setView]);

  if (role !== "admin") {
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
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Super Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform-wide controls, analytics and maintenance.</p>
      </header>
      <Tabs value={tab} onValueChange={onTabChange} className="w-full">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="ai">AI Usage</TabsTrigger>
          <TabsTrigger value="flags">Feature Flags</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6"><OverviewTab /></TabsContent>
        <TabsContent value="users" className="mt-6"><UsersTab /></TabsContent>
        <TabsContent value="billing" className="mt-6"><BillingTab /></TabsContent>
        <TabsContent value="projects" className="mt-6"><ProjectsTab /></TabsContent>
        <TabsContent value="deployments" className="mt-6"><DeploymentsTab /></TabsContent>
        <TabsContent value="ai" className="mt-6"><AIUsageTab /></TabsContent>
        <TabsContent value="flags" className="mt-6"><FeatureFlagsTab /></TabsContent>
        <TabsContent value="providers" className="mt-6"><ProvidersTab /></TabsContent>
        <TabsContent value="logs" className="mt-6"><AuditLogsTab /></TabsContent>
        <TabsContent value="maintenance" className="mt-6"><MaintenanceTab /></TabsContent>
      </Tabs>
    </div>
  );
}