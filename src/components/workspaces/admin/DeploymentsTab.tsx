import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { readJSON, subscribe } from "@/lib/persistence";
import type { Deployment } from "@/providers/types";
import { listAllProjects } from "@/services/adminService";

export function DeploymentsTab() {
  const [deps, setDeps] = useState<Deployment[]>(() => readJSON<Deployment[]>("deploy", "all", []));
  useEffect(() => subscribe("deploy", () => setDeps(readJSON<Deployment[]>("deploy", "all", []))), []);
  const projects = listAllProjects();
  return (
    <div className="glass rounded-xl overflow-hidden">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Project</TableHead><TableHead>Provider</TableHead><TableHead>Status</TableHead>
          <TableHead>URL</TableHead><TableHead>Created</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {deps.map((d) => {
            const p = projects.find((x) => x.id === d.projectId);
            return (
              <TableRow key={d.id}>
                <TableCell>{p?.name ?? d.projectId}</TableCell>
                <TableCell>{d.provider}</TableCell>
                <TableCell><Badge variant={d.status === "ready" ? "secondary" : d.status === "error" ? "destructive" : "outline"}>{d.status}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground truncate max-w-xs">{d.url ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            );
          })}
          {deps.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No deployments yet.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
