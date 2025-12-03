/**
 * Routes Gmail - Récupération des réponses et OAuth2
 */

import express from 'express';
import { GmailService } from '../services/GmailService';

const router = express.Router();

// POST /api/gmail/check-replies - Vérifier les nouvelles réponses
router.post('/check-replies', async (req, res) => {
  try {
    const { since_date } = req.body;
    
    const sinceDate = since_date 
      ? new Date(since_date) 
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // Dernières 24h par défaut

    const result = await GmailService.fetchNewReplies(sinceDate);

    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Erreur vérification réponses Gmail:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la vérification des réponses'
    });
  }
});

// GET /api/gmail/test-connection - Tester la connexion Gmail
router.get('/test-connection', async (req, res) => {
  try {
    const result = await GmailService.testConnection();
    
    return res.json({
      success: result.success,
      data: result.success ? { email: result.email } : null,
      error: result.error
    });
  } catch (error: any) {
    console.error('Erreur test connexion Gmail:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors du test de connexion'
    });
  }
});

// GET /api/gmail/auth-url - Générer l'URL d'autorisation OAuth2
router.get('/auth-url', async (req, res) => {
  try {
    const authUrl = GmailService.generateAuthUrl();
    
    // Si le paramètre ?redirect=true est présent, rediriger directement vers Google
    if (req.query.redirect === 'true') {
      return res.redirect(authUrl);
    }
    
    return res.json({
      success: true,
      data: {
        auth_url: authUrl,
        instructions: [
          '1. Cliquez sur le lien auth_url ci-dessus',
          '2. Connectez-vous avec votre compte Gmail',
          '3. Acceptez les permissions demandées',
          '4. Copiez le code d\'autorisation fourni',
          '5. Utilisez la route POST /api/gmail/auth-callback avec le code'
        ]
      }
    });
  } catch (error: any) {
    console.error('Erreur génération URL auth Gmail:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la génération de l\'URL d\'autorisation'
    });
  }
});

// GET /api/gmail/auth-callback - Callback OAuth2 (pour redirect automatique)
router.get('/auth-callback', async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.status(400).send(`
        <html>
          <head><title>Erreur OAuth2</title></head>
          <body style="font-family: system-ui; padding: 40px; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626;">❌ Erreur d'autorisation</h1>
            <p><strong>Erreur:</strong> ${error}</p>
            <p>L'autorisation OAuth2 a échoué. Veuillez réessayer.</p>
            <a href="/admin" style="color: #2563eb;">← Retour au dashboard</a>
          </body>
        </html>
      `);
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).send(`
        <html>
          <head><title>Code manquant</title></head>
          <body style="font-family: system-ui; padding: 40px; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626;">❌ Code d'autorisation manquant</h1>
            <p>Aucun code d'autorisation n'a été fourni par Google.</p>
            <a href="/admin" style="color: #2563eb;">← Retour au dashboard</a>
          </body>
        </html>
      `);
    }

    // Échanger le code contre des tokens
    const tokens = await GmailService.exchangeCodeForTokens(code);

    return res.send(`
      <html>
        <head><title>✅ Autorisation réussie</title></head>
        <body style="font-family: system-ui; padding: 40px; max-width: 800px; margin: 0 auto;">
          <h1 style="color: #16a34a;">✅ Autorisation Gmail réussie !</h1>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">📝 Nouveau Refresh Token</h2>
            <p>Copiez ce refresh token et ajoutez-le à votre fichier <code>.env</code> :</p>
            <pre style="background: #1f2937; color: #10b981; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px;">GMAIL_REFRESH_TOKEN=${tokens.refresh_token}</pre>
          </div>

          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0;"><strong>⚠️ Important :</strong> Après avoir mis à jour votre .env, redémarrez le serveur pour appliquer les changements.</p>
          </div>

          <div style="margin-top: 30px;">
            <h3>Détails des tokens (pour information) :</h3>
            <ul style="line-height: 1.8;">
              <li><strong>Access Token:</strong> <code style="font-size: 11px;">${tokens.access_token.substring(0, 50)}...</code></li>
              <li><strong>Expiration:</strong> ${new Date(tokens.expiry_date).toLocaleString('fr-FR')}</li>
            </ul>
          </div>

          <a href="/admin" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">← Retour au dashboard</a>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Erreur callback OAuth2 Gmail:', error);
    return res.status(500).send(`
      <html>
        <head><title>Erreur</title></head>
        <body style="font-family: system-ui; padding: 40px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">❌ Erreur lors de l'échange du code</h1>
          <pre style="background: #fef2f2; padding: 15px; border-radius: 4px; overflow-x: auto;">${error.message}</pre>
          <a href="/admin" style="color: #2563eb;">← Retour au dashboard</a>
        </body>
      </html>
    `);
  }
});

// POST /api/gmail/auth-callback - Alternative pour échanger un code manuellement
router.post('/auth-callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Le code d\'autorisation est requis'
      });
    }

    const tokens = await GmailService.exchangeCodeForTokens(code);

    return res.json({
      success: true,
      data: {
        refresh_token: tokens.refresh_token,
        access_token: tokens.access_token.substring(0, 50) + '...',
        expiry_date: new Date(tokens.expiry_date).toISOString(),
        instructions: [
          'Ajoutez ce refresh_token à votre fichier .env :',
          `GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`,
          'Puis redémarrez le serveur.'
        ]
      }
    });
  } catch (error: any) {
    console.error('Erreur callback OAuth2 Gmail:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'échange du code'
    });
  }
});

export default router;

