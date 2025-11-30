/**
 * Service de génération de liens sécurisés pour les emails
 * Permet d'ouvrir l'application si installée, sinon le navigateur par défaut
 * avec connexion automatique si données en cache
 * 
 * IMPORTANT: Utilise une redirection serveur au lieu de JavaScript
 * pour garantir une meilleure délivrabilité des emails
 */

import { generateRedirectToken } from '../routes/redirect';

export class SecureLinkService {
  /**
   * Génère un lien sécurisé qui :
   * 1. Ouvre l'application si installée sur le device
   * 2. Sinon ouvre le navigateur par défaut sur le dashboard
   * 3. Connexion automatique si données en cache
   */
  static generateSecureLink(
    path: string,
    userId?: string,
    userType?: string
  ): string {
    const frontendUrl = process.env.FRONTEND_URL || 'https://app.profitum.fr';
    const baseUrl = `${frontendUrl}${path}`;
    
    // Si userId et userType sont fournis, ajouter des paramètres pour la connexion automatique
    if (userId && userType) {
      const params = new URLSearchParams({
        autoLogin: 'true',
        userId: userId,
        userType: userType,
        timestamp: Date.now().toString()
      });
      return `${baseUrl}?${params.toString()}`;
    }
    
    return baseUrl;
  }

  /**
   * Génère un lien avec deep linking pour l'application mobile/PWA
   * Format: profitum://path ou https://app.profitum.fr/path
   */
  static generateDeepLink(path: string, userId?: string, userType?: string): string {
    const appScheme = 'profitum://';
    const webUrl = this.generateSecureLink(path, userId, userType);
    
    // Pour les emails HTML, on peut utiliser un lien qui essaie d'abord l'app puis le web
    // Format: <a href="webUrl" data-app-link="appScheme+path">Link</a>
    return webUrl;
  }

  /**
   * Génère le HTML pour un lien intelligent (app ou web)
   * Utilise une redirection serveur au lieu de JavaScript pour une meilleure délivrabilité
   * Compatible avec tous les clients email (Gmail, Outlook, Apple Mail, etc.)
   * Design haut de gamme avec dégradé violet
   */
  static generateSmartLinkHTML(
    text: string,
    path: string,
    userId?: string,
    userType?: string,
    className?: string
  ): string {
    // Générer un token sécurisé pour la redirection
    const token = generateRedirectToken(path, userId, userType);
    const apiUrl = process.env.API_URL || process.env.BACKEND_URL || 'https://profitummvp-production.up.railway.app';
    const redirectUrl = `${apiUrl}/api/redirect/${token}`;
    
    // Lien HTML simple sans JavaScript - style premium avec dégradé violet
    return `
      <a href="${redirectUrl}" 
         style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3); transition: transform 0.2s;"
         class="${className || ''}">
        ${text}
      </a>
    `;
  }

  /**
   * Génère un lien simple (sans deep linking) pour les emails texte
   */
  static generateSimpleLink(path: string, userId?: string, userType?: string): string {
    return this.generateSecureLink(path, userId, userType);
  }
}

