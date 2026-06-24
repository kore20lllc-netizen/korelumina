/* Provider contracts — UI/services depend only on these interfaces. */

export type Role = "free" | "pro" | "business" | "enterprise" | "inhouse-dev" | "admin" | "super_admin";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: Role;
  createdAt: number;
}

export interface Session { userId: string; token: string; expiresAt: number }

export interface AuthProvider {
  getSession(): Session | null;
  getUser(): User | null;
  signUp(input: { email: string; password: string; name: string }): Promise<{ user: User; session: Session }>;
  signIn(input: { email: string; password: string }): Promise<{ user: User; session: Session }>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  updateProfile(patch: Partial<Pick<User, "name" | "avatarUrl">>): Promise<User>;
  changePassword(oldPw: string, newPw: string): Promise<void>;
  setRole(role: Role): Promise<User>; // dev/admin helper
  onChange(cb: () => void): () => void;
}

/* Billing */
export type Plan = "free" | "pro_monthly" | "pro_yearly" | "business_monthly";
export interface Product { id: string; name: string; priceCents: number; interval?: "month" | "year" | "one_time"; planOnPurchase?: Role; description: string }
export interface Subscription { id: string; userId: string; teamId?: string; plan: Plan; status: "active" | "canceled" | "past_due"; startedAt: number; renewsAt?: number; canceledAt?: number }
export interface Payment { id: string; userId: string; productId: string; amountCents: number; status: "paid" | "refunded" | "failed"; createdAt: number; invoiceUrl?: string }
export interface BillingProvider {
  listProducts(): Product[];
  getSubscription(userId: string): Subscription | null;
  /** Team-scoped subscription. Falls back to null when team has no plan
   *  attached (treated as the free plan). */
  getTeamSubscription(teamId: string): Subscription | null;
  listPayments(userId: string): Payment[];
  checkout(input: { userId: string; productId: string; teamId?: string }): Promise<{ url: string; sessionId: string }>;
  confirmCheckout(sessionId: string): Promise<{ subscription?: Subscription; payment: Payment }>;
  cancel(userId: string): Promise<Subscription>;
  reactivate(userId: string): Promise<Subscription>;
  openPortalUrl(userId: string): string;
}

/* AI */
export interface BuildStepEvent { id: string; label: string; status: "queued" | "running" | "done" | "error"; detail?: string; at: number }
export interface FileDiff { path: string; before: string; after: string; kind: "add" | "modify" | "delete" }
export interface DraftResult { id: string; summary: string; steps: BuildStepEvent[]; diffs: FileDiff[]; explanation: string }
export interface AIProvider {
  orchestrate(input: { projectId: string; prompt: string; onEvent?: (e: BuildStepEvent) => void; signal?: AbortSignal }): Promise<DraftResult>;
  applyDraft(projectId: string, draftId: string): Promise<{ ok: true }>;
}

/* Repository / Import */
export type Framework = "next" | "vite" | "react" | "vue" | "nuxt" | "monorepo" | "unknown";
export interface ImportedRepo {
  id: string;
  source: "github" | "zip" | "template";
  name: string;
  framework: Framework;
  files: Record<string, string>;
  dependencies: Record<string, string>;
  complexity: "low" | "medium" | "high";
  summary: string;
  importedAt: number;
}
export interface RepositoryProvider {
  importFromGithub(url: string, onProgress?: (pct: number, label: string) => void): Promise<ImportedRepo>;
  importFromZip(file: File, onProgress?: (pct: number, label: string) => void): Promise<ImportedRepo>;
}

/* Deployment */
export interface Deployment { id: string; projectId: string; provider: "vercel" | "netlify" | "custom"; status: "queued" | "building" | "ready" | "error"; url?: string; logs: string[]; createdAt: number; customDomain?: string }

/* Storage */
export interface StorageProvider {
  putText(key: string, content: string): Promise<void>;
  getText(key: string): Promise<string | null>;
  remove(key: string): Promise<void>;
}

/* Usage */
export interface UsageSnapshot { plan: Role; aiExecutions: number; aiLimit: number; projects: number; projectLimit: number; deployments: number; transformations: number; audits: number }
export interface UsageProvider {
  snapshot(userId: string): UsageSnapshot;
  recordAIExecution(userId: string): void;
  recordDeployment(userId: string): void;
  recordTransformation(userId: string): void;
  recordProjectCreated(userId: string): void;
  recordAudit(userId: string): void;
  reset(userId: string): void;
  onChange(cb: () => void): () => void;
}

/* Team workspaces (multi-tenant) — orthogonal to plan-tier Role.
 * Plan-tier Role controls feature entitlements per-user; TeamRole controls
 * what a user can do *inside* a given team. */
export type TeamRole = "owner" | "admin" | "developer" | "viewer";
export type TeamPlan = "free" | "pro" | "business" | "enterprise";

export interface Team {
  id: string;
  name: string;
  slug: string;
  plan: TeamPlan;
  ownerUserId: string;
  /** True for the auto-created personal workspace for every new user. */
  personal: boolean;
  createdAt: number;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: number;
}

export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export interface Invitation {
  id: string;
  teamId: string;
  email: string;
  role: TeamRole;
  token: string;
  status: InvitationStatus;
  invitedBy: string;
  createdAt: number;
  expiresAt: number;
}

export interface TeamProvider {
  listTeamsForUser(userId: string): Team[];
  getTeam(teamId: string): Team | null;
  createTeam(input: { name: string; ownerUserId: string; personal?: boolean; plan?: TeamPlan }): Team;
  updateTeam(teamId: string, patch: Partial<Pick<Team, "name" | "slug" | "plan">>): Team;
  deleteTeam(teamId: string): void;

  listMembers(teamId: string): TeamMember[];
  addMember(input: { teamId: string; userId: string; role: TeamRole }): TeamMember;
  updateMemberRole(teamId: string, userId: string, role: TeamRole): TeamMember;
  removeMember(teamId: string, userId: string): void;
  leaveTeam(teamId: string, userId: string): void;

  listInvitations(teamId: string): Invitation[];
  listInvitationsForEmail(email: string): Invitation[];
  getInvitationByToken(token: string): Invitation | null;
  createInvitation(input: { teamId: string; email: string; role: TeamRole; invitedBy: string }): Invitation;
  acceptInvitation(token: string, user: { id: string; email: string }): { team: Team; member: TeamMember };
  revokeInvitation(invitationId: string): void;

  /** Idempotent — returns the existing personal team if one already exists. */
  ensurePersonalTeam(user: { id: string; name: string; email: string }): Team;

  onChange(cb: () => void): () => void;
}