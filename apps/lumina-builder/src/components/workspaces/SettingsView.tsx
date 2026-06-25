import { useEffect, useState } from "react";
import { User, CreditCard, Key, Plug, Shield, Bell, ArrowLeft, Check, Users, Trash2, UserPlus, X, LogOut, Link2, AlertTriangle, Info } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { mockIntegrations, type Integration } from "@/lib/mockData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RoleSwitcher } from "@/components/workspaces/settings/RoleSwitcher";
import { auth } from "@/providers/auth-registry";
import { billing } from "@/providers/billing-registry";
import { team as teamProvider } from "@/providers/team-registry";
import { useCurrentUser } from "@/hooks/use-auth";
import { readJSON, writeJSON, uid } from "@/lib/persistence";
import { normalizeError } from "@/lib/errors";
import { useActiveTeam } from "@/context/ActiveTeamContext";
import { TEAM_ROLES, roleLabel } from "@/services/teamPermissions";
import { checkWorkspaceLimit, getWorkspaceLimits } from "@/services/workspaceEntitlements";
import type { TeamRole } from "@/providers/types";
import { setPricingPrefill } from "@/services/pricingPrefill";
import { ArrowUpRight } from "lucide-react";
import { LeaveWorkspaceDialog } from "@/components/workspaces/settings/dialogs/LeaveWorkspaceDialog";
import { ResetAppDataDialog } from "@/components/workspaces/settings/dialogs/ResetAppDataDialog";

interface ApiKey { id: string; preview: string; createdAt: number; secret: string }

function loadKeys(): ApiKey[] { return readJSON<ApiKey[]>("settings", "apiKeys", []); }
function saveKeys(k: ApiKey[]) { writeJSON("settings", "apiKeys", k); }
function loadIntegrations(): Record<string, boolean> { return readJSON<Record<string, boolean>>("settings", "integrations", Object.fromEntries(mockIntegrations.map((i) => [i.id, i.connected]))); }
function saveIntegrations(map: Record<string, boolean>) { writeJSON("settings", "integrations", map); }

type Section = "profile" | "billing" | "api" | "integrations" | "notifications" | "team" | "security";

const nav: { id: Section; label: string; Icon: any }[] = [
  { id: "profile",      label: "Profile",      Icon: User },
  { id: "billing",      label: "Billing",      Icon: CreditCard },
  { id: "api",          label: "API Keys",     Icon: Key },
  { id: "integrations", label: "Integrations", Icon: Plug },
  { id: "notifications", label: "Notifications", Icon: Bell },
  { id: "team",         label: "Team",         Icon: Users },
  { id: "security",     label: "Security",     Icon: Shield },
];

interface NotifPrefs { email: boolean; push: boolean; builds: boolean; billing: boolean; product: boolean }
const DEFAULT_PREFS: NotifPrefs = { email: true, push: true, builds: true, billing: true, product: false };
function loadPrefs(): NotifPrefs { return readJSON<NotifPrefs>("settings", "notifPrefs", DEFAULT_PREFS); }
function savePrefs(p: NotifPrefs) { writeJSON("settings", "notifPrefs", p); }

