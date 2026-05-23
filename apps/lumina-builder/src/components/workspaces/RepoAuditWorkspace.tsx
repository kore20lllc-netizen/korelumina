import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ChevronLeft,
  ShieldCheck,
  History,
  X,
  Download,
  Sparkles,
  Upload,
  Trash,
  Palette,
} from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { useWorkspace } from "@/context/WorkspaceContext";
import { canAccess } from "@/services/workspaceAccessService";

import {
  AuditReport,
  getAudit,
  runAudit,
  type RepoSource,
  type AuditMode,
  type AuditProgressEvent,
  type AuditTransportInfo,
  type FixPlan,
  type DiffPreview,
  type FixIteration,
  generateFixPlan,
  autoFix,
  fixUntilGreen,
  reRunAudit,
} from "@/services/repoAuditService";

import { AuditSummary } from "./repo-audit/AuditSummary";
import { DeepAuditProgress } from "./repo-audit/DeepAuditProgress";
import { RepairActionBar } from "./repo-audit/RepairActionBar";
import { AutoFixModal } from "./repo-audit/AutoFixModal";
import { FixUntilGreenPanel } from "./repo-audit/FixUntilGreenPanel";
import { BuildLogsDrawer } from "./repo-audit/BuildLogsDrawer";
import { DiffPreviewDialog } from "./repo-audit/DiffPreviewDialog";
import { BuildPassedBanner } from "./repo-audit/BuildPassedBanner";
import { DependencyAuditCard } from "./repo-audit/DependencyAuditCard";
import { BuildErrorsCard } from "./repo-audit/BuildErrorsCard";
import { EnvironmentAuditCard } from "./repo-audit/EnvironmentAuditCard";
import { SecurityAuditCard } from "./repo-audit/SecurityAuditCard";
import { RepairPlanCard } from "./repo-audit/RepairPlanCard";
import { RepoSourcePicker } from "./repo-audit/RepoSourcePicker";
import { StepDiffPanel } from "./repo-audit/StepDiffPanel";

import {
  FindingsFilters,
  ALL_SEVERITIES,
  ALL_CATEGORIES,
  type Severity,
  type Category,
} from "./repo-audit/FindingsFilters";

import { toast } from "sonner";
import { auditStoredProject } from "@/services/repoAuditBridge";
import { auth } from "@/providers/auth-registry";
import { usage as usageProvider } from "@/providers/usage-registry";

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

const AuditPdfPreviewDialog = lazy(() =>
  import("./repo-audit/AuditPdfPreviewDialog").then((m) => ({
    default: m.AuditPdfPreviewDialog,
  })),
);

const AuditPdfThemeEditor = lazy(() =>
  import("./repo-audit/AuditPdfThemeEditor").then((m) => ({
    default: m.AuditPdfThemeEditor,
  })),
);

const FILTERS_KEY = "korelumina:repo-audit:filters";
const HISTORY_KEY = "korelumina:repo-audit:filter-history";
const HISTORY_LIMIT = 50;

const TRASH_KEY = "korelumina:repo-audit:filter-history-trash";
const TRASH_TTL_MS = 5 * 60 * 1000;

const RESTORE_EVENT_KEY =
  "korelumina:repo-audit:filter-history-restore";

const RESTORE_LOG_KEY =
  "korelumina:repo-audit:filter-history-restore-log";

const RESTORE_LOG_LIMIT = 5;

const CUSTOM_THEME_KEY =
  "korelumina:repo-audit:custom-theme-overrides";

const CANCELLED_DRAFT_KEY =
  "korelumina:repo-audit:cancelled-draft";

const CANCELLED_DRAFT_TTL_MS =
  24 * 60 * 60 * 1000;

const CANCELLED_DRAFT_MAX_EVENTS = 200;

const CLEANUP_INTERVAL_KEY =
  "korelumina:repo-audit:cleanup-interval-ms";

const CUSTOM_LOGO_KEY_PREFIX =
  "korelumina:repo-audit:custom-logo:";

const CUSTOM_LOGO_MAX_BYTES = 512 * 1024;

const CUSTOM_LOGO_ACCEPT =
  "image/png,image/jpeg,image/webp,image/svg+xml";

const CLEANUP_INTERVAL_DEFAULT_MS = 60 * 1000;

const CLEANUP_INTERVAL_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "Every 30s", value: 30 * 1000 },
  { label: "Every 1m", value: 60 * 1000 },
  { label: "Every 5m", value: 5 * 60 * 1000 },
  { label: "Every 15m", value: 15 * 60 * 1000 },
];

const TRASH_SNAPSHOT_LIMIT = 20;
const TRASH_MAX_BYTES = 16 * 1024;

const loadPdfService = async () => {
  return import("@/services/repoAuditPdfService");
};

