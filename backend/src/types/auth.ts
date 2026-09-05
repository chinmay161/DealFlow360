export interface AuthenticatedUser {
  id: string;
  role: string;
  email?: string;
  isInternal?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
