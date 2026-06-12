import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { toast } from "sonner";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  ChevronRight,
  ChevronDown,
  FolderClosed,
  FolderOpen,
  FileCode2,
  Play,
  Save,
  RotateCcw,
  X,
  Circle,
  Search,
} from "lucide-react";
import { PreviewFrame } from "@/components/preview/PreviewFrame";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { cn } from "@/lib/utils";
import { DevAIAssistPanel, DevAIAssistTrigger } from "./dev/DevAIAssistPanel";
import { TransformButton } from "@/components/transform/TransformButton";
import { useRuntimeBoot } from "@/hooks/useRuntimeBoot";
import {
  listRuntimeFiles,
  readRuntimeFile,
  writeRuntimeFile,
} from "@/services/runtimeService";

export interface EditorSelection {
  text: string;
  startLine: number;
  endLine: number;
  pinned?: boolean;
}

interface Node {
  name: string;
  type: "file" | "folder";
  path: string;
  children?: Node[];
}

const TEXT_FILE_RE =
  /\.(tsx|ts|jsx|js|mjs|cjs|css|scss|sass|less|html|json|md|mdx|txt|yml|yaml|toml|env|gitignore|dockerignore|config|svg)$/i;

const SKIP_PATH_RE =
  /(^|\/)(node_modules|\.git|dist|build|\.next|coverage|\.turbo|\.cache)(\/|$)/;

function isReadableFile(file: string) {
  const normalized = file.replace(/\\/g, "/");
  if (SKIP_PATH_RE.test(normalized)) return false;
  if (normalized.includes("\0")) return false;
  if (normalized.endsWith("/")) return false;
  if (TEXT_FILE_RE.test(normalized)) return true;

  const base = normalized.split("/").pop() ?? "";
  return [
    "Dockerfile",
    "Procfile",
    "Makefile",
    "README",
    "LICENSE",
    ".env",
    ".env.example",
    ".gitignore",
  ].includes(base);
}

function sortNodes(nodes: Node[]): Node[] {
  return [...nodes]
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((node) =>
      node.children
        ? {
            ...node,
            children: sortNodes(node.children),
          }
        : node,
    );
}

function buildFileTree(files: string[]): Node[] {
  const root: Node[] = [];

  for (const raw of files) {
    const file = raw.replace(/\\/g, "/").replace(/^\/+/, "");
    if (!file || !isReadableFile(file)) continue;

    const parts = file.split("/").filter(Boolean);
    let cursor = root;
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = index === parts.length - 1;

      let existing = cursor.find((node) => node.name === part);

      if (!existing) {
        existing = {
          name: part,
          type: isFile ? "file" : "folder",
          path: currentPath,
          children: isFile ? undefined : [],
        };
        cursor.push(existing);
      }

      if (!isFile) {
        existing.children ??= [];
        cursor = existing.children;
      }
    });
  }

  return sortNodes(root);
}

function detectLanguage(file?: string) {
  const ext = file?.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "ts":
    case "tsx":
      return "typescript";
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      return "javascript";
    case "css":
    case "scss":
    case "sass":
    case "less":
      return "css";
    case "html":
      return "html";
    case "json":
      return "json";
    case "md":
    case "mdx":
      return "markdown";
    case "yml":
    case "yaml":
      return "yaml";
    default:
      return "plaintext";
  }
}

