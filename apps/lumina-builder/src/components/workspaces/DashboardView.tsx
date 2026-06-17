import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Globe,
  AppWindow,
  BarChart3,
  Brain,
  Smartphone,
  MoreHorizontal,
  LayoutTemplate,
  ArrowRight,
  Github,
  Activity,
  Copy,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  useWorkspace,
  type BuildIntent,
} from "@/context/WorkspaceContext";

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
import { ProjectRenameDialog } from "@/components/workspaces/dialogs/ProjectRenameDialog";
import { ProjectDeleteDialog } from "@/components/workspaces/dialogs/ProjectDeleteDialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


import { projectRepository } from "@/services/projectRepository";
import {
  deleteRuntimeProject,
} from "@/services/runtimeService";
import { toast } from "sonner";

const typeIcon: Record<BuildIntent, any> = {
  website: Globe,
  webapp: AppWindow,
  dashboard: BarChart3,
  "ai-tool": Brain,
  import: Globe,
  mobile: Smartphone,
};

const typeLabel: Record<
  BuildIntent,
  string
> = {
  website: "Website",
  webapp: "Web App",
  dashboard: "Dashboard",
  "ai-tool": "AI Tool",
  import: "Import",
  mobile: "Mobile",
};

const statusStyle = {
  live: "bg-cyan/10 text-cyan border-cyan/25",
  building:
    "bg-gold/10 text-gold border-gold/25",
  draft:
    "bg-surface-2 text-muted-foreground border-border",
};

const defaultUsage = {
  aiExecutions: 0,
  aiLimit: 100,
  deployments: 0,
  transformations: 0,
  audits: 0,
  revenue: 0,
};

