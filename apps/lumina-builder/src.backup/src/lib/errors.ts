/**
 * Centralized error type. All service-layer code should throw AppError so
 * UI can render userMessage in a toast, optionally exposing technical details.
 */

export type ErrorCode =
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_EMAIL_TAKEN"
  | "AUTH_NOT_AUTHENTICATED"
  | "AUTH_WEAK_PASSWORD"
  | "ENTITLEMENT_DENIED"
  | "BILLING_FAILED"
  | "NOT_FOUND"
  | "VALIDATION"
  | "NETWORK"
  | "IMPORT_FAILED"
  | "AI_FAILED"
  | "DEPLOY_FAILED"
  | "INTERNAL";

export class AppError extends Error {
  code: ErrorCode;
  userMessage: string;
  technical?: string;
  recovery?: string;
  constructor(code: ErrorCode, userMessage: string, opts?: { technical?: string; recovery?: string; cause?: unknown }) {
    super(userMessage);
    if (opts?.cause !== undefined) (this as { cause?: unknown }).cause = opts.cause;
    this.name = "AppError";
    this.code = code;
    this.userMessage = userMessage;
    this.technical = opts?.technical;
    this.recovery = opts?.recovery;
  }
}

export function normalizeError(e: unknown): AppError {
  if (e instanceof AppError) return e;
  if (e instanceof Error) return new AppError("INTERNAL", e.message || "Something went wrong.", { technical: e.stack });
  return new AppError("INTERNAL", "Something went wrong.", { technical: String(e) });
}

export class NotImplementedError extends AppError {
  constructor(name: string) {
    super("INTERNAL", `${name} is not implemented yet.`, { technical: `${name} requires a real provider implementation.` });
    this.name = "NotImplementedError";
  }
}