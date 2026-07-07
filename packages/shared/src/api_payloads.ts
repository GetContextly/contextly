export interface CreateProjectPayload {
  name: string;
  githubRepoUrl?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  githubRepoUrl?: string;
}

export interface LogDecisionPayload {
  summary: string;
  reasoning?: string;
  relatedFiles?: string[];
  source: string;
}
