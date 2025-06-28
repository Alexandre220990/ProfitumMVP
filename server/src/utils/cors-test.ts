import { Request, Response } from 'express';
import { diagnoseCookieIssues } from './cookie-helper';

/**
 * Utilitaire pour tester les connexions CORS IPv6
 * Ce script peut être utilisé pour vérifier si les connexions CORS fonctionnent correctement
 */

// Cette route peut être ajoutée au fichier index.ts pour tester les connexions CORS
export const addCorsTestRoute = (app: any) => {
  /**
   * Route de test CORS
   * Accédez à cette route depuis votre navigateur:
   * - http://[::1]:5001/api/cors-test
   * Ou utilisez cette commande curl:
   * - curl -v -H "Origin: http://[::1]:3000" http://[::1]:5001/api/cors-test
   */
  app.get('/api/cors-test', (req: Request, res: Response) => {
    const origin = req.headers.origin || 'Origine inconnue';
    const host = req.headers.host || 'Hôte inconnu';
    const userAgent = req.headers['user-agent'] || 'User-Agent inconnu';
    
    console.log('🧪 Test CORS - Requête reçue');
    console.log(`   Origine: ${origin}`);
    console.log(`   Hôte: ${host}`);
    console.log(`   User-Agent: ${userAgent}`);
    
    // Vérifier les headers CORS de la réponse
    const corsHeaders = {
      'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials'),
      'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers')
    };
    
    console.log('   Headers CORS de réponse:');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      console.log(`     ${key}: ${value || 'non défini'}`);
    });
    
    // Analyser les problèmes potentiels de cookies en IPv6
    const cookieDiagnostic = diagnoseCookieIssues(req);
    console.log('   Diagnostic cookies:');
    console.log(`     Nombre de cookies: ${cookieDiagnostic.cookies}`);
    console.log(`     Mode IPv6: ${cookieDiagnostic.isIPv6 ? 'Oui' : 'Non'}`);
    
    if (cookieDiagnostic.possibleIssues.recommendations.length > 0) {
      console.log('   ⚠️ Recommandations:');
      cookieDiagnostic.possibleIssues.recommendations.forEach(rec => {
        console.log(`     - ${rec}`);
      });
    }
    
    // Définir un cookie de test
    res.cookie('cors_test', 'ok', { 
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60000 // 1 minute
    });
    
    res.json({
      success: true,
      message: 'Test CORS réussi',
      origin: origin,
      host: host,
      cookies: cookieDiagnostic,
      headers: {
        request: {
          origin: origin,
          host: host,
          userAgent: userAgent
        },
        response: corsHeaders
      },
      ipv6Support: true,
      timestamp: new Date().toISOString()
    });
  });
  
  console.log('✅ Route de test CORS ajoutée: /api/cors-test');
}; 