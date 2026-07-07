import { RequestState } from './api_status';

export interface UseProjectResult extends RequestState {
  project: any | null;
  refresh: () => Promise<void>;
}

export interface UseProjectsResult extends RequestState {
  projects: any[];
  refresh: () => Promise<void>;
}
