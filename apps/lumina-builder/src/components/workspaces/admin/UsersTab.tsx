import { LuminaExecutiveCard, ExecutiveFilterSurface } from "@/components/design-system/lumina";
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
import { auth, usesVerifiedSessions } from "@/providers/auth-registry";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  assignStaffRole, listDirectoryUsers, STAFF_ROLES,
  type DirectoryUser, type RoleAssignmentRecord, type StaffRole,
} from "@/services/adminDirectoryService";
import type { Role } from "@/providers/types";
import { AdminUserDeleteDialog } from "@/components/workspaces/admin/dialogs/AdminUserDeleteDialog";

const ROLES: Role[] = ["free", "pro", "business", "enterprise", "inhouse-dev", "admin"];

/*
 * SEC-1e (ADR-0043 Decision 3): with real sign-in, Users is the real
 * Supabase directory through Runtime. Staff roles are assigned here, with a
 * reason, and every change is recorded by Runtime. Plans come from billing.
 * The demo directory below remains for the development-only mock sign-in.
 */
export function UsersTab() {
  return usesVerifiedSessions ? <DirectoryUsersTab /> : <DemoUsersTab />;
}

function DirectoryUsersTab() {
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [assignments, setAssignments] = useState<RoleAssignmentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [pending, setPending] = useState<{ user: DirectoryUser; role: StaffRole } | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const result = await listDirectoryUsers();
      setUsers(result.users);
      setAssignments(result.assignments);
      setError(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return users.filter((u) => !t || u.email.toLowerCase().includes(t));
  }, [users, q]);

  const confirm = async () => {
    if (!pending) return;
    setSaving(true);
    try {
      await assignStaffRole(pending.user.id, pending.role, reason);
      toast.success(`${pending.user.email} is now ${pending.role}`, {
        description: "Recorded. It takes effect at their next sign-in.",
      });
      setPending(null);
      setReason("");
      await refresh();
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : String(failure));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-w-0 space-y-5 text-white">
      <ExecutiveFilterSurface
        ariaLabel="User directory filters"
        summary={<span className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">User directory</span>}
        primaryControls={(
        <div className="relative min-w-0 sm:col-span-2 lg:col-span-4">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search email" placeholder="Search email…" className="border-white/15 bg-white/[0.06] pl-8 text-white placeholder:text-white/40 focus-visible:ring-cyan-300/40" />
        </div>
        )}
        actions={<span className="text-sm text-white/60" aria-live="polite">{loading ? "Loading…" : `${filtered.length} users`}</span>}
      />

      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      ) : null}

      <LuminaExecutiveCard variant="detail" title="Users" className="min-w-0">
        <div className="max-h-[65vh] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Last sign-in</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => {
              const role = (u.role ?? "user") as string;
              const isPlan = !(STAFF_ROLES as string[]).includes(role);
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-white/90">{u.email}</TableCell>
                  <TableCell>
                    {isPlan ? (
                      <Badge variant="secondary" title="Plans are assigned by billing">{role}</Badge>
                    ) : (
                      <Select
                        value={role}
                        onValueChange={(next) => {
                          if (next !== role) setPending({ user: u, role: next as StaffRole });
                        }}
                      >
                        <SelectTrigger className="h-8 w-36 border-white/15 bg-white/[0.06] text-white"><SelectValue /></SelectTrigger>
                        <SelectContent>{STAFF_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleString() : "Never"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </LuminaExecutiveCard>

      {assignments.length > 0 ? (
        <LuminaExecutiveCard variant="detail" title="Recent role assignments">
          <div className="max-h-64 overflow-y-auto">
          <ul className="space-y-1.5 text-sm">
            {assignments.slice(0, 10).map((record) => (
              <li key={record.id} className="text-muted-foreground">
                <span className="text-foreground">{record.email}</span>: {record.fromRole ?? "user"} → {record.toRole} · {record.reason} · {new Date(record.assignedAt).toLocaleString()}
              </li>
            ))}
          </ul>
          </div>
        </LuminaExecutiveCard>
      ) : null}

      <AlertDialog open={pending !== null} onOpenChange={(open) => { if (!open) { setPending(null); setReason(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make {pending?.user.email} {pending?.role}?</AlertDialogTitle>
            <AlertDialogDescription>
              The role is set by Runtime and recorded with your reason. It takes effect at their next sign-in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why? (kept in the audit record)" />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={saving || reason.trim().length < 3} onClick={(e) => { e.preventDefault(); void confirm(); }}>
              {saving ? "Saving…" : "Assign role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DemoUsersTab() {
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
    <div className="min-w-0 space-y-5 text-white">
      <ExecutiveFilterSurface
        ariaLabel="User directory filters"
        summary={<span className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">User directory</span>}
        primaryControls={(
        <div className="relative min-w-0 sm:col-span-2 lg:col-span-4">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search name or email" placeholder="Search name or email…" className="border-white/15 bg-white/[0.06] pl-8 text-white placeholder:text-white/40 focus-visible:ring-cyan-300/40" />
        </div>
        )}
        actions={<span className="text-sm text-white/60" aria-live="polite">{filtered.length} users</span>}
      />
      <LuminaExecutiveCard variant="detail" title="Users" className="min-w-0">
        <div className="max-h-[65vh] overflow-auto">
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
                <TableCell className="font-medium text-white/90">{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Select value={u.role} onValueChange={(v) => { updateUserRole(u.id, v as Role); refresh(); toast.success("Role updated"); }}>
                    <SelectTrigger className="h-8 w-32 border-white/15 bg-white/[0.06] text-white"><SelectValue /></SelectTrigger>
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
      </LuminaExecutiveCard>
    </div>
  );
}