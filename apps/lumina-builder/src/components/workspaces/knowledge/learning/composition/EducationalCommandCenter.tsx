import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowUp,
  BookOpenCheck,
  BrainCircuit,
  Eye,
  FileSearch,
  Gauge,
  Layers3,
  ListTree,
  RotateCcw,
  Clock3,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  LuminaButton,
} from "@/components/lumina/LuminaButton";

import {
  LuminaStatusBadge,
  LuminaWorkspacePanel,
} from "@/components/lumina/workspace";

import {
  cn,
} from "@/lib/utils";

import {
  LuminaFlagshipPanel,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

import {
  FlagshipPanel,
  flagshipAppearance,
} from "../presentation";

import {
  ExecutiveEducationalSummary,
  GenesisCorpusOverview,
} from "../regions";

import {
  EducationalStateSurface,
} from "../states";

import {
  EducationalDashboardMain,
} from "./EducationalDashboardMain";

import {
  useEducationalDashboardState,
} from "../state";

const LEARNING_SECTIONS = [
  {
    id: "learning-genesis-corpus",
    label: "Genesis Corpus",
    icon: BookOpenCheck,
  },
  {
    id: "learning-genesis-sources",
    label: "Genesis Sources",
    icon: Layers3,
  },
  {
    id: "learning-corpus-explorer",
    label: "Corpus Explorer",
    icon: ListTree,
  },
  {
    id: "learning-artifact-inspector",
    label: "Artifact Inspector",
    icon: FileSearch,
  },
  {
    id: "learning-timeline",
    label: "Timeline",
    icon: Clock3,
  },
  {
    id: "learning-competency",
    label: "Competency",
    icon: BrainCircuit,
  },
  {
    id: "learning-activation",
    label: "Activation",
    icon: Gauge,
  },
] as const;

function getLearningScrollBehavior(): ScrollBehavior {
  return window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches
    ? "auto"
    : "smooth";
}

function LearningSectionNavigator() {
  const navigatorRef =
    useRef<HTMLElement | null>(null);
  const navigatorContentRef =
    useRef<HTMLDivElement | null>(null);
  const scrollFrameRef =
    useRef<number | null>(null);
  const programmaticTargetRef =
    useRef<string | null>(null);

  const [showLeftFade, setShowLeftFade] =
    useState(false);
  const [showRightFade, setShowRightFade] =
    useState(false);

  const [
    activeSectionId,
    setActiveSectionId,
  ] = useState<string>(
    LEARNING_SECTIONS[0].id,
  );

  const updateOverflowAffordance =
    useCallback(() => {
      const navigator =
        navigatorRef.current;

      if (!navigator) {
        return;
      }

      const maxScrollLeft =
        navigator.scrollWidth -
        navigator.clientWidth;

      const nextShowLeftFade =
        navigator.scrollLeft > 4;

      const nextShowRightFade =
        maxScrollLeft -
          navigator.scrollLeft >
        4;

      setShowLeftFade((current) =>
        current === nextShowLeftFade
          ? current
          : nextShowLeftFade,
      );

      setShowRightFade((current) =>
        current === nextShowRightFade
          ? current
          : nextShowRightFade,
      );
    }, []);

  useEffect(() => {
    const scheduleOverflowUpdate = () => {
      if (
        scrollFrameRef.current !== null
      ) {
        return;
      }

      scrollFrameRef.current =
        requestAnimationFrame(() => {
          scrollFrameRef.current = null;
          updateOverflowAffordance();
        });
    };

    scheduleOverflowUpdate();

    const navigator =
      navigatorRef.current;

    if (!navigator) {
      return;
    }

    navigator.addEventListener(
      "scroll",
      scheduleOverflowUpdate,
      { passive: true },
    );

    const resizeObserver =
      new ResizeObserver(
        scheduleOverflowUpdate,
      );

    resizeObserver.observe(navigator);

    const navigatorContent =
      navigatorContentRef.current;

    if (navigatorContent) {
      resizeObserver.observe(
        navigatorContent,
      );
    }

    return () => {
      navigator.removeEventListener(
        "scroll",
        scheduleOverflowUpdate,
      );

      if (
        scrollFrameRef.current !== null
      ) {
        cancelAnimationFrame(
          scrollFrameRef.current,
        );
        scrollFrameRef.current = null;
      }

      resizeObserver.disconnect();
    };
  }, [updateOverflowAffordance]);

  useEffect(() => {
    const sections = LEARNING_SECTIONS
      .map((section) =>
        document.getElementById(
          section.id,
        ),
      )
      .filter(
        (
          section,
        ): section is HTMLElement =>
          section !== null,
      );

    if (sections.length === 0) {
      return;
    }

    const visibleSections =
      new Map<
        string,
        IntersectionObserverEntry
      >();

    const updateFromVisibleSections =
      () => {
        if (
          programmaticTargetRef.current
        ) {
          return;
        }

        const candidates =
          Array.from(
            visibleSections.values(),
          ).filter(
            (entry) =>
              entry.isIntersecting,
          );

        if (candidates.length === 0) {
          return;
        }

        const activationLine = 112;

        const next = candidates
          .slice()
          .sort((a, b) => {
            const aDistance =
              Math.abs(
                a.boundingClientRect.top -
                  activationLine,
              );

            const bDistance =
              Math.abs(
                b.boundingClientRect.top -
                  activationLine,
              );

            return aDistance - bDistance;
          })[0];

        const nextSectionId =
          (
            next.target as HTMLElement
          ).id;

        setActiveSectionId((current) =>
          current === nextSectionId
            ? current
            : nextSectionId,
        );
      };

    const observer =
      new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            visibleSections.set(
              (
                entry.target as HTMLElement
              ).id,
              entry,
            );
          }

          updateFromVisibleSections();
        },
        {
          root: null,
          rootMargin:
            "-112px 0px -55% 0px",
          threshold: [
            0,
            0.01,
            0.1,
            0.25,
            0.5,
          ],
        },
      );

    for (const section of sections) {
      observer.observe(section);
    }

    const releaseProgrammaticNavigation =
      () => {
        if (
          programmaticTargetRef.current ===
          null
        ) {
          return;
        }

        programmaticTargetRef.current =
          null;

        updateFromVisibleSections();
      };

    window.addEventListener(
      "wheel",
      releaseProgrammaticNavigation,
      { passive: true },
    );

    window.addEventListener(
      "touchstart",
      releaseProgrammaticNavigation,
      { passive: true },
    );

    return () => {
      observer.disconnect();

      window.removeEventListener(
        "wheel",
        releaseProgrammaticNavigation,
      );

      window.removeEventListener(
        "touchstart",
        releaseProgrammaticNavigation,
      );
    };
  }, []);

  function handleNavigate(
    sectionId: string,
  ) {
    const behavior =
      getLearningScrollBehavior();

    setActiveSectionId(sectionId);

    programmaticTargetRef.current =
      behavior === "smooth"
        ? sectionId
        : null;

    document
      .getElementById(sectionId)
      ?.scrollIntoView({
        behavior,
        block: "start",
      });
  }

  return (
    <nav
      ref={navigatorRef}
      aria-label="Educational learning sections"
      className={[
        "group relative sticky top-4 z-40 overflow-x-auto rounded-2xl border p-2",
        "border-cyan-300/70 ring-1 ring-inset ring-blue-400/35",
        "bg-slate-950/88",
        "shadow-[0_0_0_1px_rgba(34,211,238,0.16),0_0_30px_rgba(37,99,235,0.22),0_20px_60px_rgba(2,6,23,0.48)]",
        "backdrop-blur-2xl",
      ].join(" ")}
    >
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none sticky left-0 z-10 -mb-full h-full w-8",
          "bg-gradient-to-r from-slate-950/95 to-transparent",
          "transition-opacity duration-200 xl:hidden",
          showLeftFade
            ? "opacity-100"
            : "opacity-0",
        ].join(" ")}
      />

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none sticky right-0 z-10 float-right -mb-full h-full w-8",
          "bg-gradient-to-l from-slate-950/95 to-transparent",
          "transition-opacity duration-200 xl:hidden",
          showRightFade
            ? "opacity-100"
            : "opacity-0",
        ].join(" ")}
      />

      <div
        ref={navigatorContentRef}
        className="grid min-w-[920px] grid-cols-7 items-center gap-2 xl:min-w-0"
      >
        {LEARNING_SECTIONS.map(
          (section) => {
            const Icon = section.icon;

            return (
              <button
                key={section.id}
                type="button"
                aria-current={
                  activeSectionId ===
                  section.id
                    ? "location"
                    : undefined
                }
                onClick={() =>
                  handleNavigate(
                    section.id,
                  )
                }
                className={[
                  "inline-flex h-9 w-full min-w-0 items-center justify-center gap-2 rounded-xl border px-3",
                  "text-[10px] font-semibold uppercase tracking-[0.12em]",
                  "border-cyan-300/62 ring-1 ring-inset ring-blue-400/28",
                  activeSectionId ===
                  section.id
                    ? "border-amber-200 bg-[linear-gradient(180deg,rgba(217,119,6,0.99),rgba(146,64,14,0.99))] text-amber-50 ring-1 ring-inset ring-amber-300/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_0_30px_rgba(251,191,36,0.34),0_0_18px_rgba(37,99,235,0.18)]"
                    : "border-cyan-300/62 bg-[linear-gradient(180deg,rgba(146,64,14,0.96),rgba(92,36,5,0.96))] text-amber-100 ring-1 ring-inset ring-blue-400/28 shadow-[inset_0_1px_0_rgba(251,191,36,0.16),0_0_18px_rgba(37,99,235,0.16)]",
                  "transition-[border-color,background-color,color,box-shadow,transform] duration-200",
                  "hover:border-cyan-200/90 hover:bg-[linear-gradient(180deg,rgba(146,64,14,0.98),rgba(92,36,5,0.98))] hover:text-amber-50",
                  "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_24px_rgba(37,99,235,0.24)]",
                  "active:translate-y-px",
                  "focus-visible:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-amber-300/90",
                  "focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                ].join(" ")}
              >
                <Icon className="h-3.5 w-3.5" />

                <span className="text-cyan">
                  {section.label}
                </span>
              </button>
            );
          },
        )}
      </div>
    </nav>
  );
}

