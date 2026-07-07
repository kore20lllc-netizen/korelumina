import { Boxes, Inbox, ListChecks, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "projects" | "events" | "logs" | "search";

const CONFIG: Record<Variant, { icon: any; title: string; hint: string }> = {
  projects: { icon: Boxes,      title: "No services yet",        hint: "Deploy a project to see it appear in the runtime." },
  events:   { icon: Inbox,      title: "No events yet",          hint: "Deployments, restarts and alerts will stream in here." },
  logs:     { icon: ListChecks, title: "No log lines match",     hint: "Adjust the log level filter to see more output." },
  search:   { icon: SearchX,    title: "No matches",             hint: "Try a different search term or reset your filters." },
};

export function RuntimeEmptyState({ variant, className }: { variant: Variant; className?: string }) {
  const c = CONFIG[variant];
  const Icon = c.icon;
  return (
    <div className={cn("h-full min-h-[160px] grid place-items-center p-8", className)}>
      <div className="text-center max-w-xs">
        <div className="h-10 w-10 mx-auto rounded-xl bg-surface-2 border border-white/10 grid place-items-center text-muted-foreground">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="mt-3 text-[13px] font-medium">{c.title}</div>
        <div className="text-[11.5px] text-muted-foreground mt-1">{c.hint}</div>
      </div>
    </div>
  );
}