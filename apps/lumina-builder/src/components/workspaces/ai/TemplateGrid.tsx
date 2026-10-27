import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { LuminaFlagshipCard } from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";
import { ExecutivePremiumIcon } from "@/components/design-system/executive/ExecutivePremiumIcon";
import { panelEyebrow } from "../developer/shared/surfaces";
import { templates } from "./data";

export function TemplateGrid() {
  return (
    <div className="min-w-0">
      <div className={cn(panelEyebrow, "mb-4")}>
        Or start from a template
      </div>
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 2xl:grid-cols-4 gap-3">
        {templates.map((t) => {
          const Icon = t.icon;
          return (
            <LuminaFlagshipCard
              key={t.label}
              interactive
              className="group min-w-0 text-left p-4"
            >
              <div className="relative mb-3"><ExecutivePremiumIcon icon={Icon} state="active" /></div>
              <div className="relative text-sm font-semibold text-sky-50">{t.label}</div>
              <div className="relative mt-1 text-xs leading-5 text-sky-300/60">{t.desc}</div>
              <ArrowUpRight className="absolute top-3 right-3 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
            </LuminaFlagshipCard>
          );
        })}
      </div>
    </div>
  );
}