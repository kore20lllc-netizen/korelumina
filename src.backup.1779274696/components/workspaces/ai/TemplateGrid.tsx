import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { luminaTile } from "@/lib/luminaPalette";
import { templates } from "./data";

export function TemplateGrid() {
  return (
    <div className="mt-8">
      <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 mb-3">
        Or start from a template
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {templates.map((t, i) => {
          const Icon = t.icon;
          return (
            <button
              key={t.label}
              className="group relative text-left p-3.5 rounded-xl glass transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-1 overflow-hidden"
            >
              <div className={cn("relative h-8 w-8 rounded-lg grid place-items-center mb-3", luminaTile(i))}>
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              </div>
              <div className="font-medium text-[13px]">{t.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</div>
              <ArrowUpRight className="absolute top-3 right-3 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
            </button>
          );
        })}
      </div>
    </div>
  );
}