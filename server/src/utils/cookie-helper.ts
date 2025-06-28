import { Request, Response } from 'express';

/**
 * Utilitaire pour gérer les cookies en environnement IPv6
 * Aide à résoudre les problèmes de cookies entre domaines [::1] et localhost
 */
export const configureCookies = (req: Request, res: Response, name: string, value: string, options: any = {}) => {
  // En développement, permettre les cookies sur [::1] et localhost
  const isLocalhost = 
    req.headers.host?.includes('localhost') ||
    req.headers.host?.includes('[::1]');
  
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  
  // Options par défaut optimisées pour IPv6
  const defaultOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' ? true : isSecure,
    sameSite: isLocalhost ? 'lax' : 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 heures
    path: '/',
  };
  
  // Fusionner les options par défaut avec celles fournies
  const cookieOptions = { ...defaultOptions, ...options };
  
  // Définir le cookie
  res.cookie(name, value, cookieOptions);
  
  // Journaliser l'opération
  console.log(`Cookie '${name}' défini avec les options:`, cookieOptions);
};

/**
 * Vérifie si les cookies sont correctement configurés pour IPv6
 * @returns Un objet contenant le diagnostic et des recommandations
 */
export const diagnoseCookieIssues = (req: Request) => {
  const host = req.headers.host || '';
  const origin = req.headers.origin || '';
  const cookies = req.headers.cookie || '';
  
  const isIPv6Host = host.includes('[::1]');
  const isIPv6Origin = origin.includes('[::1]');
  const hasCookies = cookies.length > 0;
  
  return {
    host,
    origin,
    cookies: hasCookies ? cookies.split(';').length : 0,
    isIPv6: isIPv6Host || isIPv6Origin,
    possibleIssues: {
      mixedModeHosting: isIPv6Host !== isIPv6Origin && origin !== '',
      noCookies: !hasCookies,
      recommendations: [
        isIPv6Host && !hasCookies ? "Les cookies ne sont pas transmis en IPv6, vérifiez la configuration du navigateur" : null,
        isIPv6Host !== isIPv6Origin ? "Mélange d'adressage IPv6/IPv4 entre l'origine et l'hôte, utilisez le même format d'adresse" : null
      ].filter(Boolean)
    }
  };
}; 