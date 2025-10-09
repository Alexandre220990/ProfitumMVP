/**
 * Configuration sécurisée pour JWT
 * ⚠️ En production, JWT_SECRET DOIT être défini dans les variables d'environnement
 */

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

/**
 * Récupère le JWT_SECRET de manière sécurisée
 * En production: Lance une erreur si JWT_SECRET n'est pas défini
 * En développement: Utilise un fallback avec un warning
 */
export function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;

  // En production, JWT_SECRET est OBLIGATOIRE
  if (isProduction && !secret) {
    throw new Error(
      '🚨 ERREUR CRITIQUE: JWT_SECRET n\'est pas défini en production. ' +
      'Définissez cette variable d\'environnement avant de démarrer le serveur.'
    );
  }

  // En développement, warning si pas défini
  if (isDevelopment && !secret) {
    console.warn(
      '⚠️  WARNING: JWT_SECRET n\'est pas défini. ' +
      'Utilisation d\'un secret de développement (NON SÉCURISÉ pour la production)'
    );
    return 'dev_jwt_secret_please_set_env_variable_in_production';
  }

  return secret as string;
}

/**
 * Configuration JWT
 */
export const jwtConfig = {
  secret: getJWTSecret(),
  expiresIn: '24h' as const, // Durée du token d'accès
  refreshExpiresIn: '7d' as const, // Durée du refresh token
  algorithm: 'HS256' as const
};

/**
 * Vérifie que la configuration JWT est valide au démarrage
 */
export function validateJWTConfig(): void {
  try {
    getJWTSecret();
    console.log('✅ Configuration JWT valide');
  } catch (error) {
    console.error('❌ Configuration JWT invalide:', error);
    throw error;
  }
}

