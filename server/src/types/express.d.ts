import type { AuthUser } from './auth';

// Extension globale de l'interface Express pour req.user

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {}; 