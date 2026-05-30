import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

import { toast } from "sonner";

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
} from "lucide-react";

import { useWorkspace } from "@/context/WorkspaceContext";

import { PreviewFrame } from "@/components/preview/PreviewFrame";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { TransformButton } from "@/components/transform/TransformButton";

import {
  DevAIAssistPanel,
  DevAIAssistTrigger,
} from "./dev/DevAIAssistPanel";

import { cn } from "@/lib/utils";

import { useRuntimeBoot } from "@/hooks/useRuntimeBoot";

export interface EditorSelection {
  text: string;
  startLine: number;
  endLine: number;
  pinned?: boolean;
}

interface Node {
  name: string;
  type: "file" | "folder";
  children?: Node[];
}

interface RangeBand {
  top: number;
  height: number;
  pinned: boolean;
  index: number;
  startLine: number;
  endLine: number;
}

const fileTree: Node[] = [
  {
    name: "src",
    type: "folder",
    children: [
      {
        name: "components",
        type: "folder",
        children: [
          {
            name: "Hero.tsx",
            type: "file",
          },
          {
            name: "Nav.tsx",
            type: "file",
          },
        ],
      },
      {
        name: "pages",
        type: "folder",
        children: [
          {
            name: "Home.tsx",
            type: "file",
          },
          {
            name: "Pricing.tsx",
            type: "file",
          },
        ],
      },
      {
        name: "App.tsx",
        type: "file",
      },
      {
        name: "main.tsx",
        type: "file",
      },
    ],
  },
  {
    name: "package.json",
    type: "file",
  },
  {
    name: "tailwind.config.ts",
    type: "file",
  },
];

const sampleCode = `import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";

export default function Home() {
  return (
    <main className="bg-background text-foreground">
      <Hero
        title="Build, alive."
        subtitle="An AI-native studio for creators, designers and developers."
      />
      <Features />
    </main>
  );
}
`;

