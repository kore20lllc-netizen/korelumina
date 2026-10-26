import { LuminaExecutiveCard, LuminaExecutiveMetricGrid } from "@/components/design-system/lumina";
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    <div className="min-w-0 space-y-5 text-white">
      <LuminaExecutiveMetricGrid className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <LuminaExecutiveCard title="Total executions" value={String(analytics.totalAIExecutions)} />
        <LuminaExecutiveCard title="Estimated cost" value={`$${estCost.toFixed(2)}`} />
        <LuminaExecutiveCard title="Days with activity" value={String(analytics.aiUsageByDay.length)} />
      </LuminaExecutiveMetricGrid>
      <LuminaExecutiveCard variant="detail" title="AI executions by user" className="min-w-0 text-white">
        <div className="max-h-[600px] overflow-auto">
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
      </LuminaExecutiveCard>
    </div>
  );
}
