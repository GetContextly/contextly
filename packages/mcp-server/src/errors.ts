/**
 * Structured error responses an agent can reason about programmatically.
 *
 * Every error has:
 *   - code: machine-readable string (never changes between releases)
 *   - message: human-readable description
 *   - details?: additional context (field errors, conflicting entry, etc.)
 */

export interface ContextlyError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export type ErrorCode =
  | "INVALID_TOKEN"
  | "SCOPE_MISMATCH"
  | "INSUFFICIENT_PERMISSIONS"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "DUPLICATE_ENTRY"
  | "CONFLICT_DETECTED"
  | "SUPERSEDES_TARGET_NOT_FOUND"
  | "SUPERSEDES_TARGET_ALREADY_SUPERSEDED"
  | "CYCLE_DETECTED"
  | "SELF_SUPERSEDE"
  | "SCOPE_NOT_FOUND"
  | "MERGE_CONFLICT"
  | "INTERNAL_ERROR";

export function contextlyErrorToMcpError(error: ContextlyError): {
  code: number;
  message: string;
  data?: Record<string, unknown>;
} {
  return {
    code: errorCodeToHttp(error.code),
    message: error.message,
    data: { code: error.code, ...error.details },
  };
}

function errorCodeToHttp(code: ErrorCode): number {
  switch (code) {
    case "INVALID_TOKEN":
    case "SCOPE_MISMATCH":
    case "INSUFFICIENT_PERMISSIONS":
      return 401;
    case "RATE_LIMITED":
      return 429;
    case "VALIDATION_ERROR":
      return 400;
    case "DUPLICATE_ENTRY":
      return 409;
    case "CONFLICT_DETECTED":
      return 409;
    case "SUPERSEDES_TARGET_NOT_FOUND":
      return 404;
    case "SUPERSEDES_TARGET_ALREADY_SUPERSEDED":
      return 409;
    case "CYCLE_DETECTED":
      return 409;
    case "SELF_SUPERSEDE":
      return 400;
    case "SCOPE_NOT_FOUND":
      return 404;
    case "MERGE_CONFLICT":
      return 409;
    case "INTERNAL_ERROR":
      return 500;
  }
}

export function validationError(details: Record<string, unknown>): ContextlyError {
  return { code: "VALIDATION_ERROR", message: "Input validation failed", details };
}

export function conflictError(existingEntry: unknown, incomingEntry: unknown): ContextlyError {
  return {
    code: "CONFLICT_DETECTED",
    message: "A conflicting entry already exists for this cid",
    details: { existingEntry, incomingEntry },
  };
}