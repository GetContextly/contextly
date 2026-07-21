export const getRelativeTime = (date: string | Date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInMs = now.getTime() - past.getTime();

  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  if (diffInMins < 60) return `${diffInMins}m ago`;

  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

/**
 * Parses a relative time shorthand (e.g. "1h", "7d", "30m") into an ISO 8601 timestamp.
 * Also accepts a full ISO date string — returned as-is.
 * Used by MCP `recent_changes` tool per API_CONTRACTS.md.
 */
export const parseSince = (since: string): string => {
  const fullIso = /^\d{4}-\d{2}-\d{2}T/;
  if (fullIso.test(since)) return since;

  const match = since.match(/^(\d+)([mhd])$/);
  if (!match) throw new Error(`Invalid "since" format: "${since}". Use ISO 8601 or shorthand like "1h", "7d", "30m".`);

  const amount = parseInt(match[1], 10);
  const unit = match[2];
  const now = new Date();

  switch (unit) {
    case 'm': now.setMinutes(now.getMinutes() - amount); break;
    case 'h': now.setHours(now.getHours() - amount); break;
    case 'd': now.setDate(now.getDate() - amount); break;
  }

  return now.toISOString();
};