export function DashboardView() {
  const workspace =
    useWorkspace();

  const {
    projects = [],
    setView,
    setActiveProject,
    setImportOpen,
    usage,
  } = workspace;

  const safeUsage = {
    ...defaultUsage,
    ...(usage ?? {}),
  };

  const showRepoAudit =
    canAccess("repoAudit");

  const [
    salesOpen,
    setSalesOpen,
  ] = useState(false);

  const [q, setQ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "all" |
    "live" |
    "building" |
    "draft"
  >("all");

  const [
    sortBy,
    setSortBy,
  ] = useState<
    "recent" |
    "name" |
    "status"
  >("recent");


  const [
    renameTarget,
    setRenameTarget,
  ] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [
    renameValue,
    setRenameValue,
  ] = useState("");

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const filtered =
    useMemo(() => {
      return projects
        .filter((p) =>
          p.name
            .toLowerCase()
            .includes(
              q.toLowerCase(),
            ),
        )
        .filter(
          (p) =>
            statusFilter ===
              "all" ||
            p.status ===
              statusFilter,
        )
        .sort((a, b) => {
          if (
            sortBy ===
            "name"
          ) {
            return a.name.localeCompare(
              b.name,
            );
          }

          if (
            sortBy ===
            "status"
          ) {
            return a.status.localeCompare(
              b.status,
            );
          }

          return 0;
        });
    }, [
      projects,
      q,
      statusFilter,
      sortBy,
    ]);

  const runtimeDot: Record<
    "cold" | "warm" | "live",
    string
  > = {
    cold:
      "bg-muted-foreground/40",
    warm:
      "bg-gold shadow-[0_0_8px_hsl(var(--gold))]",
    live:
      "bg-cyan shadow-[0_0_8px_hsl(var(--cyan))]",
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-10 md:py-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 anim-in">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 mb-2">
              Workspace
            </div>

            <h1 className="font-display text-3xl md:text-[44px] font-semibold tracking-[-0.025em] leading-[1.05]">
              Your{" "}
              <span className="text-gradient-lumina">
                creations
              </span>
            </h1>

            <p className="text-gold/80 mt-2 text-[13px]">
              {
                projects.length
              }{" "}
              projects · always
              evolving
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gold/70">
              <span>
                <span className="text-gold font-medium tabular-nums">
                  {
                    safeUsage.aiExecutions
                  }
                </span>{" "}
                AI runs
              </span>

              <span className="text-gold/40">
                ·
              </span>

              <span>
                <span className="text-gold font-medium tabular-nums">
                  {
                    projects.length
                  }
                </span>{" "}
                projects
              </span>

              <span className="text-gold/40">
                ·
              </span>

              <span>
                <span className="text-gold font-medium tabular-nums">
                  {
                    safeUsage.deployments
                  }
                </span>{" "}
                deploys
              </span>

              <span className="text-gold/40">
                ·
              </span>

              <span>
                <span className="text-gold font-medium tabular-nums">
                  {
                    safeUsage.transformations
                  }
                </span>{" "}
                transforms
              </span>

              <span className="text-gold/40">
                ·
              </span>

              <span>
                <span className="text-gold font-medium tabular-nums">
                  {
                    safeUsage.audits
                  }
                </span>{" "}
                audits
              </span>

              <span className="text-gold/40">
                ·
              </span>

              <span>
                <span className="text-gold font-medium tabular-nums">
                  $
                  {
                    safeUsage.revenue
                  }
                </span>
                /mo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-3 h-9 rounded-lg bg-background/20 backdrop-blur-md border border-gold/60 w-72 focus-within:border-gold/90 shadow-[0_0_12px_-2px_hsl(var(--gold)/0.35)] focus-within:shadow-[0_0_22px_-2px_hsl(var(--gold)/0.65)] transition-all duration-300">
              <Search className="h-3.5 w-3.5 text-gold/80" />

              <input
                value={q}
                onChange={(e) =>
                  setQ(
                    e.target.value,
                  )
                }
                placeholder="Search projects…"
                className="bg-transparent outline-none text-[13px] flex-1 text-gold placeholder:text-gold/50"
              />
            </div>

            <select
              value={
                statusFilter
              }
              onChange={(e) =>
                setStatusFilter(
                  e.target
                    .value as typeof statusFilter,
                )
              }
              aria-label="Filter by status"
              className="hidden md:inline-flex h-9 px-2.5 rounded-lg bg-background/20 backdrop-blur-md border border-gold/60 text-[12px] text-gold outline-none hover:border-gold/90 hover:bg-gold/15 shadow-[0_0_12px_-2px_hsl(var(--gold)/0.35)] hover:shadow-[0_0_22px_-2px_hsl(var(--gold)/0.65)] transition-all duration-300"
            >
              <option value="all">
                All status
              </option>

              <option value="live">
                Live
              </option>

              <option value="building">
                Building
              </option>

              <option value="draft">
                Draft
              </option>
            </select>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target
                    .value as typeof sortBy,
                )
              }
              aria-label="Sort by"
              className="hidden md:inline-flex h-9 px-2.5 rounded-lg bg-background/20 backdrop-blur-md border border-gold/60 text-[12px] text-gold outline-none hover:border-gold/90 hover:bg-gold/15 shadow-[0_0_12px_-2px_hsl(var(--gold)/0.35)] hover:shadow-[0_0_22px_-2px_hsl(var(--gold)/0.65)] transition-all duration-300"
            >
              <option value="recent">
                Recent
              </option>

              <option value="name">
                Name
              </option>

              <option value="status">
                Status
              </option>
            </select>

            <LuminaButton
              variant="ghost"
              size="md"
              className="hidden md:inline-flex border border-gold/60 text-gold hover:text-gold hover:border-gold/90 hover:bg-gold/15 shadow-[0_0_12px_-2px_hsl(var(--gold)/0.35)] hover:shadow-[0_0_22px_-2px_hsl(var(--gold)/0.65)] transition-all duration-300"
              onClick={() =>
                setImportOpen(
                  true,
                )
              }
            >
              <Filter className="h-3.5 w-3.5" />
              Import
            </LuminaButton>

            <LuminaButton
              size="md"
              onClick={() =>
                setView(
                  "entry",
                )
              }
            >
              <Plus className="h-3.5 w-3.5" />
              New project
            </LuminaButton>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {showRepoAudit ? (
            <button
              onClick={() =>
                setView(
                  "repo-audit",
                )
              }
              className="group relative aspect-[4/3] text-left rounded-2xl overflow-hidden border border-gold/25 bg-gradient-to-br from-[hsl(220_40%_10%)] via-[hsl(230_40%_8%)] to-[hsl(220_50%_6%)] hover:border-gold/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_hsl(45_90%_50%/0.4),0_0_0_1px_hsl(45_90%_60%/0.18)]"
            >
              <div className="absolute inset-0 opacity-60">
                <div className="absolute -top-16 -right-12 h-48 w-48 rounded-full bg-gold/15 blur-3xl" />

                <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-electric/20 blur-3xl" />
              </div>

              <div className="relative h-full p-5 flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gold/15 border border-gold/30 text-gold text-[10px] uppercase tracking-[0.14em]">
                    <Activity className="h-2.5 w-2.5" />
                    Internal
                  </div>

                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-gold to-electric grid place-items-center shadow-[0_4px_16px_-4px_hsl(45_90%_55%/0.6)]">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="font-display font-semibold text-[16px] tracking-tight">
                    Repo Audit
                    Engine
                  </div>

                  <div className="text-[12px] text-muted-foreground mt-1 max-w-[28ch]">
                    Analyze
                    imported
                    repositories,
                    detect
                    missing
                    dependencies,
                    and generate
                    automated
                    repair plans.
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
                    onClick={() =>
                      setSalesOpen(
                        true,
                      )
                    }
                    className="group relative aspect-[4/3] text-left rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-[hsl(220_40%_10%)] via-[hsl(230_40%_8%)] to-[hsl(220_50%_6%)] block cursor-pointer opacity-70 hover:opacity-90 hover:border-white/20 transition-all outline-none"
                  >
                    <div className="relative h-full p-5 flex flex-col justify-end">
                      <div className="font-display font-semibold text-[16px] tracking-tight text-foreground/80">
                        Repo Audit
                        Engine
                      </div>

                      <div className="text-[12px] text-muted-foreground mt-1">
                        Requires
                        repoAudit
                        capability
                      </div>
                    </div>
                  </span>
                </TooltipTrigger>

                <TooltipContent
                  side="top"
                  className="max-w-xs text-xs leading-relaxed"
                >
                  Repo Audit is
                  unavailable
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {filtered.map(
            (p, i) => {
              const Icon =
                typeIcon[
                  p.type
                ];

              return (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {

                    setActiveProject(
                      p,
                    );

                    setView(
                      "workspace",
                    );
                  }}
                  className="group relative aspect-[4/3] text-left rounded-2xl glass overflow-hidden transition-all duration-500 ease-fluid hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_hsl(230_80%_2%/0.9),0_0_0_1px_hsl(220_20%_100%/0.1)] anim-in cursor-pointer"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                  }}
                >
                  <div
                    className={cn(
                      "absolute inset-x-0 top-0 h-2/3 overflow-hidden",
                      luminaFrame(
                        i,
                      ),
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/95" />

                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white/85 uppercase tracking-[0.12em]">
                      <Icon className="h-2.5 w-2.5" />
                      {
                        typeLabel[
                          p.type
                        ]
                      }
                    </div>

                    <span
                      className={cn(
                        "absolute top-3 right-3 px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-[0.12em] backdrop-blur-md",
                        statusStyle[
                          p.status
                        ],
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
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                runtimeDot[
                                  p.runtime as keyof typeof runtimeDot
                                ],
                              )}
                            />
                          )}
                        </div>

                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Edited{" "}
                          {
                            p.lastEdited
                          }
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(
                              e,
                            ) =>
                              e.stopPropagation()
                            }
                            className="h-8 w-8 grid place-items-center rounded-lg hover:bg-surface-2 transition opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                          align="end"
                          onClick={(event) => {
                            event.stopPropagation();
                          }}
                        >
                          <DropdownMenuItem
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();

                              try {
                                projectRepository.duplicate(
                                  p.id,
                                );

                                toast.success(
                                  "Project duplicated",
                                );
                              } catch {
                                toast.error(
                                  "Could not duplicate",
                                );
                              }
                            }}
                          >
                            <Copy className="h-3.5 w-3.5 mr-2" />
                            Duplicate
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();

                              setRenameTarget({
                                id: p.id,
                                name: p.name,
                              });

                              setRenameValue(
                                p.name,
                              );
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Rename
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={async (event) => {
                              event.preventDefault();
                              event.stopPropagation();

                              setDeleteTarget({
                                id: p.id,
                                name: p.name,
                              });
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>

      <ProjectRenameDialog
        open={renameTarget !== null}
        project={renameTarget}
        value={renameValue}
        onValueChange={setRenameValue}
        onOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null);
            setRenameValue("");
          }
        }}
        onSubmit={() => {
          if (!renameTarget || !renameValue.trim()) {
            return;
          }

          try {
            projectRepository.update(
              renameTarget.id,
              {
                name: renameValue.trim(),
              },
            );

            toast.success("Renamed");

            setRenameTarget(null);
            setRenameValue("");
          } catch {
            toast.error("Rename failed");
          }
        }}
      />

      <ProjectDeleteDialog
        open={deleteTarget !== null}
        project={deleteTarget}
        deleting={deleting}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          try {
            setDeleting(true);

            await deleteRuntimeProject(
              deleteTarget.id,
            );

            projectRepository.remove(
              deleteTarget.id,
            );

            toast.success(
              "Project deleted",
            );

            setDeleteTarget(null);

            window.dispatchEvent(
              new Event("storage"),
            );
          } catch {
            toast.error(
              "Delete failed",
            );
          } finally {
            setDeleting(false);
          }
        }}
      />

      <SalesRequestDialog
        open={salesOpen}
        onOpenChange={
          setSalesOpen
        }
        reason="the Repo Audit Engine"
        source="dashboard:repo-audit-locked"
      />


    </div>
  );
}
