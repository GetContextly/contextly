const ERROR_MESSAGES: Record<string, string> = {
  INVALID_TOKEN: "Authentication failed: token is invalid. Tokens must start with 'ctx_' and contain a scope.",
  SCOPE_MISMATCH: "Scope not authorized: your token cannot access the requested scope. Check that the scope matches the one embedded in your token.",
  INSUFFICIENT_PERMISSIONS: "Permission denied: your token does not have the required permission. Generate a new token with the appropriate permissions.",
  RATE_LIMITED: "Rate limit exceeded: too many requests. Wait before retrying.",
  VALIDATION_ERROR: "Input validation failed: one or more fields are invalid. Check your input values.",
  DUPLICATE_ENTRY: "Duplicate entry: this exact entry already exists. The entry is idempotent — retrying with the same values is safe.",
  CONFLICT_DETECTED: "Conflict detected: another agent already made a different decision for this cid. Review the conflict and resolve it before proceeding.",
  SUPERSEDES_TARGET_NOT_FOUND: "Supersedes target not found: the entry you're trying to supersede does not exist. Check the entry ID.",
  SUPERSEDES_TARGET_ALREADY_SUPERSEDED: "Target already superseded: the entry you're trying to supersede has already been replaced. Refresh the context and try again.",
  CYCLE_DETECTED: "Supersession cycle detected: this action would create a cycle. Review the supersession chain.",
  SELF_SUPERSEDE: "Cannot self-supersede: an entry cannot supersede itself.",
  SCOPE_NOT_FOUND: "Scope not found: the requested scope does not exist. Create it first by committing an entry to it.",
  MERGE_CONFLICT: "Merge conflict: the two scopes have conflicting entries. Resolve them before merging.",
  INTERNAL_ERROR: "Internal error: something went wrong in the server. Check the server logs.",
};

export function translateError(error: { code: string; message?: string }): Error {
  const humanMessage = ERROR_MESSAGES[error.code] ?? `Unexpected error: ${error.message ?? error.code}`;
  const err = new Error(humanMessage);
  (err as any).code = error.code;
  return err;
}