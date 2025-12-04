import type { AuthUser } from '../types/auth';

// Extension globale de l'interface Express pour req.user

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {}; 