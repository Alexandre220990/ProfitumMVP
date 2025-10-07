/**
 * Templates d'emails pour les prospects créés par les apporteurs d'affaires
 */

interface ProspectEmailData {
  prospectName: string;
  prospectEmail: string;
  temporaryPassword: string;
  apporteurName: string;
  apporteurCompany: string;
  loginUrl: string;
}

/**
 * Template 1: Email suite à un échange concluant
 * Contexte: L'apporteur a eu un échange positif avec le prospect
 */
export function getExchangeEmailTemplate(data: ProspectEmailData): { subject: string; html: string; text: string } {
  const subject = `Profitum - Suite à notre échange : Vos identifiants d'accès`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .credentials { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
    .credential-item { margin: 10px 0; }
    .credential-label { font-weight: bold; color: #667eea; }
    .credential-value { font-size: 18px; font-family: monospace; background: #f0f0f0; padding: 8px 12px; display: inline-block; border-radius: 4px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Bienvenue sur Profitum !</h1>
    </div>
    <div class="content">
      <p>Bonjour ${data.prospectName},</p>
      
      <p>Suite à notre échange avec <strong>${data.apporteurName}</strong> de <strong>${data.apporteurCompany}</strong>, nous sommes ravis de vous accompagner dans votre projet d'optimisation fiscale et financière.</p>
      
      <p>Votre espace client Profitum a été créé et vous permet de :</p>
      <ul>
        <li>✅ Consulter les produits éligibles identifiés pour votre entreprise</li>
        <li>✅ Suivre l'avancement de vos dossiers en temps réel</li>
        <li>✅ Échanger avec les experts sélectionnés</li>
        <li>✅ Accéder à tous vos documents et rapports</li>
      </ul>

      <div class="credentials">
        <h3>🔐 Vos identifiants de connexion</h3>
        <div class="credential-item">
          <span class="credential-label">Email :</span><br>
          <span class="credential-value">${data.prospectEmail}</span>
        </div>
        <div class="credential-item">
          <span class="credential-label">Mot de passe provisoire :</span><br>
          <span class="credential-value">${data.temporaryPassword}</span>
        </div>
      </div>

      <div class="warning">
        <strong>⚠️ Important :</strong> Pour des raisons de sécurité, vous devrez changer ce mot de passe provisoire lors de votre première connexion.
      </div>

      <div style="text-align: center;">
        <a href="${data.loginUrl}" class="button">🚀 Accéder à mon espace</a>
      </div>

      <p>Notre équipe et ${data.apporteurName} restent à votre disposition pour toute question.</p>

      <p>À très bientôt sur Profitum !<br>
      <strong>L'équipe Profitum</strong></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Profitum - Optimisation fiscale et financière</p>
      <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Bonjour ${data.prospectName},

Suite à notre échange avec ${data.apporteurName} de ${data.apporteurCompany}, nous sommes ravis de vous accompagner dans votre projet d'optimisation fiscale et financière.

Votre espace client Profitum a été créé.

VOS IDENTIFIANTS DE CONNEXION
Email : ${data.prospectEmail}
Mot de passe provisoire : ${data.temporaryPassword}

⚠️ Important : Vous devrez changer ce mot de passe provisoire lors de votre première connexion.

Accédez à votre espace : ${data.loginUrl}

Notre équipe et ${data.apporteurName} restent à votre disposition.

À très bientôt sur Profitum !
L'équipe Profitum
  `;

  return { subject, html, text };
}

/**
 * Template 2: Email de présentation Profitum
 * Contexte: Premier contact, invitation à découvrir la plateforme
 */
export function getPresentationEmailTemplate(data: ProspectEmailData): { subject: string; html: string; text: string } {
  const subject = `Profitum - Découvrez votre espace personnalisé d'optimisation`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .feature { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .feature-icon { font-size: 24px; margin-right: 10px; }
    .credentials { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
    .credential-item { margin: 10px 0; }
    .credential-label { font-weight: bold; color: #667eea; }
    .credential-value { font-size: 18px; font-family: monospace; background: #f0f0f0; padding: 8px 12px; display: inline-block; border-radius: 4px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Découvrez Profitum</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Votre partenaire d'optimisation fiscale et financière</p>
    </div>
    <div class="content">
      <p>Bonjour ${data.prospectName},</p>
      
      <p><strong>${data.apporteurName}</strong> de <strong>${data.apporteurCompany}</strong> vous invite à découvrir <strong>Profitum</strong>, la plateforme qui simplifie et optimise votre gestion fiscale et financière.</p>

      <h3 style="color: #667eea; margin-top: 30px;">🎯 Ce que Profitum vous apporte</h3>
      
      <div class="feature">
        <span class="feature-icon">💰</span>
        <strong>Optimisation fiscale sur mesure</strong><br>
        <span style="color: #666;">Identifiez et maximisez toutes vos opportunités d'économies</span>
      </div>

      <div class="feature">
        <span class="feature-icon">👥</span>
        <strong>Expertise de qualité</strong><br>
        <span style="color: #666;">Accédez à un réseau d'experts spécialisés pour vos projets</span>
      </div>

      <div class="feature">
        <span class="feature-icon">📊</span>
        <strong>Suivi en temps réel</strong><br>
        <span style="color: #666;">Pilotez vos dossiers et suivez vos gains directement en ligne</span>
      </div>

      <div class="feature">
        <span class="feature-icon">🔒</span>
        <strong>Sécurité et confidentialité</strong><br>
        <span style="color: #666;">Vos données sont protégées et hébergées en France</span>
      </div>

      <div class="credentials">
        <h3>🔐 Vos identifiants d'accès</h3>
        <p>Un espace personnalisé a été créé pour vous permettre de découvrir les opportunités identifiées pour votre entreprise.</p>
        <div class="credential-item">
          <span class="credential-label">Email :</span><br>
          <span class="credential-value">${data.prospectEmail}</span>
        </div>
        <div class="credential-item">
          <span class="credential-label">Mot de passe provisoire :</span><br>
          <span class="credential-value">${data.temporaryPassword}</span>
        </div>
        <p style="margin-top: 15px;"><small>💡 Vous pourrez changer ce mot de passe lors de votre première connexion.</small></p>
      </div>

      <div style="text-align: center;">
        <a href="${data.loginUrl}" class="button">🚀 Découvrir mon espace</a>
      </div>

      <p style="margin-top: 30px;">Aucune obligation, prenez le temps d'explorer votre espace et les opportunités identifiées.</p>

      <p>${data.apporteurName} et notre équipe restent à votre écoute pour répondre à toutes vos questions.</p>

      <p>Au plaisir de vous accompagner,<br>
      <strong>L'équipe Profitum</strong></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Profitum - Optimisation fiscale et financière</p>
      <p>Vous avez reçu cet email car ${data.apporteurName} vous a créé un accès à Profitum.</p>
      <p>Si vous ne souhaitez pas utiliser cet accès, vous pouvez simplement ignorer cet email.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Bonjour ${data.prospectName},

${data.apporteurName} de ${data.apporteurCompany} vous invite à découvrir Profitum, la plateforme qui simplifie et optimise votre gestion fiscale et financière.

CE QUE PROFITUM VOUS APPORTE
💰 Optimisation fiscale sur mesure
👥 Expertise de qualité
📊 Suivi en temps réel
🔒 Sécurité et confidentialité

VOS IDENTIFIANTS D'ACCÈS
Email : ${data.prospectEmail}
Mot de passe provisoire : ${data.temporaryPassword}

💡 Vous pourrez changer ce mot de passe lors de votre première connexion.

Découvrez votre espace : ${data.loginUrl}

Aucune obligation, prenez le temps d'explorer votre espace et les opportunités identifiées.

${data.apporteurName} et notre équipe restent à votre écoute.

Au plaisir de vous accompagner,
L'équipe Profitum
  `;

  return { subject, html, text };
}

