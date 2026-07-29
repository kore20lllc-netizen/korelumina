import {
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export interface RuntimeCommandCenterHeaderProps {
  eventCount: number;
  logCount: number;
}

export function RuntimeCommandCenterHeader({
  eventCount,
  logCount,
}: RuntimeCommandCenterHeaderProps) {
  return (
    <header
      className={[
        "flex flex-col gap-3 border-b px-5 py-4",
        "sm:flex-row sm:items-center sm:justify-between",
        "[border-color:var(--lumina-border-standard)]",
        "[background:var(--lumina-surface-compact)]",
      ].join(" ")}
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">
          Operations Command Center
        </h3>

        <p className="text-xs text-muted-foreground">
          Live runtime activity, lifecycle events and diagnostic logs.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <TabsList
          className={[
            "rounded-2xl border p-1",
            "[border-color:var(--lumina-border-standard)]",
            "[background:var(--lumina-surface-interactive)]",
          ].join(" ")}
        >
          <TabsTrigger value="events">
            Events
          </TabsTrigger>

          <TabsTrigger value="timeline">
            Lifecycle
          </TabsTrigger>

          <TabsTrigger value="logs">
            Logs
          </TabsTrigger>
        </TabsList>

        <div className="text-[10.5px] tabular-nums text-muted-foreground">
          {eventCount} events · {logCount} logs
        </div>
      </div>
    </header>
  );
}

export default RuntimeCommandCenterHeader;
