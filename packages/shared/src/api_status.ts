export enum APIStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface RequestState {
  status: APIStatus;
  error: string | null;
}
