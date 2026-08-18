import type {
  ReactNode,
} from "react";

import {
  ArrowLeft,
} from "lucide-react";

import { cn } from "@/lib/utils";

import {
  Button,
} from "@/components/ui/button";

import {
  Badge,
} from "@/components/ui/badge";

export interface GlassWorkspaceHeroProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  badge?: ReactNode;
  onBack?: () => void;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function GlassWorkspaceHero({
  title,
  subtitle,
  eyebrow,
  badge,
  onBack,
  actions,
  children,
  className,
}: GlassWorkspaceHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl",
        "border border-white/10",
        "bg-white/[0.04] backdrop-blur-2xl",
        "shadow-[0_20px_80px_rgba(0,0,0,0.30)]",
        className,
      )}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />

        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "linear-gradient(135deg,rgba(255,255,255,.06),rgba(255,255,255,0) 45%,rgba(255,255,255,.03))",
          }}
        />
      </div>

      <div className="relative z-10 p-8 lg:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-5">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="mt-1 h-11 w-11 rounded-2xl border border-white/10 bg-white/5 backdrop-blur hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}

            <div className="space-y-3">
              {eyebrow && (
                <p className="text-xs font-semibold uppercase tracking-[0.30em] text-violet-300">
                  {eyebrow}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white">
                  {title}
                </h1>

                {badge && (
                  <Badge className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-violet-200">
                    {badge}
                  </Badge>
                )}
              </div>

              {subtitle && (
                <p className="max-w-3xl text-base leading-7 text-slate-300">
                  {subtitle}
                </p>
              )}

              {children && (
                <div className="pt-2">
                  {children}
                </div>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex flex-wrap items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
