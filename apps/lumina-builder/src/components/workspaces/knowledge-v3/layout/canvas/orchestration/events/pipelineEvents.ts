export type PipelineEventType =
  | "package.created"
  | "package.reduced"
  | "package.compiled"
  | "package.validated"
  | "package.canonicalized"
  | "package.split"
  | "package.merged"
  | "package.rejected";

export interface PipelineEvent {
  id: string;
  packageId: string;
  type: PipelineEventType;
  timestamp: string;
}

export function createPipelineEvent(
  event: PipelineEvent,
): PipelineEvent {
  return event;
}