function LearningBackToTopButton() {
  function handleBackToTop() {
    document
      .getElementById(
        "learning-command-center-top",
      )
      ?.scrollIntoView({
        behavior:
          getLearningScrollBehavior(),
        block: "start",
      });
  }

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={handleBackToTop}
      className={[
        "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-50",
        "inline-flex h-11 w-11 items-center justify-center rounded-2xl border sm:h-12 sm:w-auto sm:gap-2 sm:px-4",
        "border-cyan-300/72 ring-1 ring-inset ring-blue-400/38",
        "bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))]",
        "text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100",
        "shadow-[0_0_0_1px_rgba(34,211,238,0.16),0_0_28px_rgba(37,99,235,0.28),0_18px_48px_rgba(2,6,23,0.52)]",
        "backdrop-blur-2xl",
        "transition-[border-color,color,box-shadow,transform] duration-200",
        "hover:border-cyan-200/95 hover:text-white",
        "hover:shadow-[0_0_0_1px_rgba(34,211,238,0.22),0_0_34px_rgba(37,99,235,0.36),0_20px_54px_rgba(2,6,23,0.58)]",
        "active:translate-y-px",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/80",
      ].join(" ")}
    >
      <ArrowUp className="h-4 w-4" />

      <span className="hidden sm:inline">
        Back to top
      </span>
    </button>
  );
}

