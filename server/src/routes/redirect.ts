/**
 * Route de redirection intelligente pour les emails
 * Détecte automatiquement le device et redirige vers l'app ou le web
 * Sans JavaScript - compatible avec tous les clients email
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

// Clé secrète pour signer les tokens (doit correspondre à celle du service)
const REDIRECT_SECRET = process.env.REDIRECT_SECRET || 'profitum-redirect-secret-key-change-in-production';

/**
 * Détecte si le User-Agent est un appareil mobile
 */
function isMobileDevice(userAgent: string): boolean {
  if (!userAgent) return false;
  
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(userAgent);
}

/**
 * Génère un token signé pour sécuriser la redirection
 */
function generateRedirectToken(path: string, userId?: string, userType?: string): string {
  const payload = {
    path,
    userId: userId || null,
    userType: userType || null,
    timestamp: Date.now()
  };
  
  const payloadString = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', REDIRECT_SECRET);
  hmac.update(payloadString);
  const signature = hmac.digest('hex');
  
  // Encoder en base64 pour URL-safe
  const token = Buffer.from(JSON.stringify({ payload, signature })).toString('base64url');
  return token;
}

/**
 * Vérifie et décode un token de redirection
 */
function verifyRedirectToken(token: string): { path: string; userId?: string; userType?: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString());
    const { payload, signature } = decoded;
    
    // Vérifier la signature
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', REDIRECT_SECRET);
    hmac.update(payloadString);
    const expectedSignature = hmac.digest('hex');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    // Vérifier l'expiration (24 heures)
    const maxAge = 24 * 60 * 60 * 1000; // 24h en ms
    if (Date.now() - payload.timestamp > maxAge) {
      return null;
    }
    
    return {
      path: payload.path,
      userId: payload.userId || undefined,
      userType: payload.userType || undefined
    };
  } catch (error) {
    return null;
  }
}

/**
 * Construit l'URL web complète avec paramètres d'auto-login
 */
function buildWebUrl(path: string, userId?: string, userType?: string): string {
  const frontendUrl = process.env.FRONTEND_URL || 'https://app.profitum.fr';
  const baseUrl = `${frontendUrl}${path}`;
  
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
 * Construit l'URL de deep link pour l'app
 */
function buildAppUrl(path: string): string {
  return `profitum://${path}`;
}

/**
 * GET /api/redirect/:token
 * Route principale de redirection intelligente
 * 
 * Fonctionnement :
 * 1. Génère une page HTML intermédiaire qui essaie d'abord d'ouvrir l'app
 * 2. Si l'app n'est pas installée/disponible, redirige vers le web
 * 3. Fonctionne pour mobile ET desktop (PWA installée sur desktop)
 */
router.get('/:token', async (req: Request, res: Response) => {
  const { token } = req.params;
  
  // Vérifier et décoder le token
  const decoded = verifyRedirectToken(token);
  if (!decoded) {
    // Token invalide ou expiré, rediriger vers la page d'accueil
    const frontendUrl = process.env.FRONTEND_URL || 'https://app.profitum.fr';
    return res.redirect(302, frontendUrl);
  }
  
  const { path, userId, userType } = decoded;
  const webUrl = buildWebUrl(path, userId, userType);
  const appUrl = buildAppUrl(path);
  
  // Page HTML intermédiaire qui essaie d'abord l'app puis fallback sur le web
  // Fonctionne pour mobile ET desktop (PWA installée)
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirection...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #f3f4f6;
      color: #1f2937;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .spinner {
      border: 3px solid #e5e7eb;
      border-top: 3px solid #2563eb;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <p>Ouverture de l'application...</p>
  </div>
  
  <script>
    // Essayer d'ouvrir l'app immédiatement (fonctionne pour mobile ET desktop PWA)
    window.location.href = '${appUrl}';
    
    // Si l'app n'est pas installée, rediriger vers le web après 500ms
    setTimeout(function() {
      window.location.href = '${webUrl}';
    }, 500);
  </script>
  
  <!-- Fallback pour les navigateurs qui bloquent JavaScript -->
  <noscript>
    <meta http-equiv="refresh" content="0;url=${webUrl}">
  </noscript>
</body>
</html>`;
  
  return res.send(html);
});

/**
 * Export de la fonction de génération de token pour utilisation dans SecureLinkService
 */
export { generateRedirectToken };

export default router;

