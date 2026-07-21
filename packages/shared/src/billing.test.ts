import { describe, it, expect } from 'vitest';
import { PLAN_LIMITS, type PlanType } from './billing';

describe('billing', () => {
  describe('PLAN_LIMITS', () => {
    it('should define limits for all plan types', () => {
      expect(PLAN_LIMITS.free).toBeDefined();
      expect(PLAN_LIMITS.pro).toBeDefined();
      expect(PLAN_LIMITS.team).toBeDefined();
    });

    it('free plan should have correct limits', () => {
      expect(PLAN_LIMITS.free.maxProjects).toBe(3);
      expect(PLAN_LIMITS.free.maxDecisionsPerMonth).toBe(100);
      expect(PLAN_LIMITS.free.hasGithubIntegration).toBe(false);
    });

    it('pro plan should have correct limits', () => {
      expect(PLAN_LIMITS.pro.maxProjects).toBe(20);
      expect(PLAN_LIMITS.pro.maxDecisionsPerMonth).toBe(2000);
      expect(PLAN_LIMITS.pro.hasGithubIntegration).toBe(true);
    });

    it('team plan should have correct limits', () => {
      expect(PLAN_LIMITS.team.maxProjects).toBe(100);
      expect(PLAN_LIMITS.team.maxDecisionsPerMonth).toBe(10000);
      expect(PLAN_LIMITS.team.hasGithubIntegration).toBe(true);
    });

    it('pro should have higher limits than free', () => {
      expect(PLAN_LIMITS.pro.maxProjects).toBeGreaterThan(PLAN_LIMITS.free.maxProjects);
      expect(PLAN_LIMITS.pro.maxDecisionsPerMonth).toBeGreaterThan(PLAN_LIMITS.free.maxDecisionsPerMonth);
    });

    it('team should have higher limits than pro', () => {
      expect(PLAN_LIMITS.team.maxProjects).toBeGreaterThan(PLAN_LIMITS.pro.maxProjects);
      expect(PLAN_LIMITS.team.maxDecisionsPerMonth).toBeGreaterThan(PLAN_LIMITS.pro.maxDecisionsPerMonth);
    });
  });
});
