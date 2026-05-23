import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getProviderConfiguration, setProviderConfiguration } from "@/services/adminService";
import type { ProviderConfig, ProviderKey, ProviderMode } from "@/services/providerConfigService";

const KEYS: ProviderKey[] = ["auth", "billing", "ai", "repo", "deploy", "storage", "usage"];

export function ProvidersTab() {
  const [cfg, setCfg] = useState<ProviderConfig>(getProviderConfiguration());
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Switch each capability between Mock and Real. Real adapters require API keys and a reload to take effect.</p>
      <div className="glass rounded-xl divide-y divide-border">
        {KEYS.map((k) => (
          <div key={k} className="flex items-center justify-between p-4">
            <div>
              <div className="font-medium text-sm capitalize">{k}</div>
              <div className="text-xs text-muted-foreground">Currently: {cfg[k]}</div>
            </div>
            <Select value={cfg[k]} onValueChange={(v) => {
              const next = { ...cfg, [k]: v as ProviderMode };
              setCfg(next);
              setProviderConfiguration({ [k]: v as ProviderMode });
              toast.success(`${k} → ${v}`);
            }}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mock">Mock</SelectItem>
                <SelectItem value="real">Real</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <Button variant="outline" onClick={() => window.location.reload()}>Reload to apply</Button>
    </div>
  );
}
