import { describe, it, expect } from 'vitest';
import { canWrite, canManageMembers, canView } from './permissions';
import { type ProjectRole } from './types';

describe('permissions', () => {
  describe('canWrite', () => {
    it('should allow owner to write', () => {
      expect(canWrite('owner')).toBe(true);
    });

    it('should allow member to write', () => {
      expect(canWrite('member')).toBe(true);
    });

    it('should not allow viewer to write', () => {
      expect(canWrite('viewer')).toBe(false);
    });
  });

  describe('canManageMembers', () => {
    it('should allow owner to manage members', () => {
      expect(canManageMembers('owner')).toBe(true);
    });

    it('should not allow member to manage members', () => {
      expect(canManageMembers('member')).toBe(false);
    });

    it('should not allow viewer to manage members', () => {
      expect(canManageMembers('viewer')).toBe(false);
    });
  });

  describe('canView', () => {
    it('should allow all roles to view', () => {
      expect(canView('owner')).toBe(true);
      expect(canView('member')).toBe(true);
      expect(canView('viewer')).toBe(true);
    });
  });
});
