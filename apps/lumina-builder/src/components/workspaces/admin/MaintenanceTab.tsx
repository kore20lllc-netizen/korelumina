import { LuminaExecutiveCard, LuminaExecutiveMetricGrid } from "@/components/design-system/lumina";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exportSnapshot, importSnapshot } from "@/services/adminService";
import {
  resetAllData,
  rerunSeed,
  clearNotifications,
  clearAuditLog,
} from "@/services/adminService";
import { getSystemHealth, type SystemHealth } from "@/services/systemHealthService";
import { AdminResetDataDialog } from "@/components/workspaces/admin/dialogs/AdminResetDataDialog";

export function MaintenanceTab() {
  const [health, setHealth] = useState<SystemHealth>(() => getSystemHealth());
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { const t = setInterval(() => setHealth(getSystemHealth()), 2000); return () => clearInterval(t); }, []);

  const doExport = () => {
    const json = exportSnapshot();
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `lumina-snapshot-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Snapshot exported");
  };
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const text = await f.text();
    try { importSnapshot(text); } catch { toast.error("Invalid snapshot file"); }
  };

  return (
    <div className="min-w-0 space-y-6 text-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <LuminaExecutiveCard variant="detail" title="Data" className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setResetDialogOpen(true)}
            >
              Reset all data
            </Button>
            <Button variant="outline" onClick={() => { rerunSeed(); toast.success("Re-seeded"); }}>Re-seed</Button>
            <Button variant="outline" onClick={doExport}>Export snapshot</Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>Import snapshot</Button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onFile} />
          </div>
        </LuminaExecutiveCard>
        <LuminaExecutiveCard variant="detail" title="Logs & notifications" className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => { clearAuditLog(); toast.success("Audit logs cleared"); }}>Clear audit logs</Button>
            <Button variant="outline" onClick={() => { clearNotifications(); toast.success("Notifications cleared"); }}>Clear notifications</Button>
            <Button variant="outline" onClick={() => { setHealth(getSystemHealth()); toast.success("Recalculated"); }}>Recalculate analytics</Button>
          </div>
        </LuminaExecutiveCard>
      </div>

      <section>
        <h3 className="text-sm font-semibold mb-2">System health</h3>
        <LuminaExecutiveMetricGrid className="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-4">
          <LuminaExecutiveCard title="Storage used" value={`${(health.localStorageBytes / 1024).toFixed(1)} KB`} />
          <LuminaExecutiveCard title="Quota est." value={`${(health.localStorageQuotaEstimate / (1024 * 1024)).toFixed(0)} MB`} />
          <LuminaExecutiveCard title="Users seeded" value={String(health.totalUsers)} />
          <LuminaExecutiveCard title="Admin seeded" value={health.adminSeeded ? "Yes" : "No"} />
        </LuminaExecutiveMetricGrid>
        <LuminaExecutiveCard variant="detail" title="System details" className="min-w-0">
          <div className="max-h-[600px] overflow-auto grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="font-semibold mb-2">Namespaces</div>
            <ul className="space-y-1">
              {health.namespaces.map((n) => (
                <li key={n.namespace} className="flex justify-between text-muted-foreground">
                  <span>{n.namespace}</span><span>{(n.bytes / 1024).toFixed(1)} KB · {n.keys} keys</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Schema versions</div>
            <ul className="space-y-1">
              {Object.entries(health.schemaVersions).map(([ns, v]) => (
                <li key={ns} className="flex justify-between text-muted-foreground"><span>{ns}</span><span>v{v}</span></li>
              ))}
            </ul>
            <div className="font-semibold mt-4 mb-2">Provider config</div>
            <ul className="space-y-1">
              {Object.entries(health.providerConfig).map(([k, v]) => (
                <li key={k} className="flex justify-between text-muted-foreground"><span>{k}</span><span>{v}</span></li>
              ))}
            </ul>
          </div>
          </div>
        </LuminaExecutiveCard>
      </section>
      <AdminResetDataDialog
        open={resetDialogOpen}
        resetting={resetting}
        onOpenChange={(open) => {
          if (!resetting) {
            setResetDialogOpen(open);
          }
        }}
        onConfirm={() => {
          try {
            setResetting(true);

            resetAllData();

            toast.success(
              "All data reset",
            );

            setResetDialogOpen(false);
          } finally {
            setResetting(false);
          }
        }}
      />
    </div>
  );
}
