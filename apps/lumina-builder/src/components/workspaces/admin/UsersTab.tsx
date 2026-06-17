import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Search } from "lucide-react";
import { toast } from "sonner";
import {
  listUsers, updateUserRole, suspendUser, reactivateUser, deleteUser,
  resetUserPassword, impersonateUser, type AdminUserRow,
} from "@/services/adminService";
import { auth } from "@/providers/auth-registry";
import type { Role } from "@/providers/types";
import { AdminUserDeleteDialog } from "@/components/workspaces/admin/dialogs/AdminUserDeleteDialog";

const ROLES: Role[] = ["free", "pro", "business", "enterprise", "inhouse-dev", "admin"];

export function UsersTab() {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [q, setQ] = useState("");

  const [deleteTarget, setDeleteTarget] =
    useState<AdminUserRow | null>(null);

  const [deleting, setDeleting] =
    useState(false);
  const refresh = () => setRows(listUsers());
  useEffect(() => { refresh(); return auth.onChange(refresh); }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter((u) => !t || u.email.toLowerCase().includes(t) || u.name.toLowerCase().includes(t));
  }, [rows, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…" className="pl-8" />
        </div>
        <div className="text-sm text-muted-foreground">{filtered.length} users</div>
      </div>
      <div className="glass rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Projects</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Select value={u.role} onValueChange={(v) => { updateUserRole(u.id, v as Role); refresh(); toast.success("Role updated"); }}>
                    <SelectTrigger className="h-7 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {u.suspended
                    ? <Badge variant="destructive">Suspended</Badge>
                    : <Badge variant="secondary">Active</Badge>}
                </TableCell>
                <TableCell className="text-right">{u.projectCount}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { impersonateUser(u.id); toast.success(`Impersonating ${u.email}`); setTimeout(() => window.location.reload(), 300); }}>
                        Impersonate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { const pw = resetUserPassword(u.id); toast.success(`Password reset to: ${pw}`); }}>
                        Reset password
                      </DropdownMenuItem>
                      {u.suspended
                        ? <DropdownMenuItem onClick={() => { reactivateUser(u.id); refresh(); }}>Reactivate</DropdownMenuItem>
                        : <DropdownMenuItem onClick={() => { suspendUser(u.id); refresh(); }}>Suspend</DropdownMenuItem>}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setDeleteTarget(u);
                        }}
                      >
                        Delete user
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}