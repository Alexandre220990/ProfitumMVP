import { Request, Response, NextFunction } from 'express';
import { User } from '@supabase/supabase-js';

export interface UserMetadata {
  type?: 'client' | 'expert' | 'admin' | 'apporteur';
  username?: string;
  company?: string;
  company_name?: string;
  phone?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  siren?: string;
  [key: string]: any;
}

// Interface étendue pour AuthUser avec toutes les propriétés requises
export interface AuthUser extends User {
  user_metadata: UserMetadata;
  type: 'client' | 'expert' | 'admin' | 'apporteur';
  database_id: string;
  permissions?: string[];
  auth_id?: string;
  app_metadata: any;
  aud: string;
  created_at: string;
}

// Alias pour compatibilité avec middleware
export interface AuthenticatedUser extends AuthUser {}

export interface BaseUser {
  id: string;
  email: string;
  type: 'client' | 'expert' | 'admin' | 'apporteur';
  database_id?: string;
  user_metadata?: UserMetadata;
}

// Types pour les réponses d'API
export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: AuthUser;
  };
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    user: AuthUser;
    session: any;
  };
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  data?: {
    user: AuthUser;
  };
}

// Type pour les routes Express avec authentification
export type ExpressRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<Response | void> | Response | void;

// Type pour les requêtes avec utilisateur authentifié
export interface RequestWithUser extends Request {
  user?: AuthUser;
}

// Extension globale de Request pour TypeScript
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function createAuthUserFromSupabase(user: User): AuthUser {
  const type = (user.user_metadata?.type as 'client' | 'expert' | 'admin' | 'apporteur') || 'client';

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
    ...user,
    type,
    database_id: (user as any).database_id || user.id,
    user_metadata: userMetadata,
    app_metadata: user.app_metadata || {},
    aud: user.aud || 'authenticated',
    created_at: user.created_at || new Date().toISOString()
  };
} 