import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { auth, team as teamProvider, billing } from "@/providers/registry";
import { projectRepository } from "@/services/projectRepository";
import { can, type TeamAction } from "@/services/teamPermissions";
import { checkWorkspaceLimit } from "@/services/workspaceEntitlements";
import { AppError } from "@/lib/errors";
import type { Invitation, Team, TeamMember, TeamRole } from "@/providers/types";

const ACTIVE_KEY = "korelumina:activeTeam";

function readActiveTeamId(): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(ACTIVE_KEY); } catch { return null; }
}
function writeActiveTeamId(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(ACTIVE_KEY, id);
    else window.localStorage.removeItem(ACTIVE_KEY);
  } catch {}
}

/** Module-level accessor for code outside the React tree (services, repos)
 *  that needs to scope writes by the user's currently-active workspace. */
export function getActiveTeamId(): string | null { return readActiveTeamId(); }

export interface ActiveTeamState {
  /** Teams the current user belongs to. Empty when signed-out. */
  teams: Team[];
  activeTeam: Team | null;
  members: TeamMember[];
  invitations: Invitation[];
  /** Current user's role inside `activeTeam`. */
  role: TeamRole | null;
  setActiveTeam: (teamId: string) => void;
  createTeam: (name: string) => Team;
  can: (action: TeamAction) => boolean;
  refresh: () => void;
  /** Plan attached to the active team's billing subscription, or the team's
   *  default plan when no paid subscription exists. */
  teamPlan: Team["plan"];
}

const Ctx = createContext<ActiveTeamState | null>(null);

const DEMO_TEAM_NAME = "Demo Workspace";

function ensureDemoTeam(): Team {
  const all = teamProvider.listTeamsForUser("__demo_seed__");
  const existing = all.find((t) => t.slug === "demo-workspace");
  if (existing) return existing;
  return teamProvider.createTeam({
    name: DEMO_TEAM_NAME,
    ownerUserId: "__demo_seed__",
    personal: false,
    plan: "free",
  });
}

export function ActiveTeamProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const [activeId, _setActiveId] = useState<string | null>(readActiveTeamId);

  // Boot: ensure every signed-in user has a personal workspace and that
  // legacy projects without a teamId get assigned to a default workspace.
  useEffect(() => {
    const sync = () => {
      const user = auth.getUser();
      if (user) {
        const personal = teamProvider.ensurePersonalTeam({
          id: user.id, name: user.name, email: user.email,
        });
        // One-time: pull any orphaned demo projects into the user's personal
        // workspace so the dashboard isn't empty on first sign-in.
        const projects = projectRepository.list();
        const orphaned = projects.some((p) => !p.teamId);
        if (orphaned) projectRepository.assignOrphansToTeam(personal.id);
      } else {
        // Anonymous demo: park orphaned seed projects on a shared demo team
        // so list(teamId) keeps working consistently.
        const orphaned = projectRepository.list().some((p) => !p.teamId);
        if (orphaned) projectRepository.assignOrphansToTeam(ensureDemoTeam().id);
      }
      refresh();
    };
    sync();
    const offAuth = auth.onChange(sync);
    const offTeam = teamProvider.onChange(refresh);
    return () => { offAuth(); offTeam(); };
  }, [refresh]);

  const user = auth.getUser();
  const teams = useMemo<Team[]>(() => {
    if (user) return teamProvider.listTeamsForUser(user.id);
    // Anonymous: expose only the demo team so previews work.
    const demo = teamProvider.listTeamsForUser("__demo_seed__");
    return demo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, tick]);

  // Resolve / persist active team selection.
  const activeTeam = useMemo<Team | null>(() => {
    if (teams.length === 0) return null;
    if (activeId) {
      const found = teams.find((t) => t.id === activeId);
      if (found) return found;
    }
    return teams[0];
  }, [teams, activeId]);

  useEffect(() => {
    if (activeTeam && activeTeam.id !== activeId) {
      _setActiveId(activeTeam.id);
      writeActiveTeamId(activeTeam.id);
    }
  }, [activeTeam, activeId]);

  // Cross-tab sync: when another tab changes the active workspace, mirror it here.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== ACTIVE_KEY) return;
      const next = e.newValue;
      _setActiveId((prev) => (next === prev ? prev : next));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const members = useMemo<TeamMember[]>(
    () => (activeTeam ? teamProvider.listMembers(activeTeam.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTeam?.id, tick],
  );
  const invitations = useMemo<Invitation[]>(
    () => (activeTeam ? teamProvider.listInvitations(activeTeam.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTeam?.id, tick],
  );

  const role = useMemo<TeamRole | null>(() => {
    if (!activeTeam || !user) return null;
    const m = members.find((x) => x.userId === user.id);
    return m?.role ?? null;
  }, [activeTeam, members, user]);

  const teamPlan = useMemo<Team["plan"]>(() => {
    if (!activeTeam) return "free";
    const sub = billing.getTeamSubscription(activeTeam.id);
    if (sub?.plan?.startsWith("business")) return "business";
    if (sub?.plan?.startsWith("pro")) return "pro";
    return activeTeam.plan;
  }, [activeTeam, tick]);

  const setActiveTeam = useCallback((teamId: string) => {
    _setActiveId(teamId);
    writeActiveTeamId(teamId);
  }, []);

  const createTeam = useCallback((name: string): Team => {
    const u = auth.getUser();
    if (!u) throw new Error("Sign in to create a workspace.");
    // Enforce per-plan workspace caps using the user's personal workspace plan.
    const personal = teamProvider.ensurePersonalTeam({ id: u.id, name: u.name, email: u.email });
    const check = checkWorkspaceLimit(personal.id, "createWorkspace");
    if (!check.allowed) throw new AppError("VALIDATION", check.reason ?? "Workspace limit reached.");
    const t = teamProvider.createTeam({ name, ownerUserId: u.id, personal: false, plan: "free" });
    setActiveTeam(t.id);
    refresh();
    return t;
  }, [refresh, setActiveTeam]);

  const value = useMemo<ActiveTeamState>(() => ({
    teams,
    activeTeam,
    members,
    invitations,
    role,
    setActiveTeam,
    createTeam,
    can: (action) => can(role, action),
    refresh,
    teamPlan,
  }), [teams, activeTeam, members, invitations, role, setActiveTeam, createTeam, refresh, teamPlan]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useActiveTeam(): ActiveTeamState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useActiveTeam must be used inside ActiveTeamProvider");
  return ctx;
}