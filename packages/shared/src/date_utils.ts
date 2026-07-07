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
