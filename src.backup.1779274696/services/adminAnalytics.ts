import { readJSON } from "@/lib/persistence";
import type { Payment, Subscription, User } from "@/providers/types";
import { mockAllUsers } from "@/providers/auth/MockAuthProvider";
import { projectRepository } from "@/services/projectRepository";

export interface AdminAnalytics {
  totalUsers: number;
  usersByRole: Record<string, number>;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  totalProjects: number;
  totalDeployments: number;
  totalAIExecutions: number;
  totalTransformations: number;
  totalAuditReports: number;
  totalPayments: number;
  revenueByMonth: { month: string; revenue: number }[];
  signupsByMonth: { month: string; count: number }[];
  aiUsageByDay: { day: string; count: number }[];
}

function monthKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function dayKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface UsageRow { aiExecutions: number; deployments: number; transformations: number; projects: number; audits: number }
interface UsageEvent { ts: number; userId: string; kind: "ai" | "deploy" | "transform" | "audit" }

export function getAdminAnalytics(): AdminAnalytics {
  const users: User[] = mockAllUsers();
  const subs = readJSON<Subscription[]>("billing", "subs", []);
  const payments = readJSON<Payment[]>("billing", "payments", []);
  const projects = projectRepository.list();

  const usersByRole: Record<string, number> = {};
  users.forEach((u) => { usersByRole[u.role] = (usersByRole[u.role] ?? 0) + 1; });

  const activeSubs = subs.filter((s) => s.status === "active");
  const planPriceMonthly: Record<string, number> = {
    pro_monthly: 24, pro_yearly: 240 / 12, business_monthly: 99,
  };
  const mrr = activeSubs.reduce((sum, s) => sum + (planPriceMonthly[s.plan] ?? 0), 0);

  // Totals (sum across all users' usage rows)
  let aiExec = 0, deployments = 0, transformations = 0, audits = 0;
  users.forEach((u) => {
    const row = readJSON<UsageRow | null>("usage", u.id, null);
    if (!row) return;
    aiExec += row.aiExecutions ?? 0;
    deployments += row.deployments ?? 0;
    transformations += row.transformations ?? 0;
    audits += row.audits ?? 0;
  });

  // Revenue by month from payments
  const revMap = new Map<string, number>();
  payments.filter((p) => p.status === "paid").forEach((p) => {
    const k = monthKey(p.createdAt);
    revMap.set(k, (revMap.get(k) ?? 0) + p.amountCents / 100);
  });

  // Signups by month
  const signMap = new Map<string, number>();
  users.forEach((u) => {
    const k = monthKey(u.createdAt);
    signMap.set(k, (signMap.get(k) ?? 0) + 1);
  });

  // AI usage by day from optional event log
  const events = readJSON<UsageEvent[]>("usage", "__events__", []);
  const aiDayMap = new Map<string, number>();
  events.filter((e) => e.kind === "ai").forEach((e) => {
    const k = dayKey(e.ts);
    aiDayMap.set(k, (aiDayMap.get(k) ?? 0) + 1);
  });

  const sortByKey = <T extends { month?: string; day?: string }>(arr: T[]) =>
    arr.sort((a, b) => String(a.month ?? a.day).localeCompare(String(b.month ?? b.day)));

  return {
    totalUsers: users.length,
    usersByRole,
    activeSubscriptions: activeSubs.length,
    monthlyRecurringRevenue: Math.round(mrr * 100) / 100,
    annualRecurringRevenue: Math.round(mrr * 12 * 100) / 100,
    totalProjects: projects.length,
    totalDeployments: deployments,
    totalAIExecutions: aiExec,
    totalTransformations: transformations,
    totalAuditReports: audits,
    totalPayments: payments.length,
    revenueByMonth: sortByKey(Array.from(revMap, ([month, revenue]) => ({ month, revenue }))),
    signupsByMonth: sortByKey(Array.from(signMap, ([month, count]) => ({ month, count }))),
    aiUsageByDay: sortByKey(Array.from(aiDayMap, ([day, count]) => ({ day, count }))),
  };
}