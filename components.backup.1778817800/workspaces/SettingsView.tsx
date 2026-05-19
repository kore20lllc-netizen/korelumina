import { useState } from "react";
import { User, CreditCard, Key, Plug, Shield, ArrowLeft, Check } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { mockIntegrations } from "@/lib/mockData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Section = "profile" | "billing" | "api" | "integrations" | "security";

const nav: { id: Section; label: string; Icon: any }[] = [
  { id: "profile",      label: "Profile",      Icon: User },
  { id: "billing",      label: "Billing",      Icon: CreditCard },
  { id: "api",          label: "API Keys",     Icon: Key },
  { id: "integrations", label: "Integrations", Icon: Plug },
  { id: "security",     label: "Security",     Icon: Shield },
];

export function SettingsView() {
  const { setView, usage } = useWorkspace();
  const [active, setActive] = useState<Section>("profile");

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">
        <button onClick={() => setView("dashboard")} className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6">
          <ArrowLeft className="h-3 w-3" /> Back to projects
        </button>
        <h1 className="font-display text-3xl tracking-[-0.02em] mb-8">Settings</h1>
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
          <nav className="glass rounded-2xl p-2 h-max">
            {nav.map((n) => {
              const I = n.Icon;
              const isActive = active === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setActive(n.id)}
                  className={cn(
                    "w-full h-9 px-3 rounded-lg text-[12px] flex items-center gap-2 transition",
                    isActive ? "bg-surface-3 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface-1",
                  )}
                >
                  <I className="h-3.5 w-3.5" />
                  {n.label}
                </button>
              );
            })}
          </nav>

          <div className="glass rounded-2xl p-6 min-h-[320px]">
            {active === "profile" && (
              <Section title="Profile">
                <Row label="Name"><input defaultValue="Kore Lumina" className="h-9 px-3 rounded-lg bg-surface-1 border border-border text-[13px] outline-none focus:border-violet/50 transition" /></Row>
                <Row label="Email"><input defaultValue="kore@lumina.app" className="h-9 px-3 rounded-lg bg-surface-1 border border-border text-[13px] outline-none focus:border-violet/50 transition" /></Row>
                <div className="flex justify-end pt-2">
                  <LuminaButton size="md" onClick={() => toast.success("Profile saved")}>Save</LuminaButton>
                </div>
              </Section>
            )}
            {active === "billing" && (
              <Section title="Billing">
                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-1 border border-border">
                  <div>
                    <div className="text-[12px] uppercase tracking-widest text-muted-foreground">Current plan</div>
                    <div className="font-display text-lg capitalize mt-0.5">{usage.plan}</div>
                  </div>
                  <LuminaButton size="md" onClick={() => setView("pricing")}>Upgrade</LuminaButton>
                </div>
              </Section>
            )}
            {active === "api" && (
              <Section title="API Keys">
                <div className="rounded-xl bg-surface-1 border border-border p-4 flex items-center justify-between">
                  <code className="text-[12px] text-muted-foreground">lum_••••••••••••••••</code>
                  <LuminaButton variant="ghost" size="sm" onClick={() => toast("Key rotated")}>Rotate</LuminaButton>
                </div>
              </Section>
            )}
            {active === "integrations" && (
              <Section title="Integrations">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {mockIntegrations.map((i) => (
                    <div key={i.id} className="p-4 rounded-xl glass flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium">{i.name}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{i.description}</div>
                      </div>
                      <LuminaButton variant={i.connected ? "ghost" : "primary"} size="sm" onClick={() => toast(i.connected ? `${i.name} disconnected` : `${i.name} connected`)}>
                        {i.connected ? (<><Check className="h-3 w-3" /> Connected</>) : "Connect"}
                      </LuminaButton>
                    </div>
                  ))}
                </div>
              </Section>
            )}
            {active === "security" && (
              <Section title="Security">
                <Row label="Two-factor auth"><LuminaButton variant="ghost" size="sm">Enable</LuminaButton></Row>
                <Row label="Active sessions"><span className="text-[12px] text-muted-foreground">1 device</span></Row>
              </Section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-lg mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  );
}