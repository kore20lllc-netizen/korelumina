import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowUp,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

export interface LuminaSectionNavigatorItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface LuminaSectionNavigatorProps {
  items: readonly LuminaSectionNavigatorItem[];
  ariaLabel: string;
  topTargetId: string;
  minWidthClassName: string;
  gridColumnsClassName: string;
}

function getScrollBehavior(): ScrollBehavior {
  return window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches
    ? "auto"
    : "smooth";
}

export function LuminaSectionNavigator({
  items,
  ariaLabel,
  topTargetId,
  minWidthClassName,
  gridColumnsClassName,
}: LuminaSectionNavigatorProps) {
  const navigatorRef =
    useRef<HTMLElement | null>(null);

  const navigatorContentRef =
    useRef<HTMLDivElement | null>(null);

  const scrollFrameRef =
    useRef<number | null>(null);

  const programmaticTargetRef =
    useRef<string | null>(null);

  const [
    showLeftFade,
    setShowLeftFade,
  ] = useState(false);

  const [
    showRightFade,
    setShowRightFade,
  ] = useState(false);

  const [
    activeSectionId,
    setActiveSectionId,
  ] = useState<string>(
    items[0]?.id ?? "",
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
    const sections = items
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
  }, [items]);

  function handleNavigate(
    sectionId: string,
  ) {
    const behavior =
      getScrollBehavior();

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

  function handleBackToTop() {
    document
      .getElementById(topTargetId)
      ?.scrollIntoView({
        behavior:
          getScrollBehavior(),
        block: "start",
      });
  }

  return (
    <>
      <nav
        ref={navigatorRef}
        aria-label={ariaLabel}
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
          className={[
            "grid items-center gap-2 xl:min-w-0",
            minWidthClassName,
            gridColumnsClassName,
          ].join(" ")}
        >
          {items.map((section) => {
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
          })}
        </div>
      </nav>

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
    </>
  );
}
