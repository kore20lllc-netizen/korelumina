import { useMemo, useState } from "react";
import { Search, Plus, Filter, DollarSign, Mail, Phone, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { luminaTile } from "@/lib/luminaPalette";
import { cn } from "@/lib/utils";

type Stage = "Lead" | "Qualified" | "Closing";

interface Deal {
  id: string;
  name: string;
  contact: string;
  company: string;
  email: string;
  phone: string;
  amount: number;
  stage: Stage;
  closeDate: string;
  activity: { when: string; what: string }[];
}

const seedDeals: Deal[] = [
  {
    id: "d1", name: "Nimbus — Annual contract", contact: "Mia Chen", company: "Nimbus", email: "mia@nimbus.io",
    phone: "+1 415 555 0142", amount: 48000, stage: "Closing", closeDate: "May 24",
    activity: [{ when: "Today", what: "Sent redlined MSA" }, { when: "Yesterday", what: "Procurement intro" }, { when: "Last week", what: "Discovery call" }],
  },
  {
    id: "d2", name: "Acme — Pilot expansion", contact: "Lee Park", company: "Acme", email: "lee@acme.io",
    phone: "+1 212 555 0188", amount: 22000, stage: "Qualified", closeDate: "Jun 02",
    activity: [{ when: "Yesterday", what: "Demo to engineering team" }, { when: "Last week", what: "Pilot kicked off" }],
  },
  {
    id: "d3", name: "Helix Co. — Seat top-up", contact: "Ava Kim", company: "Helix Co.", email: "ava@helix.co",
    phone: "+1 646 555 0117", amount: 9800, stage: "Lead", closeDate: "Jun 18",
    activity: [{ when: "Today", what: "Inbound from pricing page" }],
  },
  {
    id: "d4", name: "Northwind — Renewal", contact: "Ren Park", company: "Northwind", email: "ren@northwind.com",
    phone: "+1 503 555 0102", amount: 64000, stage: "Closing", closeDate: "May 30",
    activity: [{ when: "Today", what: "Legal review in progress" }, { when: "Last week", what: "Renewal proposal sent" }],
  },
  {
    id: "d5", name: "Pulse — New logo", contact: "Kai Lin", company: "Pulse", email: "kai@pulse.app",
    phone: "+1 917 555 0166", amount: 14500, stage: "Qualified", closeDate: "Jun 10",
    activity: [{ when: "Yesterday", what: "Security review passed" }],
  },
  {
    id: "d6", name: "Lumen — Trial", contact: "Sam Diaz", company: "Lumen", email: "sam@lumen.dev",
    phone: "+1 718 555 0143", amount: 6200, stage: "Lead", closeDate: "Jun 22",
    activity: [{ when: "Today", what: "Signed up for trial" }],
  },
];

const STAGES: Stage[] = ["Lead", "Qualified", "Closing"];

const stageAccent: Record<Stage, number> = { Lead: 3, Qualified: 1, Closing: 0 };

function formatMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function HelixCRM() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<Deal | null>(null);
  const filtered = useMemo(
    () => seedDeals.filter((d) => (d.name + d.contact + d.company).toLowerCase().includes(q.toLowerCase())),
    [q],
  );
  const totalsByStage = useMemo(() => {
    const m: Record<Stage, number> = { Lead: 0, Qualified: 0, Closing: 0 };
    filtered.forEach((d) => (m[d.stage] += d.amount));
    return m;
  }, [filtered]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Workspace · Helix</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Sales pipeline</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 h-8 rounded-lg bg-surface-1 border border-border w-64">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search deals, contacts…"
              className="bg-transparent outline-none text-[12px] flex-1"
            />
          </div>
          <button className="h-8 px-3 rounded-lg border border-white/15 hover:bg-white/[0.04] inline-flex items-center gap-1.5 text-[12px]">
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
          <button
            onClick={() => toast.success("New deal created")}
            className="h-8 px-3 rounded-lg bg-button-lumina text-primary-foreground text-[12px] font-medium inline-flex items-center gap-1.5 shadow-[0_4px_20px_-6px_hsl(255_90%_65%/0.55)] hover:brightness-[1.06] transition"
          >
            <Plus className="w-3.5 h-3.5" /> New deal
          </button>
        </div>
      </div>

      {/* Pipeline */}
      <div className="grid lg:grid-cols-3 gap-4">
        {STAGES.map((stage) => {
          const deals = filtered.filter((d) => d.stage === stage);
          return (
            <div key={stage} className="glass-panel rounded-2xl p-4 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-md grid place-items-center ${luminaTile(stageAccent[stage])}`}>
                    <span className="text-[10px] font-semibold text-white">{stage.charAt(0)}</span>
                  </span>
                  <h3 className="font-semibold tracking-tight text-sm">{stage}</h3>
                  <span className="text-[11px] text-muted-foreground bg-surface-1 px-1.5 py-0.5 rounded-md">
                    {deals.length}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">{formatMoney(totalsByStage[stage])}</span>
              </div>
              <div className="flex flex-col gap-2">
                {deals.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setActive(d)}
                    className="text-left rounded-xl border border-white/5 bg-surface-1/60 hover:bg-surface-2 hover:border-white/15 transition p-3"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="text-[13px] font-semibold tracking-tight truncate">{d.name}</h4>
                      <span className="text-[12px] font-semibold tracking-tight shrink-0">{formatMoney(d.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="truncate">{d.contact} · {d.company}</span>
                      <span className="inline-flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3" /> {d.closeDate}
                      </span>
                    </div>
                  </button>
                ))}
                {deals.length === 0 && (
                  <div className="text-center text-[12px] text-muted-foreground py-6">No deals.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deal drawer */}
      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="bg-background border-white/10 sm:max-w-md">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl tracking-tight">{active.name}</SheetTitle>
                <SheetDescription className="text-sm">
                  {active.company} · {active.stage}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="glass-panel rounded-xl p-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-1">Amount</div>
                  <div className="text-2xl font-semibold tracking-tight inline-flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    {formatMoney(active.amount)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">Expected close · {active.closeDate}</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{active.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{active.phone}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-3">Activity</div>
                  <ol className="space-y-3">
                    {active.activity.map((a, i) => (
                      <li key={i} className="flex gap-3">
                        <div className="relative">
                          <div className={cn("w-2 h-2 rounded-full mt-1.5", i === 0 ? "bg-foreground" : "bg-muted-foreground/40")} />
                          {i < active.activity.length - 1 && (
                            <div className="absolute left-1/2 top-3 -translate-x-1/2 w-px h-6 bg-white/10" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm">{a.what}</div>
                          <div className="text-[11px] text-muted-foreground">{a.when}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}