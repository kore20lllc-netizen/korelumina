import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Search, Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { luminaTile } from "@/lib/luminaPalette";

type Range = "24h" | "7d" | "30d";

const RANGES: Range[] = ["24h", "7d", "30d"];

const seriesByRange: Record<Range, { revenue: { x: string; v: number }[]; traffic: { x: string; v: number }[] }> = {
  "24h": {
    revenue: Array.from({ length: 12 }, (_, i) => ({ x: `${i * 2}h`, v: 800 + Math.round(Math.sin(i / 2) * 220 + i * 35) })),
    traffic: Array.from({ length: 12 }, (_, i) => ({ x: `${i * 2}h`, v: 120 + Math.round(Math.cos(i / 2) * 50 + i * 6) })),
  },
  "7d": {
    revenue: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => ({ x: d, v: 4200 + i * 380 + (i % 2 === 0 ? 220 : -180) })),
    traffic: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => ({ x: d, v: 880 + i * 60 + (i % 2 === 0 ? 90 : -40) })),
  },
  "30d": {
    revenue: Array.from({ length: 10 }, (_, i) => ({ x: `D${i * 3 + 1}`, v: 12000 + i * 920 + (i % 3 === 0 ? 600 : -240) })),
    traffic: Array.from({ length: 10 }, (_, i) => ({ x: `D${i * 3 + 1}`, v: 2400 + i * 140 + (i % 3 === 0 ? 180 : -60) })),
  },
};

const kpisByRange: Record<Range, { label: string; value: string; delta: number }[]> = {
  "24h": [
    { label: "Revenue", value: "$12,480", delta: 8.4 },
    { label: "Active users", value: "1,284", delta: 3.1 },
    { label: "Conversion", value: "4.2%", delta: -0.6 },
    { label: "Avg. session", value: "3m 42s", delta: 1.8 },
  ],
  "7d": [
    { label: "Revenue", value: "$84,920", delta: 12.6 },
    { label: "Active users", value: "9,442", delta: 5.4 },
    { label: "Conversion", value: "4.8%", delta: 0.9 },
    { label: "Avg. session", value: "4m 02s", delta: 2.3 },
  ],
  "30d": [
    { label: "Revenue", value: "$342,108", delta: 18.2 },
    { label: "Active users", value: "38,210", delta: 9.7 },
    { label: "Conversion", value: "5.1%", delta: 1.4 },
    { label: "Avg. session", value: "4m 18s", delta: 3.2 },
  ],
};

const events = [
  { id: "e1", user: "ava@nimbus.io", action: "Upgraded to Pro", status: "success", time: "2m ago" },
  { id: "e2", user: "lee@helix.co", action: "Trial started", status: "info", time: "12m ago" },
  { id: "e3", user: "max@acme.io", action: "Payment failed", status: "warn", time: "1h ago" },
  { id: "e4", user: "mia@lumen.dev", action: "Invited 3 teammates", status: "info", time: "2h ago" },
  { id: "e5", user: "ren@northwind.com", action: "Cancelled subscription", status: "danger", time: "4h ago" },
  { id: "e6", user: "kai@pulse.app", action: "Connected FolderGit2", status: "success", time: "Yesterday" },
];

const statusStyle: Record<string, string> = {
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  info: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  warn: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export function PulseAnalytics() {
  const [range, setRange] = useState<Range>("7d");
  const [q, setQ] = useState("");
  const series = seriesByRange[range];
  const kpis = kpisByRange[range];
  const filtered = useMemo(
    () => events.filter((e) => (e.user + e.action).toLowerCase().includes(q.toLowerCase())),
    [q],
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Workspace · Pulse</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Analytics overview</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 p-1 rounded-full border border-white/10 bg-surface-1">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "h-7 px-3 rounded-full text-[12px] font-medium transition",
                  range === r ? "bg-surface-3 text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <button className="h-8 px-3 rounded-lg border border-white/15 hover:bg-white/[0.04] inline-flex items-center gap-1.5 text-[12px]">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button className="h-8 px-3 rounded-lg border border-white/15 hover:bg-white/[0.04] inline-flex items-center gap-1.5 text-[12px]">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {kpis.map((k, i) => {
          const up = k.delta >= 0;
          return (
            <div key={k.label} className="glass-panel rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{k.label}</span>
                <span className={`w-6 h-6 rounded-md grid place-items-center ${luminaTile(i)}`}>
                  <span className="text-[10px] font-semibold text-white">{k.label.charAt(0)}</span>
                </span>
              </div>
              <div className="text-2xl font-semibold tracking-tight mb-1">{k.value}</div>
              <div className={cn("inline-flex items-center gap-1 text-[12px]", up ? "text-emerald-400" : "text-rose-400")}>
                {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {Math.abs(k.delta)}% vs prev.
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-3 mb-6">
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold tracking-tight">Revenue</h3>
            <span className="text-[11px] text-muted-foreground">{range}</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series.revenue} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="hsl(220 12% 100% / 0.05)" vertical={false} />
                <XAxis dataKey="x" tick={{ fill: "hsl(220 8% 65%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(220 8% 65%)", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip
                  contentStyle={{ background: "hsl(220 18% 8% / 0.95)", border: "1px solid hsl(220 12% 100% / 0.1)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "hsl(220 8% 75%)" }}
                />
                <Line type="monotone" dataKey="v" stroke="hsl(265 90% 65%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold tracking-tight">Traffic</h3>
            <span className="text-[11px] text-muted-foreground">{range}</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series.traffic} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="hsl(220 12% 100% / 0.05)" vertical={false} />
                <XAxis dataKey="x" tick={{ fill: "hsl(220 8% 65%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(220 8% 65%)", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip
                  contentStyle={{ background: "hsl(220 18% 8% / 0.95)", border: "1px solid hsl(220 12% 100% / 0.1)", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="v" fill="hsl(195 90% 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Events table */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="font-semibold tracking-tight">Recent events</h3>
          <div className="inline-flex items-center gap-2 px-3 h-8 rounded-lg bg-surface-1 border border-border w-64">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter events…"
              className="bg-transparent outline-none text-[12px] flex-1"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <th className="text-left font-medium pb-3">User</th>
                <th className="text-left font-medium pb-3">Event</th>
                <th className="text-left font-medium pb-3">Status</th>
                <th className="text-right font-medium pb-3">When</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-t border-white/5">
                  <td className="py-3 text-foreground/90">{e.user}</td>
                  <td className="py-3 text-muted-foreground">{e.action}</td>
                  <td className="py-3">
                    <span className={cn("text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md border", statusStyle[e.status])}>
                      {e.status}
                    </span>
                  </td>
                  <td className="py-3 text-right text-muted-foreground">{e.time}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground text-[13px]">
                    No events match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}