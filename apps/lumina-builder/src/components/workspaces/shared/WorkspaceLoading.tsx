import { WorkspaceCard } from "./WorkspaceCard";

export function WorkspaceLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-4">
        <div
          className="
            h-10
            w-72
            [border-radius:var(--lumina-radius-inner)]
            [background:var(--lumina-surface-interactive)]
          "
        />

        <div
          className="
            h-4
            w-[32rem]
            max-w-full
            [border-radius:var(--lumina-radius-xs)]
            [background:var(--lumina-surface-panel)]
          "
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <WorkspaceCard
            key={index}
            className="space-y-4 p-5"
          >
            <div
              className="
                h-4
                w-28
                [border-radius:var(--lumina-radius-xs)]
                [background:var(--lumina-surface-interactive)]
              "
            />

            <div
              className="
                h-10
                w-20
                [border-radius:var(--lumina-radius-xs)]
                [background:var(--lumina-surface-interactive)]
              "
            />

            <div
              className="
                h-3
                w-full
                [border-radius:var(--lumina-radius-xs)]
                [background:var(--lumina-surface-panel)]
              "
            />

            <div
              className="
                h-3
                w-2/3
                [border-radius:var(--lumina-radius-xs)]
                [background:var(--lumina-surface-panel)]
              "
            />
          </WorkspaceCard>
        ))}
      </div>
    </div>
  );
}

export default WorkspaceLoading;
