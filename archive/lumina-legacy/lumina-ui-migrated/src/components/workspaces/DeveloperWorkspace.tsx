import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

import {
  ChevronDown,
  ChevronRight,
  Circle,
  Crosshair,
  FileCode2,
  FolderClosed,
  FolderOpen,
  Play,
  RotateCcw,
  Save,
  Wand2,
  X,
} from "lucide-react";

import { toast } from "sonner";

import { useWorkspace } from "@/context/WorkspaceContext";
import { PreviewFrame } from "@/components/preview/PreviewFrame";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { cn } from "@/lib/utils";
import {
  DevAIAssistPanel,
  DevAIAssistTrigger,
} from "./dev/DevAIAssistPanel";

const PROJECT_ID = "korelumina-dogfood";

export interface EditorSelection {
  text: string;
  startLine: number;
  endLine: number;
  pinned?: boolean;
}

interface TreeNodeItem {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: TreeNodeItem[];
}

function mergeRanges(
  a: EditorSelection[],
  b: EditorSelection[],
): EditorSelection[] {
  const all = [...a, ...b];

  const seen = new Set<string>();

  const out: EditorSelection[] = [];

  for (const r of all) {
    const key = `${r.startLine}:${r.endLine}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    out.push(r);
  }

  return out.sort(
    (x, y) =>
      x.startLine - y.startLine ||
      x.endLine - y.endLine,
  );
}

function buildTree(
  files: string[],
): TreeNodeItem[] {
  const root: TreeNodeItem[] = [];

  for (const filePath of files) {
    const parts = filePath.split("/");

    let current = root;

    let accumulated = "";

    parts.forEach((part, index) => {
      accumulated = accumulated
        ? `${accumulated}/${part}`
        : part;

      const isFile = index === parts.length - 1;

      let existing = current.find(
        (n) => n.name === part,
      );

      if (!existing) {
        existing = {
          name: part,
          path: accumulated,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
        };

        current.push(existing);
      }

      if (
        existing.type === "folder" &&
        existing.children
      ) {
        current = existing.children;
      }
    });
  }

  return root;
}

function tokens(line: string) {
  return line
    .replace(
      /(\/\/[^\n]*)/g,
      '<span class="text-muted-foreground">$1</span>',
    )
    .replace(
      /("[^"]*")/g,
      '<span class="text-gold">$1</span>',
    )
    .replace(
      /\b(import|from|export|default|return|function|const|let|var|async|await)\b/g,
      '<span class="text-magenta">$1</span>',
    )
    .replace(
      /(&lt;\/?\w+)/g,
      '<span class="text-violet">$1</span>',
    );
}

function ExplorerNode({
  node,
  depth = 0,
  active,
  onOpen,
}: {
  node: TreeNodeItem;
  depth?: number;
  active: string;
  onOpen: (path: string) => void;
}) {
  const [open, setOpen] = useState(true);

  if (node.type === "folder") {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            paddingLeft: 6 + depth * 12,
          }}
          className="flex items-center gap-1 w-full h-7 pr-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-surface-1 transition"
        >
          {open ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}

          {open ? (
            <FolderOpen className="h-3.5 w-3.5 text-violet" />
          ) : (
            <FolderClosed className="h-3.5 w-3.5 text-violet" />
          )}

          <span>{node.name}</span>
        </button>

        {open &&
          node.children?.map((child) => (
            <ExplorerNode
              key={child.path}
              node={child}
              depth={depth + 1}
              active={active}
              onOpen={onOpen}
            />
          ))}
      </div>
    );
  }

  const isActive = active === node.path;

  return (
    <button
      onClick={() => onOpen(node.path)}
      style={{
        paddingLeft: 18 + depth * 12,
      }}
      className={cn(
        "flex items-center gap-2 w-full h-7 pr-2 rounded-md text-sm transition",
        isActive
          ? "bg-surface-3 text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-surface-1",
      )}
    >
      <FileCode2
        className={cn(
          "h-3.5 w-3.5",
          isActive && "text-cyan",
        )}
      />

      <span className="truncate">
        {node.name}
      </span>
    </button>
  );
}

export function DeveloperWorkspace() {
  const {
    setBottomDockOpen,
    setCommandOpen,
  } = useWorkspace();

  const [files, setFiles] = useState<string[]>([]);

  const [openTabs, setOpenTabs] = useState<
    string[]
  >([]);

  const [active, setActive] = useState("");

  const [buffers, setBuffers] = useState<
    Record<string, string>
  >({});

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [aiOpen, setAiOpen] =
    useState(false);

  const [liveSelection, setLiveSelection] =
    useState<EditorSelection | null>(null);

  const [pinned, setPinned] = useState<
    EditorSelection[]
  >([]);

  const codeAreaRef =
    useRef<HTMLPreElement>(null);

  const scrollerRef =
    useRef<HTMLDivElement>(null);

  const selections = mergeRanges(
    pinned,
    liveSelection ? [liveSelection] : [],
  );

  const tree = useMemo(
    () => buildTree(files),
    [files],
  );

  useEffect(() => {
    async function boot() {
      try {
        const listRes = await fetch(
          `/api/dev/fs/list?projectId=${PROJECT_ID}`,
        );

        const listData =
          await listRes.json();

        const nextFiles = Array.isArray(
          listData.files,
        )
          ? listData.files.filter(
              (f: string) =>
                !f.startsWith(".next/"),
            )
          : [];

        setFiles(nextFiles);

        const initial =
          nextFiles.find((f: string) =>
            f.endsWith("page.tsx"),
          ) || nextFiles[0];

        if (!initial) {
          return;
        }

        setOpenTabs([initial]);

        setActive(initial);

        const readRes = await fetch(
          `/api/dev/fs/read?projectId=${PROJECT_ID}&file=${encodeURIComponent(
            initial,
          )}`,
        );

        const text = await readRes.text();

        setBuffers({
          [initial]: text,
        });

        const previewRes = await fetch(
          `/api/dev/preview?projectId=${PROJECT_ID}`,
        );

        const previewData =
          await previewRes.json();

        if (previewData?.url) {
          setPreviewUrl(previewData.url);
        }
      } catch (err) {
        console.error(err);

        toast.error(
          "Developer workspace failed to initialize",
        );
      }
    }

    boot();
  }, []);

  async function openFile(path: string) {
    setActive(path);

    if (!openTabs.includes(path)) {
      setOpenTabs((prev) => [
        ...prev,
        path,
      ]);
    }

    if (buffers[path] !== undefined) {
      return;
    }

    try {
      const res = await fetch(
        `/api/dev/fs/read?projectId=${PROJECT_ID}&file=${encodeURIComponent(
          path,
        )}`,
      );

      const text = await res.text();

      setBuffers((prev) => ({
        ...prev,
        [path]: text,
      }));
    } catch (err) {
      console.error(err);

      toast.error(
        `Failed to load ${path}`,
      );
    }
  }

  async function saveFile() {
    if (!active) {
      return;
    }

    try {
      const body = JSON.stringify({
        projectId: PROJECT_ID,
        file: active,
        content: activeCode,
      });

      const res = await fetch(
        "/api/dev/fs/write",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body,
        },
      );

      if (!res.ok) {
        throw new Error(
          "Write failed",
        );
      }

      toast.success(
        `${active.split("/").pop()} saved`,
      );
    } catch (err) {
      console.error(err);

      toast.error(
        "Save failed",
      );
    }
  }

  const activeCode =
    buffers[active] ?? "";

  const setActiveCode = (
    next: string,
  ) => {
    setBuffers((prev) => ({
      ...prev,
      [active]: next,
    }));
  };

  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();

      const root =
        codeAreaRef.current;

      if (
        !sel ||
        !root ||
        sel.rangeCount === 0
      ) {
        setLiveSelection(null);

        return;
      }

      const text = sel.toString();

      if (!text.trim()) {
        setLiveSelection(null);

        return;
      }

      setLiveSelection({
        text,
        startLine: 1,
        endLine: Math.max(
          1,
          text.split("\n").length,
        ),
      });
    };

    document.addEventListener(
      "selectionchange",
      onSelectionChange,
    );

    return () =>
      document.removeEventListener(
        "selectionchange",
        onSelectionChange,
      );
  }, []);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 p-4 md:p-6">
      <div className="flex items-center gap-2 anim-in">
        <LuminaButton
          size="sm"
          variant="primary"
          onClick={() => {
            setBottomDockOpen(true);

            toast.success(
              "Build started",
            );
          }}
        >
          <Play className="h-3.5 w-3.5" />
          Run
        </LuminaButton>

        <LuminaButton
          size="sm"
          variant="ghost"
          onClick={saveFile}
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </LuminaButton>

        <LuminaButton
          size="sm"
          variant="ghost"
          onClick={() =>
            toast(
              "Reverted to last saved",
            )
          }
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </LuminaButton>

        <LuminaButton
          size="sm"
          variant="ghost"
          onClick={() =>
            setCommandOpen(true)
          }
          className="hidden md:inline-flex"
        >
          ⌘K
        </LuminaButton>

        <div className="flex-1" />

        <DevAIAssistTrigger
          open={aiOpen}
          onClick={() =>
            setAiOpen(true)
          }
        />
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3">
        <aside className="w-full lg:w-60 shrink-0 glass-panel p-3 max-h-[30vh] lg:max-h-none overflow-y-auto">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-2 mb-2">
            Explorer
          </div>

          <div>
            {tree.map((node) => (
              <ExplorerNode
                key={node.path}
                node={node}
                active={active}
                onOpen={openFile}
              />
            ))}
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col glass-panel overflow-hidden">
          <div className="flex items-center gap-0.5 px-2 pt-2 border-b border-border overflow-x-auto">
            {openTabs.map((tab) => {
              const isActive =
                active === tab;

              return (
                <button
                  key={tab}
                  onClick={() =>
                    setActive(tab)
                  }
                  className={cn(
                    "group relative flex items-center gap-2 h-9 pl-3 pr-2 rounded-t-lg text-xs transition shrink-0",
                    isActive
                      ? "bg-background/60 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-1",
                  )}
                >
                  <Circle
                    className={cn(
                      "h-1.5 w-1.5 fill-current",
                      isActive
                        ? "text-cyan"
                        : "text-muted-foreground/50",
                    )}
                  />

                  <span className="max-w-[180px] truncate">
                    {tab.split("/").pop()}
                  </span>

                  <span
                    onClick={(e) => {
                      e.stopPropagation();

                      const next =
                        openTabs.filter(
                          (x) => x !== tab,
                        );

                      setOpenTabs(next);

                      if (
                        active === tab
                      ) {
                        setActive(
                          next[0] || "",
                        );
                      }
                    }}
                    className="h-4 w-4 grid place-items-center rounded hover:bg-surface-3 ml-1"
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

          <div
            ref={scrollerRef}
            className="flex-1 min-h-0 overflow-auto font-mono text-[13px] leading-6"
          >
            <div className="flex relative">
              <div className="relative select-none text-right pr-4 pl-4 py-4 text-muted-foreground/60 bg-background/30 border-r border-border">
                {activeCode
                  .split("\n")
                  .map((_, i) => (
                    <div key={i}>
                      {i + 1}
                    </div>
                  ))}
              </div>

              <div className="relative flex-1 min-w-0">
                <pre
                  ref={codeAreaRef}
                  contentEditable
                  suppressContentEditableWarning
                  spellCheck={false}
                  className="py-4 pl-4 pr-6 whitespace-pre overflow-x-auto relative z-10 outline-none text-foreground/90"
                  onInput={(e) => {
                    setActiveCode(
                      e.currentTarget.innerText,
                    );
                  }}
                  dangerouslySetInnerHTML={{
                    __html:
                      activeCode
                        .split("\n")
                        .map(
                          (line) =>
                            `<div>${
                              tokens(
                                line.replace(
                                  /</g,
                                  "&lt;",
                                ),
                              ) ||
                              "&nbsp;"
                            }</div>`,
                        )
                        .join(""),
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 px-3 h-8 border-t border-border text-[11px] text-muted-foreground bg-background/40">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_6px_hsl(var(--cyan))]" />
                connected
              </span>

              <span>
                TypeScript
              </span>

              <span>UTF-8</span>
            </div>

            <div className="flex items-center gap-3">
              {selections.length >
              0 ? (
                <span className="text-cyan inline-flex items-center gap-1.5">
                  {selections.length ===
                  1
                    ? `Sel L${selections[0].startLine}–L${selections[0].endLine}`
                    : `${selections.length} selections`}

                  {liveSelection && (
                    <button
                      onClick={() => {
                        setPinned(
                          mergeRanges(
                            pinned,
                            [
                              {
                                ...liveSelection,
                                pinned:
                                  true,
                              },
                            ],
                          ),
                        );

                        setLiveSelection(
                          null,
                        );

                        window
                          .getSelection()
                          ?.removeAllRanges();
                      }}
                      className="px-1.5 py-0.5 rounded border border-cyan/40 hover:bg-cyan/10 transition text-[10px]"
                    >
                      + Pin
                    </button>
                  )}
                </span>
              ) : (
                <span>
                  Ln 1, Col 1
                </span>
              )}

              <span className="text-cyan">
                ✓ no errors
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[380px] xl:w-[460px] shrink-0 min-h-[300px]">
          <PreviewFrame
            url={previewUrl || ""}
          />
        </div>
      </div>

      <DevAIAssistPanel
        open={aiOpen}
        onClose={() =>
          setAiOpen(false)
        }
        activeFile={active}
        activeCode={activeCode}
        selections={selections}
        onPinSelection={() => {
          if (!liveSelection) {
            return;
          }

          setPinned((prev) =>
            mergeRanges(prev, [
              {
                ...liveSelection,
                pinned: true,
              },
            ]),
          );

          setLiveSelection(null);

          window
            .getSelection()
            ?.removeAllRanges();
        }}
        onRemoveSelection={(idx) => {
          const target =
            selections[idx];

          if (!target) {
            return;
          }

          if (target.pinned) {
            setPinned((prev) =>
              prev.filter(
                (p) =>
                  !(
                    p.startLine ===
                      target.startLine &&
                    p.endLine ===
                      target.endLine
                  ),
              ),
            );
          } else {
            setLiveSelection(null);
          }
        }}
        onClearSelections={() => {
          setPinned([]);

          setLiveSelection(null);

          window
            .getSelection()
            ?.removeAllRanges();
        }}
        onReplaceCode={
          setActiveCode
        }
        onInsertSnippet={(
          snippet,
        ) => {
          setActiveCode(
            `${activeCode.trimEnd()}\n\n${snippet}\n`,
          );
        }}
      />
    </div>
  );
}

interface RangeBand {
  top: number;
  height: number;
  pinned: boolean;
  index: number;
  startLine: number;
  endLine: number;
}

function useRangeBands(
  codeAreaRef: RefObject<HTMLPreElement>,
  selections: EditorSelection[],
): RangeBand[] {
  const [bands, setBands] =
    useState<RangeBand[]>([]);

  useEffect(() => {
    const root =
      codeAreaRef.current;

    if (!root) {
      setBands([]);

      return;
    }

    const measure = () => {
      const lineEls = Array.from(
        root.children,
      ) as HTMLElement[];

      if (lineEls.length === 0) {
        setBands([]);

        return;
      }

      const next: RangeBand[] = [];

      selections.forEach(
        (s, index) => {
          const start =
            lineEls[
              s.startLine - 1
            ];

          const end =
            lineEls[
              s.endLine - 1
            ];

          if (!start || !end) {
            return;
          }

          const top =
            start.offsetTop;

          const height =
            end.offsetTop +
            end.offsetHeight -
            top;

          next.push({
            top,
            height,
            pinned: !!s.pinned,
            index,
            startLine:
              s.startLine,
            endLine:
              s.endLine,
          });
        },
      );

      setBands(next);
    };

    measure();

    const ro =
      new ResizeObserver(
        measure,
      );

    ro.observe(root);

    window.addEventListener(
      "resize",
      measure,
    );

    return () => {
      ro.disconnect();

      window.removeEventListener(
        "resize",
        measure,
      );
    };
  }, [codeAreaRef, selections]);

  return bands;
}
