import { LuminaExecutiveCard, ExecutiveFilterSurface } from "@/components/design-system/lumina";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listLogs, onLogsChange, searchLogs, type AuditLog } from "@/services/auditLogService";

export function AuditLogsTab() {
  const [logs, setLogs] = useState<AuditLog[]>(() => listLogs());
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  useEffect(() => onLogsChange(() => setLogs(listLogs())), []);
  const filtered = useMemo(() => searchLogs({ q: q || undefined, action: action || undefined }).slice(0, 500), [logs, q, action]);
  return (
    <div className="min-w-0 space-y-5 text-white">
      <ExecutiveFilterSurface
        ariaLabel="Audit log filters"
        summary={<span className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Audit trail</span>}
        primaryControls={<>
          <Input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search audit logs" placeholder="Search…" className="lg:col-span-2 border-white/15 bg-white/[0.06] text-white placeholder:text-white/40 focus-visible:ring-cyan-300/40" />
          <Input value={action} onChange={(e) => setAction(e.target.value)} aria-label="Filter by action" placeholder="Action filter (e.g. user.)" className="lg:col-span-2 border-white/15 bg-white/[0.06] text-white placeholder:text-white/40 focus-visible:ring-cyan-300/40" />
        </>}
        actions={<span className="text-xs text-white/60" aria-live="polite">{filtered.length} of {logs.length}</span>}
      />
      <LuminaExecutiveCard variant="detail" title="Audit logs" className="min-w-0 text-white">
        <div className="max-h-[600px] overflow-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Time</TableHead><TableHead>Actor</TableHead><TableHead>Action</TableHead>
            <TableHead>Entity</TableHead><TableHead>Metadata</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</TableCell>
                <TableCell className="text-xs">{l.actorEmail}</TableCell>
                <TableCell className="text-xs font-medium">{l.action}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{l.entityType ? `${l.entityType}:${l.entityId ?? ""}` : "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground truncate max-w-xs">{l.metadata ? JSON.stringify(l.metadata) : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </LuminaExecutiveCard>
    </div>
  );
}
