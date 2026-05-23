import { useState } from "react";
import { Plus, Search, Filter, Globe, AppWindow, BarChart3, Brain, Smartphone, MoreHorizontal, LayoutTemplate, ArrowRight, Github, Activity, Copy, Pencil, Trash2 } from "lucide-react";
import { useWorkspace, type BuildIntent } from "@/context/WorkspaceContext";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { cn } from "@/lib/utils";
import { luminaFrame } from "@/lib/luminaPalette";
import { canAccess } from "@/services/workspaceAccessService";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SalesRequestDialog } from "@/components/sales/SalesRequestDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { projectRepository } from "@/services/projectRepository";
import { toast } from "sonner";

const typeIcon: Record<BuildIntent, any> = {
  website: Globe, webapp: AppWindow, dashboard: BarChart3, "ai-tool": Brain, import: Globe, mobile: Smartphone,
};
const typeLabel: Record<BuildIntent, string> = {
  website: "Website", webapp: "Web App", dashboard: "Dashboard", "ai-tool": "AI Tool", import: "Import", mobile: "Mobile",
};
const accentMap = {
  violet: "from-violet to-electric", magenta: "from-magenta to-rose",
  cyan: "from-cyan to-electric", gold: "from-gold to-magenta",
};
const statusStyle = {
  live: "bg-cyan/10 text-cyan border-cyan/25",
  building: "bg-gold/10 text-gold border-gold/25",
  draft: "bg-surface-2 text-muted-foreground border-border",
};

