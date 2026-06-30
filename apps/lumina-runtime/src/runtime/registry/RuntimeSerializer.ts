import type {
  PublicRuntimeRecord,
  RuntimeRecord,
} from "../registry.js";

export const MAX_LOG_LINES = 300;

const MAX_LOG_LINE_LENGTH = 4000;

const ANSI_REGEX =
  // biome-ignore lint/suspicious/noControlCharacters:
  /\u001B\[[0-9;]*[A-Za-z]/g;

const CONTROL_CHAR_REGEX =
  // biome-ignore lint/suspicious/noControlCharacters:
  /[\u0000-\u0008\u000B-\u001F\u007F]/g;

const SECRET_PATTERNS: RegExp[] = [
  /sk-[a-zA-Z0-9]{16,}/g,
  /AIza[0-9A-Za-z\-_]{20,}/g,
  /ghp_[a-zA-Z0-9]{20,}/g,
  /github_pat_[a-zA-Z0-9_]{20,}/g,
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+/g,
];

export function sanitizeRuntimeLogLine(
  value: string,
): string {
  let sanitized = value;

  sanitized =
    sanitized.replace(
      ANSI_REGEX,
      "",
    );

  sanitized =
    sanitized.replace(
      CONTROL_CHAR_REGEX,
      "",
    );

  for (const pattern of SECRET_PATTERNS) {
    sanitized =
      sanitized.replace(
        pattern,
        "[REDACTED]",
      );
  }

  sanitized =
    sanitized.trim();

  if (
    sanitized.length >
    MAX_LOG_LINE_LENGTH
  ) {
    sanitized =
      `${sanitized.slice(
        0,
        MAX_LOG_LINE_LENGTH,
      )}...[truncated]`;
  }

  return sanitized;
}

export function serializeRuntime(
  runtime: RuntimeRecord,
): PublicRuntimeRecord {
  return {
    projectId:
      runtime.projectId,
    framework:
      runtime.framework,
    port:
      runtime.port,
    pid:
      runtime.pid,
    startedAt:
      runtime.startedAt,
    exitedAt:
      runtime.exitedAt,
    lastError:
      runtime.lastError,
    url:
      runtime.url,
    logs:
      Array.isArray(
        runtime.logs,
      )
        ? runtime.logs.slice(
            -MAX_LOG_LINES,
          )
        : [],
    status:
      runtime.status,
  };
}
