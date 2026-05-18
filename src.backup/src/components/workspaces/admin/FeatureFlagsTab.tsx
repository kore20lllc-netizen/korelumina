import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { listFeatureFlags, updateFeatureFlag } from "@/services/adminService";
import type { FeatureFlag } from "@/lib/featureFlags";
import { toast } from "sonner";

export function FeatureFlagsTab() {
  const [flags, setFlags] = useState(listFeatureFlags());
  return (
    <div className="glass rounded-xl divide-y divide-border">
      {flags.map((f) => (
        <div key={f.flag} className="flex items-center justify-between p-4">
          <div>
            <div className="font-medium text-sm">{f.flag}</div>
            <div className="text-xs text-muted-foreground">Enabled: {String(f.enabled)}</div>
          </div>
          <Switch
            checked={f.enabled}
            onCheckedChange={(v) => {
              updateFeatureFlag(f.flag as FeatureFlag, v);
              setFlags(listFeatureFlags());
              toast.success(`${f.flag} ${v ? "enabled" : "disabled"}`);
            }}
          />
        </div>
      ))}
    </div>
  );
}
