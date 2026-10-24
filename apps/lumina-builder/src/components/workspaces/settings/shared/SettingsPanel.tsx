import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { ExecutivePremiumIcon } from "@/components/design-system/executive/ExecutivePremiumIcon";

import { panelReflection, panelSurface } from "../../developer/shared/surfaces";

/* MS-2026-0011: one Settings section, in the Knowledge Operations materials. */
export function SettingsPanel({
  icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className={panelSurface}>
      <div aria-hidden="true" className={panelReflection} />
      <div className="grid gap-5 p-6">
        <header className="flex items-start gap-4">
          <ExecutivePremiumIcon icon={icon} state="active" />
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/80">{eyebrow}</div>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em] text-amber-400">{title}</h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-sky-300/70">{description}</p>
          </div>
        </header>
        {children}
      </div>
    </section>
  );
}
