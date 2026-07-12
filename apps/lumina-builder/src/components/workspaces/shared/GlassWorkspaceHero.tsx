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

import {
  LuminaSurface,
} from "@/components/lumina/surface/LuminaSurface";

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
    <LuminaSurface
      variant="hero"
      className={cn(
        "relative overflow-hidden",
        className,
      )}
    >
      <div className="relative z-10 p-8 lg:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-5">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="
                  mt-1
                  h-11
                  w-11
                  [border-radius:var(--lumina-radius-inner)]
                  border
                  [border-color:var(--lumina-border-standard)]
                  [background:var(--lumina-surface-interactive)]
                  hover:[background:var(--lumina-surface-selected)]
                "
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}

            <div className="space-y-3">
              {eyebrow && (
                <p className="text-xs font-semibold uppercase tracking-[0.30em] text-muted-foreground">
                  {eyebrow}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-semibold tracking-tight">
                  {title}
                </h1>

                {badge && (
                  <Badge
                    className={cn(
                      "[border-radius:9999px]",
                      "px-3 py-1",
                      "border",
                      "[border-color:var(--lumina-border-emphasis)]",
                      "[background:var(--lumina-surface-selected)]",
                      "text-foreground",
                    )}
                  >
                    {badge}
                  </Badge>
                )}
              </div>

              {subtitle && (
                <p className="max-w-3xl text-base leading-7 text-muted-foreground">
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
    </LuminaSurface>
  );
}

export default GlassWorkspaceHero;
