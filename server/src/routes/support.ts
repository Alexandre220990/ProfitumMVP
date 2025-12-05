import express from 'express';
import { EmailService } from '../services/EmailService';
import { optionalAuthMiddleware } from '../middleware/optional-auth';

const router = express.Router();

// POST /api/support/error-report - Envoyer un rapport d'erreur au support
router.post('/error-report', optionalAuthMiddleware, async (req, res) => {
  try {
    const { 
      errorMessage, 
      errorStack, 
      userAgent, 
      url, 
      timestamp,
      userEmail,
      userType,
      userName
    } = req.body;

    // Validation des champs obligatoires
    if (!errorMessage) {
      return res.status(400).json({
        success: false,
        message: 'Le message d\'erreur est requis'
      });
    }

    // Email du support
    const supportEmail = 'grandjean.alexandre5@gmail.com';

    // Préparer le contenu de l'email
    const subject = `[Rapport d'erreur] ${errorMessage.substring(0, 50)}...`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Rapport d'erreur</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; }
          .section { background: white; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #dc2626; }
          .label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
          .value { color: #111827; font-size: 14px; word-break: break-word; }
          .code-block { background: #1f2937; color: #f3f4f6; padding: 15px; border-radius: 6px; overflow-x: auto; font-family: 'Courier New', monospace; font-size: 12px; white-space: pre-wrap; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Rapport d'erreur - Application Profitum</h1>
            <p style="margin: 0; font-size: 14px;">Signalé le ${timestamp || new Date().toLocaleString('fr-FR')}</p>
          </div>
          
          <div class="content">
            <div class="section">
              <div class="label">Message d'erreur</div>
              <div class="value">${errorMessage || 'Non spécifié'}</div>
            </div>

            ${errorStack ? `
            <div class="section">
              <div class="label">Stack trace</div>
              <div class="code-block">${errorStack}</div>
            </div>
            ` : ''}

            ${userEmail ? `
            <div class="section">
              <div class="label">Utilisateur</div>
              <div class="value">
                <strong>Email:</strong> ${userEmail}<br>
                ${userName ? `<strong>Nom:</strong> ${userName}<br>` : ''}
                ${userType ? `<strong>Type:</strong> ${userType}` : ''}
              </div>
            </div>
            ` : ''}

            ${url ? `
            <div class="section">
              <div class="label">URL de l'erreur</div>
              <div class="value">${url}</div>
            </div>
            ` : ''}

            ${userAgent ? `
            <div class="section">
              <div class="label">User Agent</div>
              <div class="value" style="font-size: 11px;">${userAgent}</div>
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>Ce rapport a été généré automatiquement depuis l'application Profitum.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
RAPPORT D'ERREUR - Application Profitum
========================================

Date: ${timestamp || new Date().toLocaleString('fr-FR')}

Message d'erreur:
${errorMessage || 'Non spécifié'}

${errorStack ? `Stack trace:\n${errorStack}\n` : ''}

${userEmail ? `Utilisateur:\n- Email: ${userEmail}\n${userName ? `- Nom: ${userName}\n` : ''}${userType ? `- Type: ${userType}\n` : ''}\n` : ''}

${url ? `URL: ${url}\n` : ''}
${userAgent ? `User Agent: ${userAgent}\n` : ''}
    `.trim();

    // Envoyer l'email au support
    const emailSent = await EmailService.sendDailyReportEmail(
      supportEmail,
      subject,
      html,
      text
    );

    if (!emailSent) {
      console.error('❌ Échec envoi email support');
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email au support'
      });
    }

    console.log('✅ Email de rapport d\'erreur envoyé au support:', supportEmail);

    return res.json({
      success: true,
      message: 'Rapport d\'erreur envoyé au support avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur route support:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'envoi du rapport'
    });
  }
});

export default router;
