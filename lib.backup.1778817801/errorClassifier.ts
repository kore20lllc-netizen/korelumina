export type ErrorSeverity =
  | "info"
  | "warning"
  | "error"
  | "critical";

export type ErrorCategory =
  | "build"
  | "runtime"
  | "network"
  | "validation"
  | "unknown";

export interface ClassifiedError {
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;

  title?: string;
  file?: string;
  line?: number;
  column?: number;
  suggestion?: string;
  details?: string;
  raw?: unknown;

  // UI compatibility fields
  nextSteps?: string[];
  canRetry?: boolean;
  referenceId?: string;
  timestamp?: string;
  technicalDetails?: string;
}

export function classifyError(
  input: unknown,
): ClassifiedError {
  const now = new Date().toISOString();

  const base: ClassifiedError = {
    message: "Unknown error",
    category: "unknown",
    severity: "error",
    nextSteps: [
      "Inspect logs for more details.",
      "Check recent code changes.",
      "Retry after correcting the issue.",
    ],
    canRetry: true,
    referenceId: `ERR-${Date.now()}`,
    timestamp: now,
    technicalDetails:
      typeof input === "string"
        ? input
        : input instanceof Error
          ? input.stack || input.message
          : JSON.stringify(input, null, 2),
    raw: input,
  };

  if (input instanceof Error) {
    return {
      ...base,
      title: input.name,
      message: input.message,
      details: input.stack,
      technicalDetails:
        input.stack || input.message,
      raw: input,
    };
  }

  if (typeof input === "string") {
    return {
      ...base,
      message: input,
      details: input,
      technicalDetails: input,
      raw: input,
    };
  }

  return base;
}
