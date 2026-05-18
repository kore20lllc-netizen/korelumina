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
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="max-w-xs" />
        <Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="Action filter (e.g. user.)" className="max-w-xs" />
        <div className="text-xs text-muted-foreground self-center ml-auto">{filtered.length} of {logs.length}</div>
      </div>
      <div className="glass rounded-xl overflow-hidden max-h-[600px] overflow-y-auto">
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
    </div>
  );
}
