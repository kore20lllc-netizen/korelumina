import { useEffect, useState } from "react";
import { getAdminAnalytics, type AdminAnalytics } from "@/services/adminAnalytics";
import { GlowCard } from "@/components/lumina/GlowCard";
import { Users, CreditCard, TrendingUp, Box, Rocket, Sparkles, Wand2, ShieldCheck, DollarSign } from "lucide-react";

function Kpi({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <GlowCard className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
    </GlowCard>
  );
}

function Bars({ data, label }: { data: { k: string; v: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.v));
  return (
    <GlowCard className="p-4">
      <div className="text-sm font-medium mb-3">{label}</div>
      {data.length === 0 ? (
        <div className="text-xs text-muted-foreground">No data yet.</div>
      ) : (
        <div className="flex items-end gap-1 h-32">
          {data.slice(-24).map((d) => (
            <div key={d.k} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-button-lumina rounded-sm" style={{ height: `${(d.v / max) * 100}%`, minHeight: 2 }} title={`${d.k}: ${d.v}`} />
            </div>
          ))}
        </div>
      )}
    </GlowCard>
  );
}

export function OverviewTab() {
  const [a, setA] = useState<AdminAnalytics>(() => getAdminAnalytics());
  useEffect(() => {
    const t = setInterval(() => setA(getAdminAnalytics()), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Bars label="Revenue by month ($)" data={a.revenueByMonth.map((r) => ({ k: r.month, v: r.revenue }))} />
        <Bars label="Signups by month" data={a.signupsByMonth.map((r) => ({ k: r.month, v: r.count }))} />
        <Bars label="AI usage by day" data={a.aiUsageByDay.map((r) => ({ k: r.day, v: r.count }))} />
        <GlowCard className="p-4">
          <div className="text-sm font-medium mb-3">Plan distribution</div>
          <div className="space-y-2">
            {Object.entries(a.usersByRole).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between text-sm">
                <span className="capitalize">{role}</span>
                <span className="text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>
    </div>
  );
}