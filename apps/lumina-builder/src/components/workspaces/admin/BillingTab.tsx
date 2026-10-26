import { LuminaExecutiveCard } from "@/components/design-system/lumina";
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  listSubscriptions, listPayments, grantPlan, revokePlan, refundPayment, listUsers,
} from "@/services/adminService";
import type { Plan, Role } from "@/providers/types";
import { auth } from "@/providers/auth-registry";

const PLAN_TO_ROLE: Record<Plan, Role> = {
  free: "free", pro_monthly: "pro", pro_yearly: "pro", business_monthly: "business",
};

export function BillingTab() {
  const [subs, setSubs] = useState(listSubscriptions());
  const [pays, setPays] = useState(listPayments());
  const [users, setUsers] = useState(listUsers());
  const refresh = () => { setSubs(listSubscriptions()); setPays(listPayments()); setUsers(listUsers()); };
  useEffect(() => { return auth.onChange(refresh); }, []);

  const [grantUser, setGrantUser] = useState<string>("");
  const [grantPlanId, setGrantPlanId] = useState<Plan>("pro_monthly");

  return (
    <div className="min-w-0 space-y-6 text-white">
      <LuminaExecutiveCard variant="detail" title="Grant plan" className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={grantUser} onValueChange={setGrantUser}>
            <SelectTrigger aria-label="User to grant plan" className="w-64 max-w-full border-white/15 bg-white/[0.06] text-white"><SelectValue placeholder="Pick user…" /></SelectTrigger>
            <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={grantPlanId} onValueChange={(v) => setGrantPlanId(v as Plan)}>
            <SelectTrigger aria-label="Plan to grant" className="w-48 max-w-full border-white/15 bg-white/[0.06] text-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pro_monthly">Pro Monthly</SelectItem>
              <SelectItem value="pro_yearly">Pro Yearly</SelectItem>
              <SelectItem value="business_monthly">Business Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => {
            if (!grantUser) return toast.error("Pick a user");
            grantPlan(grantUser, grantPlanId, PLAN_TO_ROLE[grantPlanId]);
            refresh(); toast.success("Plan granted");
          }}>Grant</Button>
        </div>
      </LuminaExecutiveCard>

      <section>
        <LuminaExecutiveCard variant="detail" title="Subscriptions" className="min-w-0 text-white">
        <div className="max-h-[600px] overflow-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>User</TableHead><TableHead>Plan</TableHead><TableHead>Status</TableHead>
              <TableHead>Started</TableHead><TableHead>Renews</TableHead><TableHead className="w-32" />
            </TableRow></TableHeader>
            <TableBody>
              {subs.map((s) => {
                const u = users.find((x) => x.id === s.userId);
                return (
                  <TableRow key={s.id}>
                    <TableCell>{u?.email ?? s.userId}</TableCell>
                    <TableCell>{s.plan}</TableCell>
                    <TableCell><Badge variant={s.status === "active" ? "secondary" : "outline"}>{s.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(s.startedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.renewsAt ? new Date(s.renewsAt).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      {s.status === "active" && (
                        <Button size="sm" variant="outline" onClick={() => { revokePlan(s.userId); refresh(); toast.success("Plan revoked"); }}>Revoke</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        </LuminaExecutiveCard>
      </section>

      <section>
        <LuminaExecutiveCard variant="detail" title="Payments & Invoices" className="min-w-0 text-white">
        <div className="max-h-[600px] overflow-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>User</TableHead><TableHead>Product</TableHead>
              <TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead>
              <TableHead>Invoice</TableHead><TableHead className="w-24" />
            </TableRow></TableHeader>
            <TableBody>
              {pays.map((p) => {
                const u = users.find((x) => x.id === p.userId);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs">{new Date(p.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{u?.email ?? p.userId}</TableCell>
                    <TableCell>{p.productId}</TableCell>
                    <TableCell className="text-right">${(p.amountCents / 100).toFixed(2)}</TableCell>
                    <TableCell><Badge variant={p.status === "paid" ? "secondary" : p.status === "refunded" ? "outline" : "destructive"}>{p.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.invoiceUrl ?? "—"}</TableCell>
                    <TableCell>
                      {p.status === "paid" && (
                        <Button size="sm" variant="outline" onClick={() => { refundPayment(p.id); refresh(); toast.success("Refunded"); }}>Refund</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        </LuminaExecutiveCard>
      </section>
    </div>
  );
}