export function DashboardView() {
  const { projects, setView, setActiveProject, setImportOpen, usage } = useWorkspace();
  const showRepoAudit = canAccess("repoAudit");
  const [salesOpen, setSalesOpen] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "building" | "draft">("all");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "status">("recent");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = projects
    .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
    .filter((p) => statusFilter === "all" || p.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return 0;
    });

  const runtimeDot: Record<NonNullable<typeof projects[number]["runtime"]>, string> = {
    cold: "bg-muted-foreground/40",
    warm: "bg-gold shadow-[0_0_8px_hsl(var(--gold))]",
    live: "bg-cyan shadow-[0_0_8px_hsl(var(--cyan))]",
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-10 md:py-14">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 anim-in">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 mb-2">Workspace</div>
            <h1 className="font-display text-3xl md:text-[44px] font-semibold tracking-[-0.025em] leading-[1.05]">
              Your <span className="text-gradient-lumina">creations</span>
            </h1>
            <p className="text-gold/80 mt-2 text-[13px]">
              {projects.length} projects · always evolving
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gold/70">
              <span><span className="text-gold font-medium tabular-nums">{usage.aiExecutions}</span> AI runs</span>
              <span className="text-gold/40">·</span>
              <span><span className="text-gold font-medium tabular-nums">{projects.length}</span> projects</span>
              <span className="text-gold/40">·</span>
              <span><span className="text-gold font-medium tabular-nums">{usage.deployments}</span> deploys</span>
              <span className="text-gold/40">·</span>
              <span><span className="text-gold font-medium tabular-nums">{usage.transformations}</span> transforms</span>
              <span className="text-gold/40">·</span>
              <span><span className="text-gold font-medium tabular-nums">{usage.audits}</span> audits</span>
              <span className="text-gold/40">·</span>
              <span><span className="text-gold font-medium tabular-nums">${usage.revenue}</span>/mo</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-3 h-9 rounded-lg bg-background/20 backdrop-blur-md border border-gold/60 w-72 focus-within:border-gold/90 shadow-[0_0_12px_-2px_hsl(var(--gold)/0.35)] focus-within:shadow-[0_0_22px_-2px_hsl(var(--gold)/0.65)] transition-all duration-300">
              <Search className="h-3.5 w-3.5 text-gold/80" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search projects…"
                className="bg-transparent outline-none text-[13px] flex-1 text-gold placeholder:text-gold/50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              aria-label="Filter by status"
              className="hidden md:inline-flex h-9 px-2.5 rounded-lg bg-background/20 backdrop-blur-md border border-gold/60 text-[12px] text-gold outline-none hover:border-gold/90 hover:bg-gold/15 shadow-[0_0_12px_-2px_hsl(var(--gold)/0.35)] hover:shadow-[0_0_22px_-2px_hsl(var(--gold)/0.65)] transition-all duration-300"
            >
              <option value="all">All status</option>
              <option value="live">Live</option>
              <option value="building">Building</option>
              <option value="draft">Draft</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              aria-label="Sort by"
              className="hidden md:inline-flex h-9 px-2.5 rounded-lg bg-background/20 backdrop-blur-md border border-gold/60 text-[12px] text-gold outline-none hover:border-gold/90 hover:bg-gold/15 shadow-[0_0_12px_-2px_hsl(var(--gold)/0.35)] hover:shadow-[0_0_22px_-2px_hsl(var(--gold)/0.65)] transition-all duration-300"
            >
              <option value="recent">Recent</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
            </select>
            <LuminaButton
              variant="ghost"
              size="md"
              className="hidden md:inline-flex border border-gold/60 text-gold hover:text-gold hover:border-gold/90 hover:bg-gold/15 shadow-[0_0_12px_-2px_hsl(var(--gold)/0.35)] hover:shadow-[0_0_22px_-2px_hsl(var(--gold)/0.65)] transition-all duration-300"
              onClick={() => setImportOpen(true)}
            >
              <Filter className="h-3.5 w-3.5" />
              Import
            </LuminaButton>
            <LuminaButton size="md" onClick={() => setView("entry")}>
              <Plus className="h-3.5 w-3.5" />
              New project
            </LuminaButton>
          </div>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {showRepoAudit ? (
            <button
              onClick={() => setView("repo-audit")}
              className="group relative aspect-[4/3] text-left rounded-2xl overflow-hidden border border-gold/25 bg-gradient-to-br from-[hsl(220_40%_10%)] via-[hsl(230_40%_8%)] to-[hsl(220_50%_6%)] hover:border-gold/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_hsl(45_90%_50%/0.4),0_0_0_1px_hsl(45_90%_60%/0.18)]"
            >
              <div className="absolute inset-0 opacity-60">
                <div className="absolute -top-16 -right-12 h-48 w-48 rounded-full bg-gold/15 blur-3xl" />
                <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-electric/20 blur-3xl" />
              </div>
              <div className="relative h-full p-5 flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gold/15 border border-gold/30 text-gold text-[10px] uppercase tracking-[0.14em]">
                    <Activity className="h-2.5 w-2.5" /> Internal
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-gold to-electric grid place-items-center shadow-[0_4px_16px_-4px_hsl(45_90%_55%/0.6)]">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="font-display font-semibold text-[16px] tracking-tight">Repo Audit Engine</div>
                  <div className="text-[12px] text-muted-foreground mt-1 max-w-[28ch]">
                    Analyze imported repositories, detect missing dependencies, and generate automated repair plans.
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1 text-[12px] text-gold font-medium">
                    Run Audit <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </button>
          ) : (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    tabIndex={0}
                    role="button"
                    aria-disabled="true"
                    aria-label="Repo Audit Engine — requires repoAudit capability"
                    onClick={() => setSalesOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSalesOpen(true);
                      }
                    }}
                    className="group relative aspect-[4/3] text-left rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-[hsl(220_40%_10%)] via-[hsl(230_40%_8%)] to-[hsl(220_50%_6%)] block cursor-pointer opacity-70 hover:opacity-90 hover:border-white/20 transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="absolute inset-0 opacity-40">
                      <div className="absolute -top-16 -right-12 h-48 w-48 rounded-full bg-gold/10 blur-3xl" />
                      <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-electric/10 blur-3xl" />
                    </div>
                    <div className="relative h-full p-5 flex flex-col">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground text-[10px] uppercase tracking-[0.14em]">
                          <Activity className="h-2.5 w-2.5" /> Locked
                        </div>
                        <div className="h-9 w-9 rounded-xl bg-surface-2 border border-white/10 grid place-items-center">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="mt-auto">
                        <div className="font-display font-semibold text-[16px] tracking-tight text-foreground/80">Repo Audit Engine</div>
                        <div className="text-[12px] text-muted-foreground mt-1 max-w-[28ch]">
                          Requires the <span className="font-mono text-foreground/70">repoAudit</span> capability.
                        </div>
                        <div className="mt-3 inline-flex items-center gap-1 text-[12px] text-cyan font-medium">
                          Contact sales →
                        </div>
                      </div>
                    </div>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                  <p className="font-medium text-foreground mb-1">Repo Audit is unavailable</p>
                  <p className="text-muted-foreground">
                    Your account doesn't include the <span className="font-mono">repoAudit</span> capability.
                    It's available on Business and Enterprise plans, or with an active in-house developer engagement.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSalesOpen(true)}
                    className="mt-2 inline-flex items-center gap-1 text-cyan hover:text-cyan/80 underline-offset-2 hover:underline"
                  >
                    Contact sales to unlock →
                  </button>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Create card */}
          <button
            onClick={() => setView("entry")}
            className="group relative aspect-[4/3] rounded-2xl border border-dashed border-white/10 hover:border-violet/50 transition-all duration-500 grid place-items-center overflow-hidden bg-surface-1/40"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="absolute inset-0 bg-aurora" />
            </div>
            <div className="relative text-center">
              <div className="h-11 w-11 rounded-xl bg-button-lumina grid place-items-center mx-auto mb-3 shadow-[0_4px_16px_-4px_hsl(var(--violet)/0.5),inset_0_1px_0_hsl(220_20%_100%/0.18)] group-hover:scale-105 transition">
                <Plus className="h-4 w-4 text-white" />
              </div>
              <div className="font-display font-semibold text-[15px]">Start something new</div>
              <div className="text-[11px] text-muted-foreground mt-1">From a prompt or a template</div>
            </div>
          </button>

          {/* Browse templates card */}
          <button
            onClick={() => setView("templates")}
            className="group relative aspect-[4/3] rounded-2xl border border-dashed border-white/10 hover:border-cyan/50 transition-all duration-500 grid place-items-center overflow-hidden bg-surface-1/40"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan/15 via-transparent to-gold/15" />
            </div>
            <div className="relative text-center">
              <div className="h-11 w-11 rounded-xl grid place-items-center mx-auto mb-3 bg-gradient-to-br from-cyan to-gold shadow-[0_4px_16px_-4px_hsl(var(--cyan)/0.5),inset_0_1px_0_hsl(220_20%_100%/0.18)] group-hover:scale-105 transition">
                <LayoutTemplate className="h-4 w-4 text-white" />
              </div>
              <div className="font-display font-semibold text-[15px] flex items-center justify-center gap-1.5">
                Browse templates
                <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition" />
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">Premium starters, ready to remix</div>
            </div>
          </button>

          {/* Imports card */}
          <button
            onClick={() => setView("imports")}
            className="group relative aspect-[4/3] rounded-2xl border border-dashed border-white/10 hover:border-magenta/50 transition-all duration-500 grid place-items-center overflow-hidden bg-surface-1/40"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="absolute inset-0 bg-gradient-to-br from-violet/15 via-transparent to-magenta/15" />
            </div>
            <div className="relative text-center">
              <div className="h-11 w-11 rounded-xl grid place-items-center mx-auto mb-3 bg-gradient-to-br from-violet to-magenta shadow-[0_4px_16px_-4px_hsl(var(--magenta)/0.5),inset_0_1px_0_hsl(220_20%_100%/0.18)] group-hover:scale-105 transition">
                <Github className="h-4 w-4 text-white" />
              </div>
              <div className="font-display font-semibold text-[15px] flex items-center justify-center gap-1.5">
                Imported projects
                <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition" />
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">View and manage imports</div>
            </div>
          </button>

          {filtered.map((p, i) => {
            const Icon = typeIcon[p.type];
            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => { setActiveProject(p); setView("workspace"); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveProject(p); setView("workspace"); } }}
                className="group relative aspect-[4/3] text-left rounded-2xl glass overflow-hidden transition-all duration-500 ease-fluid hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_hsl(230_80%_2%/0.9),0_0_0_1px_hsl(220_20%_100%/0.1)] anim-in cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {/* Thumbnail / blob preview */}
                <div className={cn("absolute inset-x-0 top-0 h-2/3 overflow-hidden", luminaFrame(i))}>
                  <div className="absolute -top-16 -right-12 h-48 w-48 rounded-full bg-white/[0.06] blur-3xl" />
                  <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-black/40 blur-3xl" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/95" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white/85 uppercase tracking-[0.12em]">
                    <Icon className="h-2.5 w-2.5" />
                    {typeLabel[p.type]}
                  </div>
                  <span
                    className={cn(
                      "absolute top-3 right-3 px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-[0.12em] backdrop-blur-md",
                      statusStyle[p.status]
                    )}
                  >
                    {p.status}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-display font-semibold text-[14px] tracking-tight truncate flex items-center gap-1.5">
                        {p.name}
                        {p.runtime && (
                          <span
                            className={cn("h-1.5 w-1.5 rounded-full", runtimeDot[p.runtime])}
                            title={`Runtime: ${p.runtime}`}
                          />
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Edited {p.lastEdited}</div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Project actions"
                          className="h-8 w-8 grid place-items-center rounded-lg hover:bg-surface-2 transition opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()} className="min-w-[160px]">
                        <DropdownMenuItem onSelect={() => { try { projectRepository.duplicate(p.id); toast.success("Project duplicated"); } catch { toast.error("Could not duplicate"); } }}>
                          <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => { setRenameId(p.id); setRenameValue(p.name); }}>
                          <Pencil className="h-3.5 w-3.5 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setDeleteId(p.id)} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <SalesRequestDialog
        open={salesOpen}
        onOpenChange={setSalesOpen}
        reason="the Repo Audit Engine"
        source="dashboard:repo-audit-locked"
      />
      <AlertDialog open={renameId !== null} onOpenChange={(o) => !o && setRenameId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename project</AlertDialogTitle>
            <AlertDialogDescription>Choose a new name for this project.</AlertDialogDescription>
          </AlertDialogHeader>
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            autoFocus
            className="h-10 px-3 rounded-lg bg-surface-1 border border-border text-[13px] outline-none focus:border-violet/50 transition w-full"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!renameId || !renameValue.trim()) return;
                try { projectRepository.update(renameId, { name: renameValue.trim() }); toast.success("Renamed"); }
                catch { toast.error("Rename failed"); }
                setRenameId(null);
              }}
            >Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteId) return;
                try { projectRepository.remove(deleteId); toast.success("Project deleted"); }
                catch { toast.error("Delete failed"); }
                setDeleteId(null);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
