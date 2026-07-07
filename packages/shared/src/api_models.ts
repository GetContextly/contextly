import { Project, Decision, Change, ProjectMember } from './types';

export interface ProjectWithStats extends Project {
  decisionCount: number;
  changeCount: number;
  memberCount: number;
}

export interface ProjectDetail extends Project {
  members: ProjectMember[];
  recentDecisions: Decision[];
  recentChanges: Change[];
}