export function SettingsView() {
  const { setView, usage } = useWorkspace();
  const [active, setActive] = useState<Section>("profile");
  const user = useCurrentUser();
  const [name, setName] = useState(user?.name ?? "");
  const [email] = useState(user?.email ?? "");
  useEffect(() => { if (user) setName(user.name); }, [user]);
  const [savingProfile, setSavingProfile] = useState(false);

  const [resetDialogOpen, setResetDialogOpen] =
    useState(false);

  const [resettingData, setResettingData] =
    useState(false);

  const [leaveDialogOpen, setLeaveDialogOpen] =
    useState(false);

  const [leavingWorkspace, setLeavingWorkspace] =
    useState(false);

  const [apiKeys, setApiKeys] = useState<ApiKey[]>(() => loadKeys());
  const [revealed, setRevealed] = useState<string | null>(null);
  const generateKey = () => {
    const secret = `lum_${uid("k").replace(/_/g, "").slice(0, 32)}`;
    const k: ApiKey = { id: uid("key"), preview: `${secret.slice(0, 6)}••••${secret.slice(-4)}`, createdAt: Date.now(), secret };
    const next = [k, ...apiKeys]; setApiKeys(next); saveKeys(next); setRevealed(k.id);
    toast.success("New API key generated");
  };
  const revokeKey = (id: string) => { const next = apiKeys.filter((k) => k.id !== id); setApiKeys(next); saveKeys(next); toast("Key revoked"); };

  const [integrations, setIntegrations] = useState<Record<string, boolean>>(() => loadIntegrations());
  const toggleIntegration = (i: Integration) => {
    const next = { ...integrations, [i.id]: !integrations[i.id] };
    setIntegrations(next); saveIntegrations(next);
    toast(integrations[i.id] ? `${i.name} disconnected` : `${i.name} connected`);
  };

  const [prefs, setPrefs] = useState<NotifPrefs>(() => loadPrefs());
  const togglePref = (k: keyof NotifPrefs) => {
    const next = { ...prefs, [k]: !prefs[k] };
    setPrefs(next); savePrefs(next);
    toast(`${k} notifications ${next[k] ? "on" : "off"}`);
  };

  const { activeTeam, members, invitations, role: myRole, can: canDo, refresh: refreshTeam } = useActiveTeam();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("developer");
  const inviteMember = () => {
    if (!activeTeam || !user) { toast.error("Sign in to invite members."); return; }
    if (!canDo("members.invite")) { toast.error("You don't have permission to invite."); return; }
    const cap = checkWorkspaceLimit(activeTeam.id, "addMember");
    if (!cap.allowed) { toast.error(cap.reason ?? "Member limit reached."); return; }
    const email = inviteEmail.trim();
    if (!email || !/.+@.+\..+/.test(email)) { toast.error("Enter a valid email"); return; }
    try {
      teamProvider.createInvitation({ teamId: activeTeam.id, email, role: inviteRole, invitedBy: user.id });
      setInviteEmail("");
      toast.success(`Invite sent to ${email}`);
      refreshTeam();
    } catch (e) { toast.error(normalizeError(e).userMessage); }
  };
  const changeRole = (userId: string, role: TeamRole) => {
    if (!activeTeam) return;
    try { teamProvider.updateMemberRole(activeTeam.id, userId, role); refreshTeam(); toast.success("Role updated"); }
    catch (e) { toast.error(normalizeError(e).userMessage); }
  };
  const removeMember = (userId: string) => {
    if (!activeTeam) return;
    try { teamProvider.removeMember(activeTeam.id, userId); refreshTeam(); toast("Member removed"); }
    catch (e) { toast.error(normalizeError(e).userMessage); }
  };
  const revokeInvite = (id: string) => {
    try { teamProvider.revokeInvitation(id); refreshTeam(); toast("Invitation revoked"); }
    catch (e) { toast.error(normalizeError(e).userMessage); }
  };
  const leaveTeam = () => {
    setLeaveDialogOpen(true);
  };

  const saveProfile = async () => {
    if (!user) { toast.error("Sign in to update your profile."); return; }
    setSavingProfile(true);
    try { await auth.updateProfile({ name }); toast.success("Profile saved"); }
    catch (e) { toast.error(normalizeError(e).userMessage); }
    finally { setSavingProfile(false); }
  };

  const cancelSubscription = async () => {
    if (!user) return;
    try { await billing.cancel(user.id); toast.success("Subscription canceled"); }
    catch (e) { toast.error(normalizeError(e).userMessage); }
  };

  const signOutEverywhere = async () => {
    await auth.signOut(); toast("Signed out"); setView("auth");
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">
        <button onClick={() => setView("dashboard")} className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6">
          <ArrowLeft className="h-3 w-3" /> Back to projects
        </button>
        <h1 className="font-display text-3xl tracking-[-0.02em] mb-8">Settings</h1>
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
          <nav className="glass rounded-2xl p-2 h-max">
            {nav.map((n) => {
              const I = n.Icon;
              const isActive = active === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setActive(n.id)}
                  className={cn(
                    "w-full h-9 px-3 rounded-lg text-[12px] flex items-center gap-2 transition",
                    isActive ? "bg-surface-3 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface-1",
                  )}
                >
                  <I className="h-3.5 w-3.5" />
                  {n.label}
                </button>
              );
            })}
          </nav>

          <div className="glass rounded-2xl p-6 min-h-[320px]">
            {active === "profile" && (
              <Section title="Profile">
                <Row label="Name"><input value={name} onChange={(e) => setName(e.target.value)} className="h-9 px-3 rounded-lg bg-surface-1 border border-border text-[13px] outline-none focus:border-violet/50 transition" /></Row>
                <Row label="Email"><input value={email} readOnly className="h-9 px-3 rounded-lg bg-surface-1 border border-border text-[13px] outline-none focus:border-violet/50 transition opacity-70" /></Row>
                <div className="flex justify-end pt-2">
                  <LuminaButton size="md" onClick={saveProfile} disabled={savingProfile || !user}>{savingProfile ? "Saving…" : "Save"}</LuminaButton>
                </div>
              </Section>
            )}
            {active === "billing" && (
              <Section title="Billing">
                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-1 border border-border">
                  <div>
                    <div className="text-[12px] uppercase tracking-widest text-muted-foreground">Current plan</div>
                    <div className="font-display text-lg capitalize mt-0.5">{usage.plan}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {usage.plan !== "free" && (<LuminaButton variant="ghost" size="sm" onClick={cancelSubscription}>Cancel</LuminaButton>)}
                    <LuminaButton size="md" onClick={() => setView("pricing")}>Upgrade</LuminaButton>
                  </div>
                </div>
              </Section>
            )}
            {active === "api" && (
              <Section title="API Keys">
                <div className="flex justify-end">
                  <LuminaButton size="sm" onClick={generateKey}>Generate key</LuminaButton>
                </div>
                {apiKeys.length === 0 ? (
                  <div className="rounded-xl bg-surface-1 border border-border p-4 text-[12px] text-muted-foreground">No keys yet. Generate one to integrate with the Lumina API.</div>
                ) : apiKeys.map((k) => (
                  <div key={k.id} className="rounded-xl bg-surface-1 border border-border p-4 flex items-center justify-between gap-3">
                    <code className="text-[12px] text-muted-foreground truncate">{revealed === k.id ? k.secret : k.preview}</code>
                    <div className="flex items-center gap-2">
                      <LuminaButton variant="ghost" size="sm" onClick={() => setRevealed(revealed === k.id ? null : k.id)}>{revealed === k.id ? "Hide" : "Reveal"}</LuminaButton>
                      <LuminaButton variant="ghost" size="sm" onClick={() => revokeKey(k.id)}>Revoke</LuminaButton>
                    </div>
                  </div>
                ))}
              </Section>
            )}
            {active === "integrations" && (
              <Section title="Integrations">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {mockIntegrations.map((i) => { const connected = integrations[i.id]; return (
                    <div key={i.id} className="p-4 rounded-xl glass flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium">{i.name}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{i.description}</div>
                      </div>
                      <LuminaButton variant={connected ? "ghost" : "primary"} size="sm" onClick={() => toggleIntegration(i)}>
                        {connected ? (<><Check className="h-3 w-3" /> Connected</>) : "Connect"}
                      </LuminaButton>
                    </div>
                  ); })}
                </div>
              </Section>
            )}
            {active === "notifications" && (
              <Section title="Notifications">
                {([
                  ["email",   "Email digests",        "Weekly summary of builds and activity."],
                  ["push",    "In-app push",          "Pop-up alerts inside the workspace."],
                  ["builds",  "Build & deploy events", "Notify when a deploy completes or fails."],
                  ["billing", "Billing updates",      "Invoices, renewals, plan changes."],
                  ["product", "Product announcements","New features and template launches."],
                ] as Array<[keyof NotifPrefs, string, string]>).map(([k, title, body]) => (
                  <div key={k} className="p-4 rounded-xl bg-surface-1 border border-border flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium">{title}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{body}</div>
                    </div>
                    <LuminaButton variant={prefs[k] ? "primary" : "ghost"} size="sm" onClick={() => togglePref(k)}>
                      {prefs[k] ? (<><Check className="h-3 w-3" /> On</>) : "Off"}
                    </LuminaButton>
                  </div>
                ))}
              </Section>
            )}
            {active === "team" && (
              <Section title={activeTeam ? `${activeTeam.name} · Members` : "Members"}>
                {!activeTeam ? (
                  <div className="rounded-xl bg-surface-1 border border-border p-4 text-[12px] text-muted-foreground">
                    Sign in to manage workspace members.
                  </div>
                ) : (
                  <>
                    {(() => {
                      const limits = getWorkspaceLimits(activeTeam.plan);
                      const seatCheck = checkWorkspaceLimit(activeTeam.id, "addMember");
                      const seatCurrent = members.length;
                      const projectCurrent = 0;
                      const fmt = (n: number) => (n === Infinity ? "∞" : n.toLocaleString());
                      const seatPct = limits.maxMembers === Infinity ? 0 : Math.min(100, (seatCurrent / limits.maxMembers) * 100);
                      const projPct = limits.maxProjects === Infinity ? 0 : Math.min(100, (projectCurrent / limits.maxProjects) * 100);
                      const pendingCount = invitations.filter((i) => i.status === "pending").length;
                      const projectedSeats = seatCurrent + pendingCount;
                      const seatsLeft = limits.maxMembers === Infinity
                        ? Infinity
                        : Math.max(0, limits.maxMembers - projectedSeats);
                      const atCap = limits.maxMembers !== Infinity && projectedSeats >= limits.maxMembers;
                      const nearCap = !atCap && limits.maxMembers !== Infinity && seatsLeft <= Math.max(1, Math.ceil(limits.maxMembers * 0.1));
                      return (
                        <div className="rounded-xl bg-surface-1 border border-border p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Workspace plan</div>
                              <div className="text-[13px] font-medium capitalize mt-0.5">{activeTeam.plan}</div>
                            </div>
                            {!limits.canInviteMembers && (
                              <LuminaButton size="sm" onClick={() => setView("pricing")}>Upgrade</LuminaButton>
                            )}
                          </div>
                          <Meter label="Seats"    current={seatCurrent}    limit={limits.maxMembers}  pct={seatPct} fmt={fmt} />
                          {limits.canInviteMembers && (
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground -mt-1.5">
                              <span className="inline-flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-brand" /> Active: {seatCurrent}</span>
                              <span className="inline-flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-violet/70" /> Pending: {pendingCount}</span>
                              <span className="inline-flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-surface-3 border border-border" /> Left: {seatsLeft === Infinity ? "∞" : seatsLeft}</span>
                            </div>
                          )}
                          {(() => {
                            const recommendedTier: "pro" | "business" | "enterprise" =
                              activeTeam.plan === "free" ? "business"
                              : activeTeam.plan === "pro" ? "business"
                              : activeTeam.plan === "business" ? "enterprise"
                              : "enterprise";
                            const reason = atCap
                              ? `At ${fmt(limits.maxMembers)}-seat cap on ${activeTeam.plan}. Upgrade to ${recommendedTier} for more seats.`
                              : nearCap
                                ? `Only ${seatsLeft} ${seatsLeft === 1 ? "seat" : "seats"} left on ${activeTeam.plan}. ${recommendedTier === "enterprise" ? "Enterprise" : "Business"} adds headroom.`
                                : !limits.canInviteMembers
                                  ? `${activeTeam.plan} is single-seat. Upgrade to Business to invite teammates.`
                                  : `Plan ahead — preview ${recommendedTier} seat capacity.`;
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  setPricingPrefill({
                                    recommendedTier,
                                    currentPlan: activeTeam.plan,
                                    activeSeats: seatCurrent,
                                    pendingSeats: pendingCount,
                                    seatsLeft,
                                    seatCap: limits.maxMembers,
                                    reason,
                                    workspaceName: activeTeam.name,
                                  });
                                  setView("pricing");
                                }}
                                className="w-full -mt-0.5 flex items-center justify-between gap-2 rounded-lg border border-violet/25 bg-violet/[0.06] hover:bg-violet/[0.10] hover:border-violet/40 transition px-3 py-2 text-[11.5px] text-left"
                              >
                                <span className="min-w-0 flex-1">
                                  <span className="font-medium text-foreground">Plan an upgrade</span>
                                  <span className="text-muted-foreground"> · {reason}</span>
                                </span>
                                <ArrowUpRight className="h-3.5 w-3.5 text-violet flex-shrink-0" />
                              </button>
                            );
                          })()}
                          <Meter label="Projects" current={projectCurrent} limit={limits.maxProjects} pct={projPct} fmt={fmt} />
                          {limits.canInviteMembers && (atCap || nearCap || pendingCount > 0) && (
                            <div
                              className={cn(
                                "rounded-lg border p-2.5 text-[11.5px] flex items-start gap-2 leading-relaxed",
                                atCap
                                  ? "border-gold/30 bg-gold/[0.06] text-gold"
                                  : nearCap
                                    ? "border-gold/20 bg-gold/[0.03] text-foreground/90"
                                    : "border-border bg-surface-2 text-muted-foreground",
                              )}
                            >
                              {atCap ? <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                     : <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />}
                              <div className="flex-1 min-w-0">
                                {atCap ? (
                                  <>
                                    <span className="font-medium">You've hit your seat cap.</span>{" "}
                                    {seatCurrent} active{pendingCount > 0 ? ` + ${pendingCount} pending` : ""} of {fmt(limits.maxMembers)} seats used.
                                    Revoke a pending invite, remove a member, or upgrade to add more.
                                  </>
                                ) : nearCap ? (
                                  <>
                                    <span className="font-medium">{seatsLeft} {seatsLeft === 1 ? "seat" : "seats"} left.</span>{" "}
                                    {seatCurrent} active{pendingCount > 0 ? `, ${pendingCount} pending invite${pendingCount === 1 ? "" : "s"}` : ""} of {fmt(limits.maxMembers)}.
                                  </>
                                ) : (
                                  <>
                                    {pendingCount} pending invite{pendingCount === 1 ? "" : "s"} count against your seat cap —
                                    {" "}{seatsLeft === Infinity ? "unlimited" : seatsLeft} {seatsLeft === 1 ? "seat" : "seats"} left.
                                  </>
                                )}
                              </div>
                              {atCap && (
                                <LuminaButton size="sm" variant="ghost" onClick={() => setView("pricing")}>
                                  Upgrade
                                </LuminaButton>
                              )}
                            </div>
                          )}
                          {!limits.canInviteMembers && (
                            <div className="text-[11.5px] text-muted-foreground leading-relaxed">
                              {seatCheck.reason}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {canDo("members.invite") && (
                      <div className="rounded-xl bg-surface-1 border border-border p-4 flex flex-col sm:flex-row gap-2">
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="teammate@company.com"
                          className="h-9 px-3 rounded-lg bg-surface-2 border border-border text-[13px] outline-none focus:border-violet/50 transition flex-1"
                        />
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                          className="h-9 px-2.5 rounded-lg bg-surface-2 border border-border text-[12px] outline-none"
                        >
                          {TEAM_ROLES.filter((r) => r !== "owner").map((r) => (
                            <option key={r} value={r}>{roleLabel(r)}</option>
                          ))}
                        </select>
                        <LuminaButton size="sm" onClick={inviteMember}>
                          <UserPlus className="h-3 w-3" /> Invite
                        </LuminaButton>
                      </div>
                    )}

                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground pt-1">Members</div>
                    {members.length === 0 ? (
                      <div className="rounded-xl bg-surface-1 border border-border p-4 text-[12px] text-muted-foreground">No members yet.</div>
                    ) : members.map((m) => {
                      const isSelf = m.userId === user?.id;
                      const displayName = isSelf ? (user?.name ?? user?.email ?? m.userId) : m.userId;
                      const displayEmail = isSelf ? user?.email : "";
                      const canEditRole = canDo("members.changeRole") && m.role !== "owner" && !isSelf;
                      const canRemove = canDo("members.remove") && m.role !== "owner" && !isSelf;
                      return (
                        <div key={m.id} className="rounded-xl bg-surface-1 border border-border p-4 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium truncate flex items-center gap-2">
                              {displayName}
                              {isSelf && <span className="text-[10px] uppercase tracking-widest text-muted-foreground">You</span>}
                            </div>
                            {displayEmail && <div className="text-[11px] text-muted-foreground truncate">{displayEmail}</div>}
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={m.role}
                              disabled={!canEditRole}
                              onChange={(e) => changeRole(m.userId, e.target.value as TeamRole)}
                              className="h-8 px-2 rounded-lg bg-surface-2 border border-border text-[12px] outline-none disabled:opacity-60"
                            >
                              {TEAM_ROLES.map((r) => (
                                <option key={r} value={r} disabled={r === "owner"}>{roleLabel(r)}</option>
                              ))}
                            </select>
                            <LuminaButton variant="ghost" size="sm" onClick={() => removeMember(m.userId)} disabled={!canRemove}>
                              <Trash2 className="h-3 w-3" />
                            </LuminaButton>
                          </div>
                        </div>
                      );
                    })}

                    {invitations.filter((i) => i.status === "pending").length > 0 && (
                      <>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground pt-3">Pending invitations</div>
                        {invitations.filter((i) => i.status === "pending").map((inv) => (
                          <div key={inv.id} className="rounded-xl bg-surface-1 border border-border p-4 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-[13px] font-medium truncate">{inv.email}</div>
                              <div className="text-[11px] text-muted-foreground">
                                {roleLabel(inv.role)} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                              </div>
                            </div>
                            {canDo("members.invite") && (
                              <div className="flex items-center gap-1">
                                <LuminaButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const url = `${window.location.origin}/invite/${inv.token}`;
                                    navigator.clipboard?.writeText(url);
                                    toast.success("Invite link copied");
                                  }}
                                >
                                  <Link2 className="h-3 w-3" /> Copy link
                                </LuminaButton>
                                <LuminaButton variant="ghost" size="sm" onClick={() => revokeInvite(inv.id)}>
                                  <X className="h-3 w-3" /> Revoke
                                </LuminaButton>
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    )}

                    {myRole && myRole !== "owner" && !activeTeam.personal && (
                      <div className="flex justify-end pt-2">
                        <LuminaButton variant="ghost" size="sm" onClick={leaveTeam}>
                          <LogOut className="h-3 w-3" /> Leave workspace
                        </LuminaButton>
                      </div>
                    )}
                  </>
                )}
              </Section>
            )}
            {active === "security" && (
              <Section title="Security">
                <RoleSwitcher />
                <Row label="Two-factor auth"><LuminaButton variant="ghost" size="sm">Enable</LuminaButton></Row>
                <Row label="Active sessions"><span className="text-[12px] text-muted-foreground">1 device</span></Row>
                <Row label="Sign out everywhere"><LuminaButton variant="ghost" size="sm" onClick={signOutEverywhere}>Sign out</LuminaButton></Row>
                <Row label="Reset & re-seed (dev)">
                  <LuminaButton
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setResetDialogOpen(
                        true,
                      )
                    }
                  >
                    Reset data
                  </LuminaButton>
                </Row>
              </Section>
            )}
          </div>
        </div>
      </div>
      <LeaveWorkspaceDialog
        open={leaveDialogOpen}
        workspaceName={
          activeTeam?.name ?? "Workspace"
        }
        leaving={leavingWorkspace}
        onOpenChange={
          setLeaveDialogOpen
        }
        onConfirm={() => {
          if (
            !activeTeam ||
            !user
          ) {
            return;
          }

          try {
            setLeavingWorkspace(
              true,
            );

            teamProvider.leaveTeam(
              activeTeam.id,
              user.id,
            );

            refreshTeam();

            toast(
              "You left the workspace",
            );

            setLeaveDialogOpen(
              false,
            );
          } catch (e) {
            toast.error(
              normalizeError(e)
                .userMessage,
            );
          } finally {
            setLeavingWorkspace(
              false,
            );
          }
        }}
      />
      <ResetAppDataDialog
        open={resetDialogOpen}
        resetting={resettingData}
        onOpenChange={
          setResetDialogOpen
        }
        onConfirm={async () => {
          try {
            setResettingData(
              true,
            );

            await resetAllData();

            setResetDialogOpen(
              false,
            );
          } finally {
            setResettingData(
              false,
            );
          }
        }}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-lg mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function Meter({
  label, current, limit, pct, fmt,
}: { label: string; current: number; limit: number; pct: number; fmt: (n: number) => string }) {
  const atCap = limit !== Infinity && current >= limit;
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("tabular-nums", atCap ? "text-gold" : "text-foreground/80")}>
          {fmt(current)} / {fmt(limit)}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            atCap ? "bg-gold" : "bg-brand",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
