export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export type Middleware = (req: Request) => Promise<Response | void>;