function TreeNode({
  node,
  depth = 0,
  openTabs,
  setOpenTabs,
  active,
  setActive,
}: {
  node: Node;
  depth?: number;
  openTabs: string[];
  setOpenTabs: React.Dispatch<React.SetStateAction<string[]>>;
  active: string;
  setActive: (s: string) => void;
}) {
  const [open, setOpen] = useState(true);

  if (node.type === "folder") {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{ paddingLeft: 6 + depth * 12 }}
          className="flex items-center gap-1 w-full h-7 pr-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-surface-1 transition"
          title={node.path}
        >
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {open ? <FolderOpen className="h-3.5 w-3.5 text-violet" /> : <FolderClosed className="h-3.5 w-3.5 text-violet" />}
          <span className="truncate">{node.name}</span>
        </button>

        {open &&
          node.children?.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              openTabs={openTabs}
              setOpenTabs={setOpenTabs}
              active={active}
              setActive={setActive}
            />
          ))}
      </div>
    );
  }

  const isActive = active === node.path;

  return (
    <button
      onClick={() => {
        setActive(node.path);
        if (!openTabs.includes(node.path)) {
          setOpenTabs((tabs) => [...tabs, node.path]);
        }
      }}
      style={{ paddingLeft: 18 + depth * 12 }}
      className={cn(
        "flex items-center gap-2 w-full h-7 pr-2 rounded-md text-sm transition",
        isActive
          ? "bg-surface-3 text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-surface-1",
      )}
      title={node.path}
    >
      <FileCode2 className={cn("h-3.5 w-3.5 shrink-0", isActive && "text-cyan")} />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export function DeveloperWorkspace() {
  const { setBottomDockOpen, setCommandOpen, activeProject } = useWorkspace();
  const projectId = activeProject?.id ?? null;
  const {
    runtimeUrl,
    runtimePhase,
    runtimeMessage,
    runtimeProgress,
    runtimeError,
  } = useRuntimeBoot(projectId);

  const [runtimeFiles, setRuntimeFiles] = useState<string[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filesError, setFilesError] = useState<string | null>(null);

  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [active, setActive] = useState("");
  const [buffers, setBuffers] = useState<Record<string, string>>({});
  const [savedBuffers, setSavedBuffers] = useState<Record<string, string>>({});
  const [fileHashes, setFileHashes] = useState<Record<string, string>>({});
  const [loadingFile, setLoadingFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const loadRunId = useRef(0);

  const tree = useMemo(() => buildFileTree(runtimeFiles), [runtimeFiles]);
  const activeCode = active ? buffers[active] ?? "" : "";
  const activeSavedCode = active ? savedBuffers[active] ?? "" : "";
  const dirty = active ? activeCode !== activeSavedCode : false;
  const language = detectLanguage(active);

  const setActiveCode = (next: string) => {
    if (!active) return;
    setBuffers((current) => ({
      ...current,
      [active]: next,
    }));
  };

  useEffect(() => {
    let cancelled = false;

    async function loadFiles() {
      if (!projectId) {
        setRuntimeFiles([]);
        setOpenTabs([]);
        setActive("");
        setBuffers({});
        setSavedBuffers({});
        setFileHashes({});
        setFilesError(null);
        return;
      }

      try {
        setLoadingFiles(true);
        setFilesError(null);

        const files = (await listRuntimeFiles(projectId)).filter(isReadableFile);

        if (cancelled) return;

        setRuntimeFiles(files);

        const preferred =
          files.find((file) => file === "app/page.tsx") ??
          files.find((file) => file === "src/App.tsx") ??
          files.find((file) => file === "src/main.tsx") ??
          files.find((file) => file.endsWith("/page.tsx")) ??
          files.find((file) => file.endsWith("/App.tsx")) ??
          files[0] ??
          "";

        setActive(preferred);
        setOpenTabs(preferred ? [preferred] : []);
        setBuffers({});
        setSavedBuffers({});
        setFileHashes({});
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "failed_to_load_files";
        setFilesError(message);
        setRuntimeFiles([]);
        toast.error(`Explorer failed: ${message}`);
      } finally {
        if (!cancelled) setLoadingFiles(false);
      }
    }

    loadFiles();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !active) return;
    if (buffers[active] !== undefined) return;

    const runId = ++loadRunId.current;
    let cancelled = false;

    async function loadFile() {
      try {
        setLoadingFile(true);

        const file = await readRuntimeFile(projectId, active);

        if (cancelled || runId !== loadRunId.current) return;

        setBuffers((current) => ({
          ...current,
          [active]: file.content ?? "",
        }));
        setSavedBuffers((current) => ({
          ...current,
          [active]: file.content ?? "",
        }));

        if (file.sha256) {
          setFileHashes((current) => ({
            ...current,
            [active]: file.sha256,
          }));
        }
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "failed_to_read_file";
        toast.error(`Read failed: ${message}`);
        setBuffers((current) => ({
          ...current,
          [active]: `/* Failed to load ${active}: ${message} */`,
        }));
        setSavedBuffers((current) => ({
          ...current,
          [active]: `/* Failed to load ${active}: ${message} */`,
        }));
      } finally {
        if (!cancelled) setLoadingFile(false);
      }
    }

    loadFile();

    return () => {
      cancelled = true;
    };
  }, [projectId, active, buffers]);

  async function handleSave() {
    if (!projectId || !active) {
      toast.error("No active runtime file selected");
      return;
    }

    try {
      setSaving(true);

      const result = await writeRuntimeFile({
        projectId,
        file: active,
        content: activeCode,
        expectedSha256: fileHashes[active],
      });

      setSavedBuffers((current) => ({
        ...current,
        [active]: activeCode,
      }));

      if (result.sha256) {
        setFileHashes((current) => ({
          ...current,
          [active]: result.sha256,
        }));
      }

      toast.success(`${active} saved`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "failed_to_save_file";
      toast.error(`Save failed: ${message}`);
    } finally {
      setSaving(false);
    }
  }

  function handleRevert() {
    if (!active) return;

    setBuffers((current) => ({
      ...current,
      [active]: savedBuffers[active] ?? "",
    }));

    toast("Reverted to last saved");
  }

  const closeTab = (file: string) => {
    setOpenTabs((tabs) => {
      const next = tabs.filter((tab) => tab !== file);

      if (active === file) {
        const index = tabs.indexOf(file);
        const fallback = next[index] ?? next[index - 1] ?? next[0] ?? "";
        setActive(fallback);
      }

      return next;
    });
  };

  const selections: EditorSelection[] = [];

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 p-4 md:p-6">
      {/* Action bar */}
      <div className="flex items-center gap-2 shrink-0">
        <LuminaButton
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={!active || saving || loadingFile}
        >
          <Save className="h-3.5 w-3.5" />
          <span className="hidden md:inline">{saving ? "Saving..." : "Save"}</span>
        </LuminaButton>

        <LuminaButton
          size="sm"
          variant="ghost"
          onClick={handleRevert}
          disabled={!active || !dirty}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Revert</span>
        </LuminaButton>

        <LuminaButton
          size="sm"
          variant="ghost"
          onClick={() => setCommandOpen(true)}
          className="hidden md:inline-flex"
        >
          <Search className="h-3.5 w-3.5" />
          Command
        </LuminaButton>

        <TransformButton source="builder" project={activeProject} />

        <LuminaButton
          size="sm"
          variant="primary"
          onClick={() => {
            setBottomDockOpen(true);
            toast.success("Build started");
          }}
        >
          <Play className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Build</span>
        </LuminaButton>

        <div className="ml-auto hidden md:flex items-center gap-2 text-[11px] text-muted-foreground min-w-0">
          {dirty && (
            <span className="inline-flex items-center gap-1 text-gold">
              <Circle className="h-1.5 w-1.5 fill-current" />
              Unsaved
            </span>
          )}
          {active && <span className="truncate max-w-[360px]">{active}</span>}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3">
        {/* File tree */}
        <aside className="w-full lg:w-60 shrink-0 glass-panel p-3 max-h-[30vh] lg:max-h-none overflow-y-auto">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-2 mb-2">
            Explorer
          </div>

          <div>
            {!projectId && (
              <div className="px-2 py-3 text-xs text-muted-foreground">
                Select a project to load files.
              </div>
            )}

            {projectId && loadingFiles && (
              <div className="px-2 py-3 text-xs text-muted-foreground">
                Loading runtime files...
              </div>
            )}

            {projectId && filesError && (
              <div className="px-2 py-3 text-xs text-destructive">
                {filesError}
              </div>
            )}

            {projectId && !loadingFiles && !filesError && tree.length === 0 && (
              <div className="px-2 py-3 text-xs text-muted-foreground">
                No readable files found.
              </div>
            )}

            {tree.map((node) => (
              <TreeNode
                key={node.path}
                node={node}
                openTabs={openTabs}
                setOpenTabs={setOpenTabs}
                active={active}
                setActive={setActive}
              />
            ))}
          </div>
        </aside>

        {/* Editor */}
        <div className="flex-1 min-w-0 flex flex-col glass-panel overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-0.5 px-2 pt-2 border-b border-border overflow-x-auto">
            {openTabs.length === 0 && (
              <div className="h-9 flex items-center px-3 text-xs text-muted-foreground">
                No file open
              </div>
            )}

            {openTabs.map((tab) => {
              const isActive = active === tab;
              const tabDirty = (buffers[tab] ?? "") !== (savedBuffers[tab] ?? "");

              return (
                <button
                  key={tab}
                  onClick={() => setActive(tab)}
                  className={cn(
                    "group relative flex items-center gap-2 h-9 pl-3 pr-2 rounded-t-lg text-xs transition shrink-0 max-w-[220px]",
                    isActive
                      ? "bg-background/60 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-1",
                  )}
                  title={tab}
                >
                  <Circle
                    className={cn(
                      "h-1.5 w-1.5 fill-current shrink-0",
                      tabDirty
                        ? "text-gold"
                        : isActive
                          ? "text-cyan"
                          : "text-muted-foreground/50",
                    )}
                  />
                  <span className="truncate">{tab.split("/").pop() ?? tab}</span>
                  <span
                    onClick={(event) => {
                      event.stopPropagation();
                      closeTab(tab);
                    }}
                    className="h-4 w-4 grid place-items-center rounded hover:bg-surface-3 ml-1 shrink-0"
                    aria-label={`Close ${tab}`}
                  >
                    <X className="h-3 w-3" />
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 inset-x-2 h-px bg-button-lumina" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Code area */}
          <div className="flex-1 min-h-0 overflow-hidden font-mono text-[13px] leading-6">
            {active ? (
              <Editor
                key={active}
                height="100%"
                path={active}
                language={language}
                theme="kore-dark"
                value={activeCode}
                loading={
                  <div className="h-full grid place-items-center text-xs text-muted-foreground">
                    Loading editor...
                  </div>
                }
                beforeMount={(monaco) => {
                  monaco.editor.defineTheme("kore-dark", {
                    base: "vs-dark",
                    inherit: true,
                    rules: [
                      { token: "comment", foreground: "6A9955" },
                      { token: "keyword", foreground: "C586C0" },
                      { token: "string", foreground: "CE9178" },
                      { token: "number", foreground: "B5CEA8" },
                      { token: "type.identifier", foreground: "4EC9B0" },
                      { token: "identifier", foreground: "9CDCFE" },
                    ],
                    colors: {
                      "editor.background": "#0b0b0b",
                      "editor.foreground": "#e5e7eb",
                      "editorLineNumber.foreground": "#64748b",
                      "editorLineNumber.activeForeground": "#e5e7eb",
                      "editorCursor.foreground": "#22d3ee",
                      "editor.selectionBackground": "#2563eb55",
                      "editor.inactiveSelectionBackground": "#33415566",
                    },
                  });
                }}
                options={{
                  fontSize: 13,
                  fontFamily:
                    "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  minimap: { enabled: false },
                  wordWrap: "on",
                  automaticLayout: true,
                  tabSize: 2,
                  insertSpaces: true,
                  scrollBeyondLastLine: false,
                  lineNumbers: "on",
                  renderLineHighlight: "all",
                  smoothScrolling: true,
                  cursorSmoothCaretAnimation: "on",
                  padding: { top: 14, bottom: 14 },
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  fixedOverflowWidgets: true,
                }}
                onChange={(value) => setActiveCode(value ?? "")}
              />
            ) : (
              <div className="h-full grid place-items-center text-sm text-muted-foreground">
                Select a file from Explorer.
              </div>
            )}
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between gap-3 px-3 h-8 border-t border-border text-[11px] text-muted-foreground bg-background/40">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_6px_hsl(var(--cyan))]" />
                connected
              </span>
              <span>{language}</span>
              <span>UTF-8</span>
              {loadingFile && <span>loading...</span>}
            </div>

            <div className="flex items-center gap-3 min-w-0">
              {active ? (
                <span className="truncate">
                  {dirty ? "Unsaved changes" : "Saved"} · {activeCode.split("\n").length} lines
                </span>
              ) : (
                <span>No file selected</span>
              )}
              <span className="text-cyan">✓ no errors</span>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="w-full lg:w-[380px] xl:w-[460px] shrink-0 min-h-[300px]">
          <PreviewFrame
            url={runtimeUrl}
            projectId={projectId ?? undefined}
            runtimePhase={runtimePhase}
            runtimeMessage={runtimeMessage}
            runtimeProgress={runtimeProgress}
            runtimeError={runtimeError}
          />
        </div>
      </div>

      {/* AI Assist (Dev) */}
      <DevAIAssistTrigger open={aiOpen} onClick={() => setAiOpen(true)} />
      <DevAIAssistPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        activeFile={active}
        activeCode={activeCode}
        selections={selections}
        onPinSelection={() => toast("Monaco selection pinning is not wired yet")}
        onRemoveSelection={() => undefined}
        onClearSelections={() => undefined}
        onReplaceCode={setActiveCode}
        onInsertSnippet={(snippet) =>
          setActiveCode(activeCode.replace(/\s*$/, "") + "\n\n" + snippet + "\n")
        }
      />
    </div>
  );
}
