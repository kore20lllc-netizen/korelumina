import {
  Archive,
  MessagesSquare,
} from "lucide-react";

import {
  LuminaWorkspacePanel,
} from "@/components/lumina/workspace";

export function ConversationsWorkspace() {
  return (
    <LuminaWorkspacePanel
      title="Conversation Ingestion"
      subtitle="Preserve historical engineering decisions, failures, recoveries, approvals, and lessons"
      className="min-h-[680px] p-0"
    >
      <div className="grid min-h-[600px] gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section
          className={[
            "relative flex min-h-[460px] items-center justify-center overflow-hidden rounded-[28px] border p-8",
            "[border-color:var(--lumina-border-standard)]",
            "[background:var(--lumina-surface-panel)]",
          ].join(" ")}
        >
          <div
            aria-hidden="true"
            className={[
              "absolute inset-0 opacity-60",
              "[background-image:linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)]",
              "[background-size:32px_32px]",
            ].join(" ")}
          />

          <div className="relative max-w-md text-center">
            <div
              className={[
                "mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border",
                "[border-color:var(--lumina-border-emphasis)]",
                "[background:var(--lumina-surface-selected)]",
                "[box-shadow:var(--lumina-shadow-selected)]",
              ].join(" ")}
            >
              <MessagesSquare
                className="h-7 w-7 text-cyan"
                strokeWidth={1.6}
              />
            </div>

            <h3 className="mt-6 text-xl font-semibold tracking-tight">
              No authoritative conversation archive is connected
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Conversation records will appear after a governed archive source is registered and the ingestion service reports its state.
            </p>
          </div>
        </section>

        <aside
          className={[
            "rounded-[28px] border p-5",
            "[border-color:var(--lumina-border-standard)]",
            "[background:var(--lumina-surface-compact)]",
          ].join(" ")}
        >
          <div className="flex items-center gap-3">
            <Archive
              className="h-4 w-4 text-violet-200"
              strokeWidth={1.75}
            />

            <div>
              <div className="text-xs font-semibold">
                Provenance contract
              </div>

              <div className="mt-1 text-[11px] leading-5 text-muted-foreground">
                Every extracted item must remain traceable to archive, conversation, message, author, and timestamp.
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {[
              "Archive registration",
              "Conversation normalization",
              "Decision extraction",
              "Failure and recovery extraction",
              "Knowledge IR validation",
              "Canonical review submission",
            ].map((stage) => (
              <div
                key={stage}
                className={[
                  "rounded-xl border px-3 py-2.5 text-[11px] text-muted-foreground",
                  "[border-color:var(--lumina-border-standard)]",
                  "[background:var(--lumina-surface-interactive)]",
                ].join(" ")}
              >
                {stage}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </LuminaWorkspacePanel>
  );
}

export default ConversationsWorkspace;
