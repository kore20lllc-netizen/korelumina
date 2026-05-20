import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GlowCard } from "@/components/lumina/GlowCard";
import { readJSON } from "@/lib/persistence";
import { listUsers } from "@/services/adminService";
import { getAdminAnalytics } from "@/services/adminAnalytics";

interface UsageRow { aiExecutions: number; deployments: number; transformations: number; projects: number; audits: number }

export function AIUsageTab() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 3000); return () => clearInterval(t); }, []);
  void tick;
  const users = listUsers();
  const rows = users.map((u) => {
    const r = readJSON<UsageRow | null>("usage", u.id, null);
    return { user: u, aiExecutions: r?.aiExecutions ?? 0 };
  }).sort((a, b) => b.aiExecutions - a.aiExecutions);
  const analytics = getAdminAnalytics();
  const estCost = analytics.totalAIExecutions * 0.012;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <GlowCard className="p-4"><div className="text-xs text-muted-foreground">Total executions</div><div className="text-2xl font-semibold">{analytics.totalAIExecutions}</div></GlowCard>
        <GlowCard className="p-4"><div className="text-xs text-muted-foreground">Estimated cost</div><div className="text-2xl font-semibold">${estCost.toFixed(2)}</div></GlowCard>
        <GlowCard className="p-4"><div className="text-xs text-muted-foreground">Days with activity</div><div className="text-2xl font-semibold">{analytics.aiUsageByDay.length}</div></GlowCard>
      </div>
      <div className="glass rounded-xl overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>User</TableHead><TableHead className="text-right">AI Executions</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.filter((r) => r.aiExecutions > 0).map((r) => (
              <TableRow key={r.user.id}><TableCell>{r.user.email}</TableCell><TableCell className="text-right">{r.aiExecutions}</TableCell></TableRow>
            ))}
            {rows.every((r) => r.aiExecutions === 0) && (
              <TableRow><TableCell colSpan={2} className="text-center text-sm text-muted-foreground py-8">No AI activity yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
