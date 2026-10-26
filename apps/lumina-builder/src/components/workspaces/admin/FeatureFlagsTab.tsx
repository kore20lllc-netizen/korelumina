import { LuminaExecutiveCard } from "@/components/design-system/lumina";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { listFeatureFlags, updateFeatureFlag } from "@/services/adminService";
import type { FeatureFlag } from "@/lib/featureFlags";
import { toast } from "sonner";

export function FeatureFlagsTab() {
  const [flags, setFlags] = useState(listFeatureFlags());
  return (
    <LuminaExecutiveCard variant="detail" title="Feature flags" className="min-w-0 text-white">
      <div className="max-h-[600px] overflow-y-auto divide-y divide-cyan-300/10">
      {flags.map((f) => (
        <div key={f.flag} className="flex items-center justify-between gap-4 py-4">
          <div>
            <div className="break-words font-medium text-sm">{f.flag}</div>
            <div className="text-xs text-muted-foreground">Enabled: {String(f.enabled)}</div>
          </div>
          <Switch
            aria-label={`Enable ${f.flag}`}
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
    </LuminaExecutiveCard>
  );
}
