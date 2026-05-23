import { useEffect, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreVertical, Search } from "lucide-react";
import { toast } from "sonner";
import { listAllProjects, deleteProject, transferProjectOwnership, listUsers } from "@/services/adminService";
import { projectRepository } from "@/services/projectRepository";
import { useWorkspace } from "@/context/WorkspaceContext";

export function ProjectsTab() {
  const { setView, setActiveProject } = useWorkspace();
  const [projects, setProjects] = useState(listAllProjects());
  const [users] = useState(listUsers());
  const [q, setQ] = useState("");
  const refresh = () => setProjects(listAllProjects());
  useEffect(() => projectRepository.onChange(refresh), []);
  const filtered = useMemo(() => projects.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase())), [projects, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects…" className="pl-8" />
        </div>
        <div className="text-sm text-muted-foreground">{filtered.length} projects</div>
      </div>
      <div className="glass rounded-xl overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Name</TableHead><TableHead>Owner</TableHead><TableHead>Type</TableHead>
            <TableHead>Status</TableHead><TableHead>Updated</TableHead><TableHead className="w-10" />
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((p) => {
              const owner = users.find((u) => u.id === p.ownerId);
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{owner?.email ?? "—"}</TableCell>
                  <TableCell>{p.type}</TableCell>
                  <TableCell><Badge variant="secondary">{p.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(p.updatedAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setActiveProject(p); setView("workspace"); }}>Open</DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <div className="flex items-center gap-2 w-full">
                            <span className="text-xs">Transfer to</span>
                            <Select onValueChange={(v) => { transferProjectOwnership(p.id, v); refresh(); toast.success("Ownership transferred"); }}>
                              <SelectTrigger className="h-7 w-40"><SelectValue placeholder="user…" /></SelectTrigger>
                              <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm(`Delete "${p.name}"?`)) { deleteProject(p.id); } }}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
