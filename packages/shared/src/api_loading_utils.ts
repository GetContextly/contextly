import { APIStatus, RequestState } from './api_status';

export const getInitialState = (): RequestState => ({
  status: APIStatus.IDLE,
  error: null,
});

export const getLoadingState = (): RequestState => ({
  status: APIStatus.LOADING,
  error: null,
});

export const getSuccessState = (): RequestState => ({
  status: APIStatus.SUCCESS,
  error: null,
});

export const getErrorState = (error: string): RequestState => ({
  status: APIStatus.ERROR,
  error,
});
