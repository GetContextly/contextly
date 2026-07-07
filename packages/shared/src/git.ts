export const isValidCommitSha = (sha: string) => {
  return /^[0-9a-f]{40}$/i.test(sha);
};

export const parseGitHubRepo = (url: string) => {
  const match = url.match(/github\.com\/([^/]+)\/([^/.]+)/);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2],
  };
};
