import { Request, Response, NextFunction } from 'express';
import { User } from '@supabase/supabase-js';

export interface UserMetadata {
  username: string;
  type: 'client' | 'expert' | 'admin';
  company_name?: string;
  siren?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  postal_code?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: any;
  };
}

export interface BaseUser {
  id: string;
  email: string;
  type: 'client' | 'expert' | 'admin';
}

export interface AuthUser extends BaseUser {
  user_metadata: UserMetadata;
}

// Type compatible avec Express
export interface RequestWithUser extends Request {
  user?: AuthUser;
}

// Type pour les handlers de route qui utilisent l'authentification
export type RequestHandlerWithUser = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => Promise<Response | void> | Response | void;

// Type pour les routes Express avec authentification
export type ExpressRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<Response | void> | Response | void;

export function createAuthUserFromSupabase(user: User): AuthUser {
  const type = (user.user_metadata?.type as 'client' | 'expert' | 'admin' | 'admin') || 'client';

  // ⚠️ Sécuriser le champ `username` avec fallback
  const username =
    user.user_metadata?.username ||
    user.user_metadata?.company_name ||
    (user.email ? user.email.split('@')[0] : 'user');

  // Créer un objet UserMetadata valide
  const userMetadata: UserMetadata = {
    type,
    username,
    ...user.user_metadata
  };

  return {
    id: user.id,
    email: user.email || '',
    type,
    user_metadata: userMetadata
  };
} 