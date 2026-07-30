import {
  CheckCircle2,
  Database,
  GitBranch,
  MessageSquareText,
  Sparkles,
} from "lucide-react";

export function KnowledgeActivityFeed() {
  const events = [
    {
      label: "Repository imported",
      meta: "Git evidence source registered",
      icon: GitBranch,
    },
    {
      label: "Documentation compiled",
      meta: "Architecture documents preserved",
      icon: Database,
    },
    {
      label: "Conversation preservation queued",
      meta: "Important engineering sessions identified",
      icon: MessageSquareText,
    },
    {
      label: "Knowledge promoted",
      meta: "Candidate IR moved toward canonical memory",
      icon: CheckCircle2,
    },
    {
      label: "Chief Agent synchronized",
      meta: "Validated knowledge available for reasoning",
      icon: Sparkles,
    },
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Recent Activity
      </div>

      <div className="mt-4 space-y-2">
        {events.map((event) => {
          const Icon = event.icon;

          return (
            <div
              key={event.label}
              className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="min-w-0">
                <div className="text-[13px] font-semibold tracking-tight">
                  {event.label}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {event.meta}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
