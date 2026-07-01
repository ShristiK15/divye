import type { Role } from '@divye/database';
import type { Request } from 'express';

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  name: string;
};

export type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
