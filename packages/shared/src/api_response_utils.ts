export const isSuccess = (status: number) => status >= 200 && status < 300;

export const isClientError = (status: number) => status >= 400 && status < 500;

export const isServerError = (status: number) => status >= 500;
