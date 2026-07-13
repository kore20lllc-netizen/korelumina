import type {
  ReactNode,
} from "react";

import {
  WorkspaceAppearanceHeader,
} from "./WorkspaceAppearanceHeader";


import {
  GlassCard,
  LayoutCard,
  ThemeCard,
} from "./cards";

import {
  SliderSection,
  PreviewSection,
} from "./sections";

export interface WorkspaceAppearanceDrawerProps {
  open: boolean;
  onClose(): void;
  children?: ReactNode;
}

export function WorkspaceAppearanceDrawer({
  open,
  onClose,
  children,
}: WorkspaceAppearanceDrawerProps) {
  return (
    <aside
      aria-hidden={!open}
      aria-label="Workspace Appearance"
      className={`
        relative
        z-30
        h-full
        min-h-0
        shrink-0
        overflow-hidden
        border-l
        bg-[rgba(7,9,16,.9)]
        backdrop-blur-[34px]
        transition-[width,opacity,transform,border-color]
        duration-300
        ease-out
        ${
          open
            ? "w-[min(720px,48vw)] translate-x-0 border-white/20 opacity-100"
            : "pointer-events-none w-0 translate-x-8 border-transparent opacity-0"
        }
      `}
      style={{
        boxShadow: open
          ? [
              "-24px 0 80px rgba(0,0,0,.48)",
              "-10px 0 52px rgba(124,92,255,.14)",
              "inset 1px 0 0 rgba(255,255,255,.06)",
            ].join(",")
          : "none",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.07),transparent_20%)]"
      />

      <div className="relative z-10 flex h-full min-w-[620px] flex-col">
        <WorkspaceAppearanceHeader
          onClose={onClose}
        />

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-visible p-6">
          {children ?? (
            <div className="space-y-6">

              <div className="grid grid-cols-3 gap-6">
                <GlassCard />
                <LayoutCard />
                <ThemeCard />
              </div>

              <SliderSection />

              <PreviewSection />

            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
