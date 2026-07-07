export type PlanType = 'free' | 'pro' | 'team';

export interface PlanLimits {
  maxProjects: number;
  maxDecisionsPerMonth: number;
  hasGithubIntegration: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: { maxProjects: 1, maxDecisionsPerMonth: 50, hasGithubIntegration: false },
  pro: { maxProjects: 5, maxDecisionsPerMonth: 500, hasGithubIntegration: true },
  team: { maxProjects: 50, maxDecisionsPerMonth: 5000, hasGithubIntegration: true },
};
