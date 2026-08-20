import { createHash, randomBytes } from "node:crypto";

/**
 * Token format: ctx_{scope}_{base62random}
 *
 * Example: ctx_project.myapp_K4xq7T2mN9pV1cF8jL3wR5bY6aH0gDe
 *
 * The token embeds the scope so the server can authorize requests
 * without a database lookup. The random suffix prevents forgery —
 * the server validates against a known token list or env var.
 */

export type Permission = "read" | "write" | "resolve" | "fork" | "merge";

export interface TokenPayload {
  scope: string;
  author: string;
  permissions: Permission[];
}

const TOKEN_PREFIX = "ctx_";

export function generateToken(scope: string, author: string): string {
  const random = randomBytes(16).toString("base64url").replace(/-/g, "Z").replace(/_/g, "Y");
  return `${TOKEN_PREFIX}${scope}_${random}`;
}

export function parseToken(token: string): TokenPayload {
  if (!token.startsWith(TOKEN_PREFIX)) {
    throw new AuthError("INVALID_TOKEN", "Token must start with ctx_");
  }

  const withoutPrefix = token.slice(TOKEN_PREFIX.length);
  const underscoreIdx = withoutPrefix.lastIndexOf("_");
  if (underscoreIdx === -1) {
    throw new AuthError("INVALID_TOKEN", "Token must contain scope and random portion");
  }

  const scope = withoutPrefix.slice(0, underscoreIdx);
  if (!scope) {
    throw new AuthError("INVALID_TOKEN", "Token scope cannot be empty");
  }

  return {
    scope,
    author: `agent:${scope.split(".").pop() ?? "unknown"}`,
    permissions: ["read", "write", "resolve", "fork", "merge"],
  };
}

export function validateScope(
  tokenScope: string,
  requestScope: string,
  permission: Permission,
  tokenPermissions: Permission[],
): void {
  if (!tokenPermissions.includes(permission)) {
    throw new AuthError(
      "INSUFFICIENT_PERMISSIONS",
      `Token lacks "${permission}" permission`,
    );
  }

  // Allow access to the token's scope and any child scope
  if (!requestScope.startsWith(tokenScope)) {
    throw new AuthError(
      "SCOPE_MISMATCH",
      `Token scoped to "${tokenScope}" cannot access "${requestScope}"`,
    );
  }

  // Check exact match or child scope
  if (requestScope !== tokenScope && !requestScope.startsWith(`${tokenScope}.`)) {
    throw new AuthError(
      "SCOPE_MISMATCH",
      `Token scoped to "${tokenScope}" cannot access "${requestScope}"`,
    );
  }
}

export function verifyTokenIntegrity(token: string, validTokens: Set<string>): TokenPayload {
  if (!validTokens.has(token)) {
    throw new AuthError("INVALID_TOKEN", "Token not recognized by this server");
  }
  return parseToken(token);
}

export class AuthError extends Error {
  constructor(
    public code: "INVALID_TOKEN" | "SCOPE_MISMATCH" | "INSUFFICIENT_PERMISSIONS",
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}