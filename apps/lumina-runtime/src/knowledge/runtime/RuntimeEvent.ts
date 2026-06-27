export type RuntimeEventType =
  | "project_registered"
  | "runtime_starting"
  | "runtime_started"
  | "runtime_ready"
  | "runtime_stopping"
  | "runtime_stopped"
  | "runtime_crashed"
  | "runtime_restarted"
  | "runtime_recovered"
  | "preview_started"
  | "preview_reloaded"
  | "preview_failed";

export interface RuntimeEvent {
  id: string;

  projectId: string;

  type: RuntimeEventType;

  timestamp: number;

  metadata: Record<
    string,
    unknown
  >;
}
