import { ProjectRole } from './types';

export const isAtLeastMember = (role: ProjectRole) => {
  return role === 'owner' || role === 'member';
};

export const getRoleLabel = (role: ProjectRole) => {
  return role.charAt(0).toUpperCase() + role.slice(1);
};
