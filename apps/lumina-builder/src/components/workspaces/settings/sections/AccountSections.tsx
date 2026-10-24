import { useEffect, useState } from "react";
import { CreditCard, LogOut, ShieldCheck, User, Users, Wrench } from "lucide-react";

import { useWorkspace } from "@/context/WorkspaceContext";
import { useCurrentUser } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { auth } from "@/providers/auth-registry";
import { normalizeError } from "@/lib/errors";
import { resetAllData } from "@/services/adminService";

import { tonePill, toneText } from "../../executive/shared/ExecutiveSection";
import { pillButton, quietButton } from "../../developer/shared/surfaces";
import { ResetAppDataDialog } from "../dialogs/ResetAppDataDialog";
import { RoleSwitcher } from "../RoleSwitcher";
import { SettingsPanel } from "../shared/SettingsPanel";

/*
 * MS-2026-0011: the Settings sections that are real today. Removed, because
 * nothing stood behind them: generated "API keys" no API accepts, a
 * two-factor button that did nothing, a fixed "1 device" session list,
 * notification preferences nothing sends, integrations shown as connected
 * by default, a cancel button on a mock subscription, and team invites
 * that reached no one.
 */

const field =
  "w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-sky-50 placeholder:text-sky-300/40 focus:border-cyan-300/40 focus:outline-none disabled:opacity-60";

export function ProfileSection() {
  const user = useCurrentUser();
  const [name, setName] = useState(user?.name ?? "");
  const [state, setState] = useState<{ status: "idle" | "saving" | "saved" } | { status: "error"; message: string }>({ status: "idle" });
  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  const save = async () => {
    setState({ status: "saving" });
    try {
      await auth.updateProfile({ name: name.trim() });
      setState({ status: "saved" });
    } catch (error) {
      setState({ status: "error", message: normalizeError(error).userMessage });
    }
  };

  return (
    <SettingsPanel icon={User} eyebrow="Profile" title="You" description="Your name as KoreLumina shows it. Your email is the one you sign in with.">
      <div className="grid max-w-xl gap-4">
        <label className="grid gap-1.5 text-xs text-sky-300/70">
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} className={field} disabled={!user} />
        </label>
        <label className="grid gap-1.5 text-xs text-sky-300/70">
          Email
          <input value={user?.email ?? ""} readOnly disabled className={field} />
        </label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => void save()} disabled={!user || !name.trim() || state.status === "saving"} className={pillButton("healthy")}>
            {state.status === "saving" ? "Saving" : "Save"}
          </button>
          {state.status === "saved" ? <span className={cn("text-xs", toneText.healthy)}>Saved.</span> : null}
          {state.status === "error" ? <span className={cn("text-xs", toneText.error)}>{state.message}</span> : null}
        </div>
      </div>
    </SettingsPanel>
  );
}

const PLAN_LABEL: Record<string, string> = { free: "Free", pro: "Pro", business: "Business", enterprise: "Enterprise" };

export function PlanSection({ plan, staffRole }: { plan: string; staffRole: string | null }) {
  const { setView } = useWorkspace();
  return (
    <SettingsPanel icon={CreditCard} eyebrow="Plan" title={`${PLAN_LABEL[plan] ?? plan}${staffRole ? ` · ${staffRole}` : ""}`} description="What your account can use. Checkout is not open yet, so plans are changed by KoreLumina on request; nothing is charged here.">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setView("pricing")} className={pillButton("active")}>
          Compare plans
        </button>
      </div>
    </SettingsPanel>
  );
}

export function SecuritySection() {
  const { setView } = useWorkspace();
  const [signingOut, setSigningOut] = useState(false);
  return (
    <SettingsPanel icon={ShieldCheck} eyebrow="Security" title="Sign-in" description="Signing out ends your session on every device and browser where you are signed in to KoreLumina.">
      <div>
        <button
          type="button"
          disabled={signingOut}
          onClick={async () => {
            setSigningOut(true);
            await auth.signOut();
            setView("auth");
          }}
          className={pillButton("warning")}
        >
          <LogOut className="h-3 w-3" /> {signingOut ? "Signing out" : "Sign out everywhere"}
        </button>
      </div>
    </SettingsPanel>
  );
}

export function TeamSection() {
  return (
    <SettingsPanel icon={Users} eyebrow="Team" title="Working together" description="Shared team workspaces, with invitations and roles, are being built. Until then each project belongs to the person who created or imported it.">
      <p className={cn("rounded-2xl border px-4 py-3 text-sm", tonePill.active)}>Teams are not available yet. Nothing here invites or shares anything.</p>
    </SettingsPanel>
  );
}

export function DeveloperToolsSection() {
  const [open, setOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  return (
    <SettingsPanel icon={Wrench} eyebrow="Development build only" title="Developer tools" description="Visible only in development builds: switch the role this browser acts as, or reset the data this browser keeps.">
      <RoleSwitcher />
      <div>
        <button type="button" onClick={() => setOpen(true)} className={quietButton}>
          Reset this browser's data
        </button>
      </div>
      <ResetAppDataDialog
        open={open}
        resetting={resetting}
        onOpenChange={setOpen}
        onConfirm={async () => {
          try {
            setResetting(true);
            await resetAllData();
            setOpen(false);
          } finally {
            setResetting(false);
          }
        }}
      />
    </SettingsPanel>
  );
}
