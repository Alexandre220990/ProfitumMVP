import { AuthUser } from './auth';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Cette ligne est nécessaire pour que TypeScript reconnaisse ce fichier comme un module
export {}; 