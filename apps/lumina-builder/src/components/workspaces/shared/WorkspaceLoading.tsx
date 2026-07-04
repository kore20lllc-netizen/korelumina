import { WorkspaceCard } from "./WorkspaceCard";

interface WorkspaceLoadingProps {
  title?: string;
  cards?: number;
}

export function WorkspaceLoading({
  title = "Loading workspace…",
  cards = 6,
}: WorkspaceLoadingProps) {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-10 w-72 rounded-xl bg-white/10" />
        <div className="h-4 w-[32rem] max-w-full rounded bg-white/5" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({
          length: cards,
        }).map((_, index) => (
          <WorkspaceCard
            key={index}
            className="p-6"
          >
            <div className="space-y-4">
              <div className="h-4 w-28 rounded bg-white/10" />

              <div className="h-10 w-20 rounded bg-white/10" />

              <div className="h-3 w-full rounded bg-white/5" />

              <div className="h-3 w-2/3 rounded bg-white/5" />
            </div>
          </WorkspaceCard>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {title}
      </p>
    </div>
  );
}

export default WorkspaceLoading;
