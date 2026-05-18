import { clearNamespace, migrate, readJSON, writeJSON } from "@/lib/persistence";
import { mockNotifications } from "@/lib/mockData";
import { seedAdminUser, mockCreateUser, mockAllUsers } from "@/providers/auth/MockAuthProvider";
import type { Payment, Subscription, Role, Plan, Deployment } from "@/providers/types";
import { projectRepository } from "@/services/projectRepository";
import { team as teamProvider } from "@/providers/registry";

const DEMO_FIRSTNAMES = ["Ava","Liam","Mia","Noah","Zoe","Eli","Ivy","Leo","Nora","Owen","Aria","Kai","Maya","Theo","Rio","Sage","Jade","Finn","Lila","Ezra"];
const DEMO_ROLES: Role[] = ["free","free","free","pro","pro","pro","business","enterprise"];
const ACCENTS = ["magenta","violet","cyan","gold"] as const;
const TYPES = ["website","webapp","dashboard","ai-tool","import","mobile"] as const;

function rand<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function daysAgo(d: number) { return Date.now() - d * 86400_000; }

function seedDemoUsers() {
  const existing = mockAllUsers();
  if (existing.length >= 15) return; // already seeded
  DEMO_FIRSTNAMES.forEach((name, i) => {
    const email = `${name.toLowerCase()}${i}@demo.lumina.app`;
    if (existing.some((u) => u.email === email)) return;
    mockCreateUser({ email, name, role: rand(DEMO_ROLES), password: "demo1234" });
  });
}

function seedDemoProjects() {
  const users = mockAllUsers().filter((u) => !u.email.startsWith("admin"));
  if (projectRepository.list().length >= 30) return;
  for (let i = 0; i < 50; i++) {
    const owner = users[i % users.length];
    if (!owner) break;
    projectRepository.create({
      name: `${owner.name}'s ${rand(["Studio","Portfolio","Dashboard","Site","Agent","Atlas"])} ${i + 1}`,
      type: rand(TYPES),
      status: rand(["draft","live","building"]),
      accent: rand(ACCENTS),
    }, { ownerId: owner.id });
  }
}

function seedDemoBillingAndDeployments() {
  const users = mockAllUsers();
  // Subscriptions for pro/business users
  const subs: Subscription[] = users
    .filter((u) => u.role === "pro" || u.role === "business")
    .map((u, i) => ({
      id: `sub_demo_${i}`, userId: u.id,
      plan: (u.role === "business" ? "business_monthly" : "pro_monthly") as Plan,
      status: "active", startedAt: daysAgo(30 + i), renewsAt: daysAgo(-(30 - i)),
    }));
  writeJSON("billing", "subs", subs);

  // Payments — 20 spread over 6 months
  const payments: Payment[] = [];
  for (let i = 0; i < 20; i++) {
    const u = users[i % users.length];
    if (!u) break;
    payments.push({
      id: `pay_demo_${i}`, userId: u.id,
      productId: i % 3 === 0 ? "business_monthly" : "pro_monthly",
      amountCents: i % 3 === 0 ? 9900 : 2400,
      status: i % 9 === 0 ? "refunded" : "paid",
      createdAt: daysAgo(Math.floor(Math.random() * 180)),
      invoiceUrl: `#invoice/demo_${i}`,
    });
  }
  writeJSON("billing", "payments", payments);

  // Deployments
  const projects = projectRepository.list().slice(0, 15);
  const deps: Deployment[] = projects.map((p, i) => ({
    id: `dep_demo_${i}`, projectId: p.id, provider: i % 2 === 0 ? "vercel" : "netlify",
    status: "ready", url: `https://${p.name.toLowerCase().replace(/\s+/g, "-")}.lumina.app`,
    logs: ["Build complete"], createdAt: daysAgo(Math.floor(Math.random() * 60)),
  }));
  writeJSON("deploy", "all", deps);
}

/** Bootstrap a sample Team Workspace for every Business/Enterprise demo user
 *  with a few demo teammates already on board. Idempotent. */
function seedBusinessTeamWorkspaces() {
  const owners = mockAllUsers().filter((u) => u.role === "business" || u.role === "enterprise");
  for (const owner of owners) {
    // Ensure personal workspace first so the entitlement check passes downstream.
    teamProvider.ensurePersonalTeam({ id: owner.id, name: owner.name, email: owner.email });
    const existing = teamProvider
      .listTeamsForUser(owner.id)
      .find((t) => !t.personal && t.ownerUserId === owner.id);
    if (existing) continue;
    const team = teamProvider.createTeam({
      name: `${owner.name} Studio`,
      ownerUserId: owner.id,
      personal: false,
      plan: owner.role === "enterprise" ? "enterprise" : "business",
    });
    // Add up to 3 demo teammates with assorted roles.
    const teammates = mockAllUsers()
      .filter((u) => u.id !== owner.id && !u.email.startsWith("admin"))
      .slice(0, 3);
    const roles = ["admin", "developer", "viewer"] as const;
    teammates.forEach((u, i) => {
      teamProvider.addMember({ teamId: team.id, userId: u.id, role: roles[i] });
    });
  }
}

/** One-time seed of demo notifications. Auth users are not seeded — users
 *  sign up to populate them. Projects are seeded lazily by the dashboard. */
export function runSeed() {
  migrate("notifications", 1, () => {
    const existing = readJSON("notifications", "all", null);
    if (!existing) {
      writeJSON("notifications", "all", mockNotifications);
    }
  });
  // Ensure the super-admin account is always available for the mock auth provider.
  try { seedAdminUser(); } catch {}
  migrate("admin_demo", 1, () => {
    try { seedDemoUsers(); seedDemoProjects(); seedDemoBillingAndDeployments(); } catch {}
  });
  migrate("business_team_workspaces", 1, () => {
    try { seedBusinessTeamWorkspaces(); } catch {}
  });
}

/** Dev utility — wipes all app-managed namespaces and re-seeds defaults. */
export function resetSeed() {
  ["projects", "notifications", "deploy", "billing", "usage", "settings", "auth", "__schema__"].forEach(clearNamespace);
  runSeed();
  if (typeof window !== "undefined") window.location.reload();
}