export function EducationalCommandCenter() {
  const dashboard =
    useEducationalDashboardState();

  const [
    selectedGenesisCategory,
    setSelectedGenesisCategory,
  ] = useState("all");

  const visibleGenesisArtifacts =
    useMemo(() => {
      if (
        selectedGenesisCategory === "all"
      ) {
        return dashboard.artifacts;
      }

      if (
        selectedGenesisCategory ===
        "constitutional"
      ) {
        return dashboard.artifacts.filter(
          (artifact) =>
            artifact.kind === "canon" ||
            artifact.kind ===
              "constitution" ||
            artifact.kind ===
              "amendment",
        );
      }

      if (
        selectedGenesisCategory ===
        "architecture"
      ) {
        return dashboard.artifacts.filter(
          (artifact) =>
            artifact.kind ===
              "architecture" ||
            artifact.kind ===
              "reconciliation" ||
            artifact.kind === "adr" ||
            artifact.kind === "edr" ||
            artifact.kind === "decision",
        );
      }

      if (
        selectedGenesisCategory ===
        "history"
      ) {
        return dashboard.artifacts.filter(
          (artifact) =>
            artifact.kind === "mission" ||
            artifact.kind ===
              "runtime-documentation",
        );
      }

      if (
        selectedGenesisCategory ===
        "conversation"
      ) {
        return dashboard.artifacts.filter(
          (artifact) =>
            artifact.kind ===
            "conversation",
        );
      }

      return dashboard.artifacts.filter(
        (artifact) =>
          artifact.kind !==
            "conversation" &&
          artifact.kind !== "mission",
      );
    }, [
      dashboard.artifacts,
      selectedGenesisCategory,
    ]);

  const reset = () => {
    dashboard.reset();
    setSelectedGenesisCategory("all");
  };

  return (
    <div
      id="learning-command-center-top"
    >
      <div className="space-y-6">
      
<section
  aria-label="Executive educational overview"
  className="
    grid items-stretch gap-6
    xl:grid-cols-[380px_minmax(0,1fr)]
  "
>
  <div className="min-w-0 [&>*]:h-full">
    <LuminaFlagshipPanel
      title="Executive Educational Dashboard"
      description="What has educated the Chief Agent, what is its current educational posture, and what remains before activation?"
      emphasis="strong"
      className="h-full"
      toolbar={
        <div className="flex w-full flex-col items-stretch gap-2 xl:w-auto">
          <LuminaStatusBadge status="warning">
            Local fixture model
          </LuminaStatusBadge>

          <label className="block">
            <span className="sr-only">
              Select modeled dashboard state
            </span>

            <select
              value={dashboard.uiState}
              onChange={(event) => {
                dashboard.setUiState(
                  event.target.value as typeof dashboard.uiState,
                );
              }}
              style={{
                WebkitAppearance: "none",
                appearance: "none",
                colorScheme: "dark",
                backgroundColor: "rgba(2, 6, 23, 0.88)",
                backgroundImage:
                  "linear-gradient(45deg, transparent 50%, rgba(125,211,252,0.9) 50%), linear-gradient(135deg, rgba(125,211,252,0.9) 50%, transparent 50%)",
                backgroundPosition:
                  "calc(100% - 15px) 50%, calc(100% - 10px) 50%",
                backgroundRepeat: "no-repeat",
                backgroundSize: "5px 5px, 5px 5px",
              }}
              className={cn(
                "h-9 w-full rounded-xl border px-3 pr-9 text-xs xl:min-w-[150px]",
                "border-cyan-300/30 text-sky-200/86",
                "shadow-[inset_0_1px_5px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(186,230,253,0.05)]",
                "outline-none transition-[border-color,box-shadow] duration-200",
                "hover:border-cyan-200/50",
                "focus-visible:border-cyan-200/70",
                "focus-visible:ring-2 focus-visible:ring-cyan-300/32",
                "motion-reduce:transition-none",
              )}
            >
              {[
                "success",
                "empty",
                "loading",
                "processing",
                "partial",
                "warning",
                "error",
                "offline",
              ].map((state) => (
                <option
                  key={state}
                  value={state}
                  className="bg-slate-950 text-sky-100"
                >
                  {state}
                </option>
              ))}
            </select>
          </label>

          <LuminaButton
            type="button"
            variant="toolbar"
            size="sm"
            onClick={reset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </LuminaButton>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 p-4">
        <div
          className="
            group rounded-[18px] border border-blue-400/56
            bg-slate-950/34 p-4
            ring-1 ring-inset ring-cyan-300/14
            shadow-[inset_0_1px_0_rgba(186,230,253,0.05),0_0_16px_rgba(37,99,235,0.08)]
          "
        >
          <div className="flex items-center gap-3 text-xs font-semibold text-amber-400">
            <ExecutivePremiumIcon
              icon={Layers3}
              state="active"
            />
            Educational Corpus
          </div>

          <p className="mt-2 text-xs leading-5 text-sky-500/76">
            Multi-curriculum model spanning constitutional,
            architectural, documentation, conversation,
            engineering, mission, governance, organizational,
            business, domain and security education.
          </p>
        </div>

        <div
          className="
            group rounded-[18px] border border-blue-400/56
            bg-slate-950/34 p-4
            ring-1 ring-inset ring-cyan-300/14
            shadow-[inset_0_1px_0_rgba(186,230,253,0.05),0_0_16px_rgba(37,99,235,0.08)]
          "
        >
          <div className="flex items-center gap-3 text-xs font-semibold text-amber-400">
            <ExecutivePremiumIcon
              icon={Eye}
              state="active"
            />
            Inspectable by design
          </div>

          <p className="mt-2 text-xs leading-5 text-sky-500/76">
            Every modeled artifact preserves authority, approval,
            provenance, ownership, scope, version, lineage and
            dependencies.
          </p>
        </div>

        <div
          className="
            group rounded-[18px] border border-blue-400/56
            bg-slate-950/34 p-4
            ring-1 ring-inset ring-cyan-300/14
            shadow-[inset_0_1px_0_rgba(186,230,253,0.05),0_0_16px_rgba(37,99,235,0.08)]
          "
        >
          <div className="text-xs font-semibold text-amber-400">
            No backend implication
          </div>

          <p className="mt-2 text-xs leading-5 text-sky-500/76">
            All values are representative UI fixtures. No registry,
            compiler, service, API, persistence or activation action
            is connected.
          </p>
        </div>
      </div>
    </LuminaFlagshipPanel>
  </div>

  <div
    className="
      min-w-0 overflow-hidden rounded-[32px]
      border border-cyan-300/58
      bg-[radial-gradient(circle_at_18%_0%,rgba(37,99,235,0.15),transparent_34%),radial-gradient(circle_at_72%_16%,rgba(147,51,234,0.14),transparent_34%),radial-gradient(circle_at_38%_84%,rgba(180,83,9,0.10),transparent_30%),linear-gradient(135deg,rgba(2,6,23,0.58),rgba(17,10,45,0.54),rgba(2,8,26,0.57))]
      ring-1 ring-inset ring-cyan-200/20
      shadow-[0_0_0_1px_rgba(59,130,246,0.16),0_0_34px_rgba(37,99,235,0.13),0_28px_90px_rgba(2,6,23,0.40),inset_0_1px_0_rgba(255,255,255,0.07)]
      backdrop-blur-[52px] backdrop-saturate-[182%]
    "
  >
    <div className="h-full p-6 xl:p-7">
      <ExecutiveEducationalSummary
        summary={dashboard.executiveSummary}
      />
    </div>
  </div>

  <div className="xl:col-span-2">
    <LearningSectionNavigator />
  </div>
</section>
      </div>

      <div
        id="learning-genesis-corpus"
        className="mt-6 scroll-mt-32"
      >
        <GenesisCorpusOverview
        artifacts={dashboard.artifacts}
        selectedCategory={
          selectedGenesisCategory
        }
        onCategoryChange={
          setSelectedGenesisCategory
        }
      />
      </div>

      <EducationalStateSurface
        state={dashboard.uiState}
        onRecover={reset}
      />

      {dashboard.uiState === "success" && (
        <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1.7fr)_minmax(380px,0.8fr)]">
          <div className="space-y-6">
            <div
              id="learning-genesis-sources"
              className="scroll-mt-32"
            >
              <LuminaFlagshipPanel
              title="Genesis Source Drill-down"
              description={`${visibleGenesisArtifacts.length} modeled sources in the selected corpus category`}
              emphasis="strong"
            >
              <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleGenesisArtifacts.map(
                  (artifact) => {
                    const selected =
                      dashboard.selection.artifactId ===
                      artifact.id;

                    return (
                      <button
                        key={artifact.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          dashboard.selection.setArtifactId(
                            artifact.id,
                          );
                        }}
                        className={cn(
                          "group relative overflow-hidden rounded-[22px] border p-5 text-left",
                          "transition-[transform,border-color,background-color,box-shadow] duration-200",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/42",
                          "focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                          "motion-reduce:transform-none motion-reduce:transition-none",
                          selected
                            ? [
                                "border-cyan-200/62",
                                "bg-[linear-gradient(135deg,rgba(8,27,62,0.80),rgba(31,17,67,0.68),rgba(6,24,55,0.76))]",
                                "shadow-[inset_0_1px_0_rgba(186,230,253,0.10),0_0_26px_rgba(34,211,238,0.12),0_16px_36px_rgba(2,6,23,0.24)]",
                              ].join(" ")
                            : [
                                "border-cyan-300/60 ring-1 ring-inset ring-blue-400/36",
                                "bg-[linear-gradient(135deg,rgba(3,12,35,0.64),rgba(15,12,42,0.54),rgba(3,14,37,0.62))]",
                                "shadow-[inset_0_1px_0_rgba(186,230,253,0.07),0_0_18px_rgba(37,99,235,0.10),0_12px_28px_rgba(2,6,23,0.17)]",
                                "hover:-translate-y-0.5 hover:border-cyan-200/78 hover:ring-blue-300/52",
                                "hover:bg-[linear-gradient(135deg,rgba(5,18,49,0.76),rgba(24,16,58,0.64),rgba(5,20,48,0.72))]",
                                "hover:shadow-[inset_0_1px_0_rgba(186,230,253,0.08),0_16px_34px_rgba(2,6,23,0.24)]",
                              ].join(" "),
                        )}
                      >
                        <div
                          aria-hidden="true"
                          className={cn(
                            "pointer-events-none absolute inset-x-5 top-0 h-px",
                            selected
                              ? "bg-gradient-to-r from-transparent via-cyan-200/66 to-transparent"
                              : flagshipAppearance.cardHighlight,
                          )}
                        />

                        <div
                          className="
                            relative text-[10px] font-semibold uppercase
                            tracking-[0.14em] text-violet-300/76
                          "
                        >
                          {artifact.category}
                        </div>

                        <h3
                          className={cn(
                            "relative mt-2 text-sm font-semibold",
                            selected
                              ? "text-amber-400"
                              : "text-sky-200",
                          )}
                        >
                          {artifact.title}
                        </h3>

                        <p className="relative mt-2 line-clamp-3 text-xs leading-5 text-sky-500/76">
                          {artifact.educationalImpact}
                        </p>

                        <div
                          className="
                            relative mt-4 flex items-center
                            justify-between gap-4
                            border-t border-cyan-300/12 pt-3
                            text-[11px]
                          "
                        >
                          <span className="font-semibold text-amber-400/86">
                            {artifact.authorityClass}
                          </span>

                          <span className="text-sky-400/72">
                            {artifact.version}
                          </span>
                        </div>
                      </button>
                    );
                  },
                )}

                {visibleGenesisArtifacts.length === 0 ? (
                  <div
                    className="
                      rounded-[18px] border border-dashed border-blue-400/56
                      bg-slate-950/34 px-5 py-8 text-center
                      ring-1 ring-inset ring-cyan-300/14
                      shadow-[inset_0_1px_0_rgba(186,230,253,0.05),0_0_16px_rgba(37,99,235,0.08)]
                      md:col-span-2 xl:col-span-3
                    "
                  >
                    <div className="text-sm font-semibold text-amber-500">
                      No Genesis sources in this category
                    </div>

                    <p className="mt-2 text-xs leading-5 text-sky-500/72">
                      Select another Genesis corpus category to restore the modeled source set.
                    </p>
                  </div>
                ) : null}
              </div>
              </LuminaFlagshipPanel>
            </div>

            <EducationalDashboardMain
              dashboard={dashboard}
            />
          </div>
        </div>
      )}

      <LearningBackToTopButton />
    </div>
  );
}
