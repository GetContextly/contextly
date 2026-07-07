import { ProjectRole } from './types';

export const canWrite = (role: ProjectRole) => {
  return role === 'owner' || role === 'member';
};

export const canManageMembers = (role: ProjectRole) => {
  return role === 'owner';
};

export const canView = (role: ProjectRole) => {
  return true; // All roles in project_members can view
};
