import { useState } from "react";
import { CreditCard, Link2, Settings2, ShieldCheck, User, Users, Wrench, type LucideIcon } from "lucide-react";

import { ExecutivePremiumIcon } from "@/components/design-system/executive/ExecutivePremiumIcon";
import { useCurrentUser } from "@/hooks/use-auth";
import { useCurrentRole } from "@/hooks/use-current-role";
import { cn } from "@/lib/utils";
import { takeConnectionReturnOpen } from "@/services/runtime/connections";
import { planForRole, roleSwitchingAllowed } from "@/services/workspaceAccessService";

import { DesignPreviewBadge } from "../executive/shared/ExecutiveSection";
import { ConnectedAccountsSection } from "./sections/ConnectedAccountsSection";
import { DeveloperToolsSection, PlanSection, ProfileSection, SecuritySection, TeamSection } from "./sections/AccountSections";
import { useConnectedAccounts } from "./state/useConnectedAccounts";

/*
 * MS-2026-0011: Settings in the Knowledge Operations design, with only
 * what is real. Connected accounts (MS-2026-0016) opens first when the
 * person returns from GitHub, Supabase or Vercel.
 */

type SectionId = "profile" | "plan" | "connections" | "security" | "team" | "developer";

const STAFF: Record<string, string> = { "inhouse-dev": "In-house engineer", admin: "Admin", super_admin: "Super admin" };

export function SettingsWorkspace() {
  const user = useCurrentUser();
  const [role] = useCurrentRole();
  const accounts = useConnectedAccounts();
  const [section, setSection] = useState<SectionId>(() => (takeConnectionReturnOpen() ? "connections" : "profile"));

  const sections: Array<{ id: SectionId; label: string; icon: LucideIcon }> = [
    { id: "profile", label: "Profile", icon: User },
    { id: "plan", label: "Plan", icon: CreditCard },
    { id: "connections", label: "Connected accounts", icon: Link2 },
    { id: "security", label: "Security", icon: ShieldCheck },
    { id: "team", label: "Team", icon: Users },
    ...(roleSwitchingAllowed ? [{ id: "developer" as const, label: "Developer tools", icon: Wrench }] : []),
  ];
  const isAdmin = role === "admin" || role === "super_admin";

  return (
    <section aria-label="Settings" className="relative flex h-full min-h-0 w-full flex-col gap-5 overflow-y-auto overflow-x-hidden overscroll-contain bg-transparent p-4 text-white md:p-6">
      <header className="relative min-w-0 overflow-hidden rounded-[28px] border border-blue-400/70 ring-1 ring-inset ring-cyan-300/20 bg-slate-950/[0.48] backdrop-blur-[44px] backdrop-saturate-[170%] shadow-[0_0_0_1px_rgba(59,130,246,.16),0_0_30px_rgba(37,99,235,.16),0_28px_160px_rgba(0,0,0,.40),inset_0_0_22px_rgba(56,189,248,.05)]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_6%_8%,rgba(217,119,6,.18),transparent_30%),radial-gradient(circle_at_30%_70%,rgba(124,58,237,.20),transparent_34%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-[7%] top-0 h-px opacity-90 [background:linear-gradient(90deg,transparent_0%,rgba(247,215,116,.42)_34%,rgba(255,255,255,.62)_50%,rgba(125,211,252,.28)_69%,transparent_100%)]" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-5 px-6 py-5">
          <div className="flex min-w-0 items-center gap-4">
            <ExecutivePremiumIcon icon={Settings2} state="active" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-400/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-100/80">Workspace</span>
                <DesignPreviewBadge wiring="live" />
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                <span className="text-gradient-lumina">Your</span>{" "}
                <span className="bg-gradient-to-r from-[#D9A441] via-[#B97A18] to-[#7A4B05] bg-clip-text text-transparent">Settings</span>
              </h1>
              <p className="mt-1 truncate text-sm text-sky-300/70">{user?.email ?? "Not signed in"}</p>
            </div>
          </div>
          <nav aria-label="Settings sections" className="flex flex-wrap gap-2">
            {sections.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => setSection(item.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition",
                    active ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-100" : "border-white/10 text-sky-300/60 hover:text-sky-100",
                  )}
                >
                  <Icon className="h-3 w-3" /> {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main aria-label="Settings canvas" className="grid gap-5">
        {section === "profile" ? <ProfileSection /> : null}
        {section === "plan" ? <PlanSection plan={planForRole(role)} staffRole={STAFF[role] ?? null} /> : null}
        {section === "connections" ? <ConnectedAccountsSection accounts={accounts} isAdmin={isAdmin} /> : null}
        {section === "security" ? <SecuritySection /> : null}
        {section === "team" ? <TeamSection /> : null}
        {section === "developer" && roleSwitchingAllowed ? <DeveloperToolsSection /> : null}
      </main>
    </section>
  );
}

export default SettingsWorkspace;
