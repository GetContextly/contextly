export type PlanType = 'free' | 'pro' | 'team';

export interface PlanLimits {
  maxProjects: number;
  maxDecisionsPerMonth: number;
  hasGithubIntegration: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: { maxProjects: 3, maxDecisionsPerMonth: 100, hasGithubIntegration: false },
  pro: { maxProjects: 20, maxDecisionsPerMonth: 2000, hasGithubIntegration: true },
  team: { maxProjects: 100, maxDecisionsPerMonth: 10000, hasGithubIntegration: true },
};
