import { useEffect, useState } from "react";
import { getAdminAnalytics, type AdminAnalytics } from "@/services/adminAnalytics";
import {
  Users, CreditCard, TrendingUp, Box, Rocket,
  Sparkles, Wand2, ShieldCheck, DollarSign,
} from "lucide-react";
import { LuminaExecutiveCard, LuminaExecutiveMetricGrid } from "@/components/design-system/lumina";
import type { LucideIcon } from "lucide-react";

function Kpi({ label, value, icon: Icon }: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <LuminaExecutiveCard
      title={label}
      value={String(value)}
      icon={<Icon className="h-[18px] w-[18px] text-cyan-300" aria-hidden="true" />}
      className="min-w-0"
      titleClassName="text-white/72"
    />
  );
}

function Bars({
  data,
  label,
}: {
  data: { k: string; v: number }[];
  label: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.v));

  return (
    <LuminaExecutiveCard variant="detail" title={label} className="min-w-0">

      {data.length === 0 ? (
        <p className="text-sm text-white/50">No data yet.</p>
      ) : (
        <div className="flex h-40 items-end gap-1.5 overflow-hidden border-b border-white/10 pb-2">
          {data.slice(-24).map((d) => (
            <div
              key={d.k}
              className="flex h-full min-w-0 flex-1 flex-col justify-end"
              title={`${d.k}: ${d.v}`}
            >
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-blue-600/60 to-cyan-300/90"
                style={{
                  height: `${Math.max(2, (d.v / max) * 100)}%`,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </LuminaExecutiveCard>
  );
}

export function OverviewTab() {
  const [a, setA] = useState<AdminAnalytics>(() => getAdminAnalytics());

  useEffect(() => {
    const timer = setInterval(() => setA(getAdminAnalytics()), 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-w-0 space-y-6 text-white">
      <section>
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/70">
            Platform intelligence
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
            Administration Overview
          </h2>
          <p className="mt-1 text-sm text-white/50">
            Platform activity, subscriptions, and operational metrics.
          </p>
        </div>

        <LuminaExecutiveMetricGrid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Kpi label="Total Users" value={a.totalUsers} icon={Users} />
          <Kpi label="Active Subs" value={a.activeSubscriptions} icon={CreditCard} />
          <Kpi label="MRR" value={`$${a.monthlyRecurringRevenue.toFixed(0)}`} icon={DollarSign} />
          <Kpi label="ARR" value={`$${a.annualRecurringRevenue.toFixed(0)}`} icon={TrendingUp} />
          <Kpi label="Projects" value={a.totalProjects} icon={Box} />
          <Kpi label="Deployments" value={a.totalDeployments} icon={Rocket} />
          <Kpi label="AI Executions" value={a.totalAIExecutions} icon={Sparkles} />
          <Kpi label="Transformations" value={a.totalTransformations} icon={Wand2} />
          <Kpi label="Audit Reports" value={a.totalAuditReports} icon={ShieldCheck} />
          <Kpi label="Payments" value={a.totalPayments} icon={CreditCard} />
        </LuminaExecutiveMetricGrid>
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
        <Bars
          label="Revenue by month ($)"
          data={a.revenueByMonth.map((r) => ({
            k: r.month,
            v: r.revenue,
          }))}
        />
        <Bars
          label="Signups by month"
          data={a.signupsByMonth.map((r) => ({
            k: r.month,
            v: r.count,
          }))}
        />
        <Bars
          label="AI usage by day"
          data={a.aiUsageByDay.map((r) => ({
            k: r.day,
            v: r.count,
          }))}
        />

        <LuminaExecutiveCard variant="detail" title="Plan distribution" className="min-w-0">

          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {Object.entries(a.usersByRole).map(([role, count]) => (
              <div
                key={role}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-sm"
              >
                <span className="capitalize text-white/75">{role}</span>
                <span className="font-semibold text-cyan-100">{count}</span>
              </div>
            ))}
          </div>
        </LuminaExecutiveCard>
      </section>
    </div>
  );
}
