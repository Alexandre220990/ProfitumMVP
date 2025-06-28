import { User } from '@supabase/supabase-js';
import { AuthUser, UserMetadata } from '../types/auth';
import jwt from 'jsonwebtoken';

/**
 * Convertit un utilisateur Supabase en objet AuthUser
 * @param user L'utilisateur Supabase
 * @returns Un objet AuthUser typé
 */
export function createAuthUserFromSupabase(user: User): AuthUser {
  const type = (user.user_metadata?.type as 'client' | 'expert') || 'client';

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

/**
 * Vérifie si un token JWT est valide
 * @param token Le token JWT à vérifier
 * @param secret Le secret utilisé pour signer le token
 * @returns Les données décodées du token ou null si invalide
 */
export function verifyJwtToken(token: string, secret: string): any {
  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      maxAge: '24h'
    });
    return decoded;
  } catch (error) {
    console.error('Erreur de vérification JWT:', error);
    return null;
  }
}

/**
 * Extrait le token d'un en-tête d'autorisation
 * @param authHeader L'en-tête d'autorisation
 * @returns Le token ou null si non trouvé
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }
  
  return parts[1];
} 