export function RepoAuditWorkspace() {
  const { projects, setView } = useWorkspace();

  const allowed = canAccess("repoAudit");

  const [projectId, setProjectId] = useState(
    projects[0]?.id ?? "demo",
  );

  const [report, setReport] =
    useState<AuditReport | null>(null);

  const [loading, setLoading] = useState(false);

  const [auditMode, setAuditMode] =
    useState<AuditMode | null>(null);

  const [lastMode, setLastMode] =
    useState<AuditMode | null>(null);

  const [auditError, setAuditError] =
    useState<string | null>(null);

  const [progressEvents, setProgressEvents] =
    useState<AuditProgressEvent[]>([]);

  const [transport, setTransport] =
    useState<AuditTransportInfo | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const [cancelled, setCancelled] = useState(false);

  const [sourceLabel, setSourceLabel] =
    useState("");

  const [pdfThemeId, setPdfThemeId] =
    useState<string>(() => {
      if (typeof window === "undefined") {
        return "lumina";
      }

      try {
        return (
          window.localStorage.getItem(
            "korelumina:repo-audit:pdf-theme",
          ) || "lumina"
        );
      } catch {
        return "lumina";
      }
    });

  const [pdfPreview, setPdfPreview] =
    useState<any>(null);

  const [pdfPreviewOpen, setPdfPreviewOpen] =
    useState(false);

  const [pdfPreviewLoading, setPdfPreviewLoading] =
    useState(false);

  const [customTheme, setCustomTheme] =
    useState<Record<string, unknown>>({});

  const [themeEditorOpen, setThemeEditorOpen] =
    useState(false);

  const [customLogo, setCustomLogo] =
    useState<string | null>(null);

  const buildPreview = async () => {
    if (!report) return;

    setPdfPreviewLoading(true);
    setPdfPreviewOpen(true);

    try {
      const pdfService = await loadPdfService();

      const themeLabel =
        pdfService.AUDIT_PDF_THEMES[
          pdfThemeId as keyof typeof pdfService.AUDIT_PDF_THEMES
        ]?.label || "Lumina";

      const result =
        await pdfService.previewAuditPdf(
          report,
          sourceLabel || report.projectId,
          {
            severities: [...ALL_SEVERITIES],
            categories: ALL_CATEGORIES.map(
              (c) => c.id,
            ),
          },
          pdfThemeId as any,
          customLogo,
          pdfThemeId === "custom"
            ? customTheme
            : undefined,
        );

      setPdfPreview(result);

      toast.success(
        `Preview ready · ${themeLabel} theme`,
      );
    } catch (err) {
      toast.error("Failed to generate preview", {
        description:
          err instanceof Error
            ? err.message
            : "Unknown error",
      });
    } finally {
      setPdfPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (!allowed) return;

    let active = true;

    getAudit(projectId).then((r) => {
      if (!active) return;

      setReport(r);

      const p = projects.find(
        (x) => x.id === projectId,
      );

      if (p) {
        setSourceLabel(p.name);
      }
    });

    return () => {
      active = false;
    };
  }, [projectId, allowed, projects]);

  if (!allowed) {
    return (
      <div className="flex-1 grid place-items-center p-10">
        <div className="glass rounded-2xl border border-white/10 p-8 max-w-md text-center">
          <ShieldCheck className="h-8 w-8 text-gold mx-auto mb-3" />

          <div className="font-display text-xl font-semibold">
            Repo Audit Engine
          </div>

          <p className="text-[13px] text-muted-foreground mt-2">
            This is an internal engineering tool.
            Available on Business and Enterprise
            plans, and to KoreLumina in-house
            developers.
          </p>

          <LuminaButton
            className="mt-5"
            onClick={() => setView("dashboard")}
          >
            Back to dashboard
          </LuminaButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-10 md:py-12">
        <div className="mb-6">
          <button
            onClick={() =>
              setView("dashboard")
            }
            className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground mb-2"
          >
            <ChevronLeft className="h-3 w-3" />
            Back
          </button>

          <div className="text-[11px] uppercase tracking-[0.22em] text-gold mb-2 inline-flex items-center gap-2">
            <Activity className="h-3 w-3" />
            Internal · Engineering
          </div>

          <h1 className="font-display text-3xl md:text-[40px] font-semibold tracking-[-0.025em] leading-[1.05]">
            Repo Audit{" "}
            <span className="text-gradient-lumina">
              Engine
            </span>
          </h1>

          <p className="text-muted-foreground mt-2 text-[13px] max-w-xl">
            Diagnose imported repositories,
            surface missing dependencies and
            security issues, and generate an
            executable repair plan.
          </p>
        </div>

        <div className="mb-6">
          <RepoSourcePicker
            projects={projects.map((p) => ({
              id: p.id,
              name: p.name,
            }))}
            defaultProjectId={projectId}
            loading={loading}
            loadingMode={auditMode}
            onRun={async (source, mode) => {
              setLoading(true);

              try {
                const r = await runAudit(
                  source,
                  mode,
                );

                setReport(r);

                if (
                  source.kind === "project"
                ) {
                  setProjectId(
                    source.projectId,
                  );

                  try {
                    const plan =
                      auditStoredProject(
                        source.projectId,
                      );

                    const u = auth.getUser();

                    if (u) {
                      usageProvider.recordAudit(
                        u.id,
                      );
                    }

                    if (
                      plan.findings.length > 0
                    ) {
                      toast.message(
                        `Repair plan: ${plan.findings.length} findings`,
                      );
                    }
                  } catch {}
                }
              } catch (err) {
                toast.error("Audit failed", {
                  description:
                    err instanceof Error
                      ? err.message
                      : "Unknown error",
                });
              } finally {
                setLoading(false);
              }
            }}
          />
        </div>

        {report ? (
          <div className="grid lg:grid-cols-[1fr_360px] gap-6">
            <div className="space-y-6 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] text-muted-foreground inline-flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-surface-2 border border-border font-mono">
                    {sourceLabel}
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5">
                  <button
                    onClick={buildPreview}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md border border-border bg-surface-1 text-[11px] text-foreground hover:bg-surface-2 hover:border-white/15 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="h-3 w-3" />
                    Preview PDF
                  </button>
                </div>
              </div>

              <AuditSummary report={report} />

              <RepairActionBar
                onGenerateFixPlan={async () => {}}
                onAutoFix={async () => {}}
                onFixUntilGreen={async () => {}}
                onReRunAudit={async () => {}}
                onViewLogs={() => {}}
                generating={false}
                autoFixing={false}
                fixingUntilGreen={false}
                reRunning={false}
                disabled={loading}
              />

              <Tabs
                defaultValue="summary"
                className="w-full"
              >
                <TabsList className="bg-surface-1 border border-border h-9">
                  <TabsTrigger value="summary">
                    Summary
                  </TabsTrigger>

                  <TabsTrigger value="deps">
                    Dependencies
                  </TabsTrigger>

                  <TabsTrigger value="build">
                    Build Errors
                  </TabsTrigger>

                  <TabsTrigger value="env">
                    Environment
                  </TabsTrigger>

                  <TabsTrigger value="sec">
                    Security
                  </TabsTrigger>

                  <TabsTrigger value="plan">
                    Repair Plan
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="summary"
                  className="space-y-4 mt-4"
                >
                  <DependencyAuditCard
                    report={report}
                  />

                  <BuildErrorsCard
                    report={report}
                  />
                </TabsContent>

                <TabsContent
                  value="deps"
                  className="mt-4"
                >
                  <DependencyAuditCard
                    report={report}
                  />
                </TabsContent>

                <TabsContent
                  value="build"
                  className="mt-4"
                >
                  <BuildErrorsCard
                    report={report}
                  />
                </TabsContent>

                <TabsContent
                  value="env"
                  className="mt-4"
                >
                  <EnvironmentAuditCard
                    report={report}
                  />
                </TabsContent>

                <TabsContent
                  value="sec"
                  className="mt-4"
                >
                  <SecurityAuditCard
                    report={report}
                  />
                </TabsContent>

                <TabsContent
                  value="plan"
                  className="mt-4"
                >
                  <StepDiffPanel
                    report={report}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <RepairPlanCard report={report} />
          </div>
        ) : (
          <div className="glass rounded-2xl border border-white/10 p-10 text-center text-muted-foreground">
            Choose a source above and run an
            audit to view findings.
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        <AuditPdfPreviewDialog
          open={pdfPreviewOpen}
          onOpenChange={setPdfPreviewOpen}
          preview={pdfPreview}
          loading={pdfPreviewLoading}
          onConfirmDownload={() => {}}
          onRetryLogo={() => {}}
          retryingLogo={false}
        />
      </Suspense>

      <Suspense fallback={null}>
        <AuditPdfThemeEditor
          open={themeEditorOpen}
          onOpenChange={setThemeEditorOpen}
          value={customTheme}
          onSave={(next) => {
            setCustomTheme(next);

            try {
              window.localStorage.setItem(
                CUSTOM_THEME_KEY,
                JSON.stringify(next),
              );
            } catch {}

            toast.success(
              "Custom theme saved",
            );
          }}
          onReset={() => {
            setCustomTheme({});

            try {
              window.localStorage.removeItem(
                CUSTOM_THEME_KEY,
              );
            } catch {}

            toast(
              "Custom theme reset",
            );
          }}
        />
      </Suspense>
    </div>
  );
}