function mergeRanges(
  a: EditorSelection[],
  b: EditorSelection[],
): EditorSelection[] {
  const all = [...a, ...b];

  const seen = new Set<string>();

  const out: EditorSelection[] = [];

  for (const item of all) {
    const key = `${item.startLine}:${item.endLine}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    out.push(item);
  }

  return out.sort(
    (x, y) =>
      x.startLine - y.startLine ||
      x.endLine - y.endLine,
  );
}

function tokens(
  line: string,
): string {
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
      /\b(import|from|export|default|return|function|const|let|var)\b/g,
      '<span class="text-magenta">$1</span>',
    )
    .replace(
      /\b(Hero|Features)\b/g,
      '<span class="text-cyan">$1</span>',
    )
    .replace(
      /(&lt;\/?\w+)/g,
      '<span class="text-violet">$1</span>',
    );
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
  setOpenTabs: (
    tabs: string[],
  ) => void;
  active: string;
  setActive: (
    value: string,
  ) => void;
}) {
  const [open, setOpen] =
    useState(true);

  if (node.type === "folder") {
    return (
      <div>
        <button
          onClick={() =>
            setOpen(
              (value) =>
                !value,
            )
          }
          style={{
            paddingLeft:
              6 +
              depth * 12,
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

          <span>
            {node.name}
          </span>
        </button>

        {open &&
          node.children?.map(
            (child) => (
              <TreeNode
                key={
                  child.name
                }
                node={child}
                depth={
                  depth + 1
                }
                openTabs={
                  openTabs
                }
                setOpenTabs={
                  setOpenTabs
                }
                active={active}
                setActive={
                  setActive
                }
              />
            ),
          )}
      </div>
    );
  }

  const isActive =
    active === node.name;

  return (
    <button
      onClick={() => {
        setActive(node.name);

        if (
          !openTabs.includes(
            node.name,
          )
        ) {
          setOpenTabs([
            ...openTabs,
            node.name,
          ]);
        }
      }}
      style={{
        paddingLeft:
          18 +
          depth * 12,
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
          isActive &&
            "text-cyan",
        )}
      />

      <span>
        {node.name}
      </span>
    </button>
  );
}

function useRangeBands(
  codeAreaRef: RefObject<HTMLPreElement>,
  selections: EditorSelection[],
): RangeBand[] {
  const [bands, setBands] =
    useState<
      RangeBand[]
    >([]);

  useEffect(() => {
    const root =
      codeAreaRef.current;

    if (!root) {
      setBands([]);

      return;
    }

    const measure =
      () => {
        const lineEls =
          Array.from(
            root.children,
          ) as HTMLElement[];

        if (
          lineEls.length ===
          0
        ) {
          setBands([]);

          return;
        }

        const next: RangeBand[] =
          [];

        selections.forEach(
          (
            selection,
            index,
          ) => {
            const start =
              lineEls[
                selection.startLine -
                  1
              ];

            const end =
              lineEls[
                selection.endLine -
                  1
              ];

            if (
              !start ||
              !end
            ) {
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
              pinned:
                !!selection.pinned,
              index,
              startLine:
                selection.startLine,
              endLine:
                selection.endLine,
            });
          },
        );

        setBands(next);
      };

    measure();

    const observer =
      new ResizeObserver(
        measure,
      );

    observer.observe(root);

    window.addEventListener(
      "resize",
      measure,
    );

    return () => {
      observer.disconnect();

      window.removeEventListener(
        "resize",
        measure,
      );
    };
  }, [
    codeAreaRef,
    selections,
  ]);

  return bands;
}

export function DeveloperWorkspace() {
  const {
    setBottomDockOpen,
    setCommandOpen,
    activeProject,
  } = useWorkspace();

  const projectId =
  activeProject?.id ??
  null;

  const {
    runtimeUrl,
    runtimeLoading,
    runtimeError,
    runtimeProjectId,
  } = useRuntimeBoot(
    projectId,
  );

  const [
    openTabs,
    setOpenTabs,
  ] = useState<string[]>(
    [
      "Home.tsx",
      "Hero.tsx",
    ],
  );

  const [active, setActive] =
    useState(
      "Home.tsx",
    );

  const [
    buffers,
    setBuffers,
  ] = useState<
    Record<string, string>
  >({
    "Home.tsx":
      sampleCode,
  });

  const [aiOpen, setAiOpen] =
    useState(false);

  const codeAreaRef =
    useRef<HTMLPreElement>(
      null,
    );

  const scrollerRef =
    useRef<HTMLDivElement>(
      null,
    );

  const [
    liveSelection,
    setLiveSelection,
  ] =
    useState<EditorSelection | null>(
      null,
    );

  const [pinned, setPinned] =
    useState<
      EditorSelection[]
    >([]);

  const selections =
    useMemo(
      () =>
        mergeRanges(
          pinned,
          liveSelection
            ? [
                liveSelection,
              ]
            : [],
        ),
      [
        pinned,
        liveSelection,
      ],
    );

  useRangeBands(
    codeAreaRef,
    selections,
  );

  useEffect(() => {
    if (
      active &&
      buffers[active] ===
        undefined
    ) {
      setBuffers(
        (prev) => ({
          ...prev,
          [active]:
            sampleCode,
        }),
      );
    }
  }, [active, buffers]);

  const activeCode =
    buffers[active] ??
    sampleCode;

  const setActiveCode = (
    next: string,
  ) => {
    setBuffers(
      (prev) => ({
        ...prev,
        [active]: next,
      }),
    );
  };

  useEffect(() => {
    const onSelectionChange =
      () => {
        const selection =
          window.getSelection();

        const root =
          codeAreaRef.current;

        if (
          !selection ||
          !root ||
          selection.rangeCount ===
            0
        ) {
          setLiveSelection(
            null,
          );

          return;
        }

        const lineEls =
          Array.from(
            root.children,
          ) as HTMLElement[];

        const lineOf = (
          node: globalThis.Node | null,
        ): number => {
          if (!node) {
            return -1;
          }

          let element:
            | HTMLElement
            | null =
            node.nodeType ===
            1
              ? (node as HTMLElement)
              : node.parentElement;

          while (
            element &&
            element.parentElement !==
              root
          ) {
            element =
              element.parentElement;
          }

          return element
            ? lineEls.indexOf(
                element,
              )
            : -1;
        };

        const captured: EditorSelection[] =
          [];

        for (
          let index = 0;
          index <
          selection.rangeCount;
          index++
        ) {
          const range =
            selection.getRangeAt(
              index,
            );

          if (
            range.collapsed
          ) {
            continue;
          }

          if (
            !root.contains(
              range.startContainer,
            ) ||
            !root.contains(
              range.endContainer,
            )
          ) {
            continue;
          }

          const text =
            range.toString();

          if (
            !text.trim()
          ) {
            continue;
          }

          const startLine =
            lineOf(
              range.startContainer,
            );

          const endLine =
            lineOf(
              range.endContainer,
            );

          if (
            startLine < 0 ||
            endLine < 0
          ) {
            continue;
          }

          captured.push({
            text,
            startLine:
              Math.min(
                startLine,
                endLine,
              ) + 1,
            endLine:
              Math.max(
                startLine,
                endLine,
              ) + 1,
          });
        }

        if (
          captured.length ===
          0
        ) {
          setLiveSelection(
            null,
          );

          return;
        }

        setLiveSelection(
          captured[0],
        );
      };

    document.addEventListener(
      "selectionchange",
      onSelectionChange,
    );

    return () => {
      document.removeEventListener(
        "selectionchange",
        onSelectionChange,
      );
    };
  }, [active]);

  const pinCurrent =
    () => {
      if (
        !liveSelection
      ) {
        toast(
          "Select some code first to pin",
        );

        return;
      }

      setPinned(
        (prev) =>
          mergeRanges(
            prev,
            [
              {
                ...liveSelection,
                pinned: true,
              },
            ],
          ),
      );

      window
        .getSelection()
        ?.removeAllRanges();

      setLiveSelection(
        null,
      );

      toast(
        `Pinned L${liveSelection.startLine}–L${liveSelection.endLine}`,
      );
    };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 p-4 md:p-6">
      <div className="flex items-center gap-2 anim-in">
        <LuminaButton
          size="sm"
          variant="primary"
          onClick={() => {
            setBottomDockOpen(
              true,
            );

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
          onClick={() =>
            toast.success(
              `${active} saved`,
            )
          }
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
            setCommandOpen(
              true,
            )
          }
          className="hidden md:inline-flex"
        >
          ⌘K
        </LuminaButton>

        <div className="flex-1" />

        <TransformButton
          source="builder"
          project={
            activeProject
          }
        />
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3">
        <aside className="w-full lg:w-60 shrink-0 glass-panel p-3 max-h-[30vh] lg:max-h-none overflow-y-auto">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-2 mb-2">
            Explorer
          </div>

          <div>
            {fileTree.map(
              (node) => (
                <TreeNode
                  key={
                    node.name
                  }
                  node={node}
                  openTabs={
                    openTabs
                  }
                  setOpenTabs={
                    setOpenTabs
                  }
                  active={
                    active
                  }
                  setActive={
                    setActive
                  }
                />
              ),
            )}
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col glass-panel overflow-hidden">
          <div className="flex items-center gap-0.5 px-2 pt-2 border-b border-border overflow-x-auto">
            {openTabs.map(
              (tab) => {
                const isActive =
                  active === tab;

                return (
                  <button
                    key={tab}
                    onClick={() =>
                      setActive(
                        tab,
                      )
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

                    {tab}

                    <span
                      onClick={(
                        event,
                      ) => {
                        event.stopPropagation();

                        const next =
                          openTabs.filter(
                            (
                              value,
                            ) =>
                              value !==
                              tab,
                          );

                        setOpenTabs(
                          next,
                        );

                        if (
                          active ===
                          tab
                        ) {
                          setActive(
                            next[0] ??
                              "",
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
              },
            )}
          </div>

          <div
            ref={scrollerRef}
            className="flex-1 min-h-0 overflow-auto font-mono text-[13px] leading-6"
          >
            <div className="flex relative">
              <div className="relative select-none text-right pr-4 pl-4 py-4 text-muted-foreground/60 bg-background/30 border-r border-border">
                {activeCode
                  .split("\n")
                  .map(
                    (
                      _,
                      index,
                    ) => (
                      <div
                        key={
                          index
                        }
                      >
                        {index + 1}
                      </div>
                    ),
                  )}
              </div>

              <div className="relative flex-1 min-w-0">
                <pre
                  ref={
                    codeAreaRef
                  }
                  className="py-4 pl-4 pr-6 whitespace-pre overflow-x-auto relative z-10"
                >
                  {activeCode
                    .split("\n")
                    .map(
                      (
                        line,
                        index,
                      ) => (
                        <div
                          key={
                            index
                          }
                          className="text-foreground/90"
                          dangerouslySetInnerHTML={{
                            __html:
                              tokens(
                                line.replace(
                                  /</g,
                                  "&lt;",
                                ),
                              ) ||
                              "&nbsp;",
                          }}
                        />
                      ),
                    )}
                </pre>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 px-3 h-8 border-t border-border text-[11px] text-muted-foreground bg-background/40">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_6px_hsl(var(--cyan))]" />

                {runtimeLoading
                  ? "booting runtime"
                  : runtimeError
                    ? runtimeError
                    : "connected"}
              </span>

              <span>
              {runtimeProjectId ??
               projectId ??
               "no-runtime"}               
              </span>
            </div>

            <div className="flex items-center gap-3">
              {runtimeUrl && (
                <span className="text-cyan">
                  live runtime
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative flex h-full min-h-[420px] lg:min-h-0 w-full lg:w-[45%] xl:w-[50%] shrink-0 overflow-hidden">
          <PreviewFrame
            url={runtimeUrl}
          />
        </div>
      </div>

      <DevAIAssistTrigger
        open={aiOpen}
        onClick={() =>
          setAiOpen(true)
        }
      />

      <DevAIAssistPanel
        open={aiOpen}
        onClose={() =>
          setAiOpen(false)
        }
        activeFile={active}
        activeCode={activeCode}
        selections={selections}
        onPinSelection={
          pinCurrent
        }
        onRemoveSelection={(
          index,
        ) => {
          const target =
            selections[
              index
            ];

          if (!target) {
            return;
          }

          if (
            target.pinned
          ) {
            setPinned(
              (prev) =>
                prev.filter(
                  (item) =>
                    !(
                      item.startLine ===
                        target.startLine &&
                      item.endLine ===
                        target.endLine
                    ),
                ),
            );

            return;
          }

          window
            .getSelection()
            ?.removeAllRanges();

          setLiveSelection(
            null,
          );
        }}
        onClearSelections={() => {
          window
            .getSelection()
            ?.removeAllRanges();

          setLiveSelection(
            null,
          );

          setPinned([]);
        }}
        onReplaceCode={
          setActiveCode
        }
        onInsertSnippet={(
          snippet,
        ) =>
          setActiveCode(
            activeCode.replace(
              /\s*$/,
              "",
            ) +
              "\n\n" +
              snippet +
              "\n",
          )
        }
      />
    </div>
  );
}
