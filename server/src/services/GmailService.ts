/**
 * Service Gmail - Récupération des réponses aux emails de prospection
 * Utilise Gmail API pour détecter les réponses et mettre à jour prospects_emails
 */

import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  userEmail: string;
}

export class GmailService {
  private static oauth2Client: any = null;

  /**
   * Obtenir la redirect URI pour OAuth2
   */
  private static getRedirectUri(): string {
    return process.env.GMAIL_OAUTH_REDIRECT_URI || 
           `${process.env.SERVER_URL || 'http://localhost:3001'}/api/gmail/auth-callback`;
  }

  /**
   * Initialiser le client OAuth2 Gmail
   */
  private static initializeOAuth2Client(): any {
    if (!this.oauth2Client) {
      const config: GmailConfig = {
        clientId: process.env.GMAIL_CLIENT_ID || '',
        clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
        refreshToken: process.env.GMAIL_REFRESH_TOKEN || '',
        userEmail: process.env.GMAIL_USER_EMAIL || process.env.SMTP_USER || ''
      };

      if (!config.clientId || !config.clientSecret || !config.refreshToken) {
        throw new Error('Configuration Gmail manquante (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN)');
      }

      this.oauth2Client = new google.auth.OAuth2(
        config.clientId,
        config.clientSecret,
        this.getRedirectUri()
      );

      this.oauth2Client.setCredentials({
        refresh_token: config.refreshToken
      });
    }

    return this.oauth2Client;
  }

  /**
   * Générer l'URL d'autorisation OAuth2 pour obtenir un nouveau refresh token
   */
  static generateAuthUrl(): string {
    const config: GmailConfig = {
      clientId: process.env.GMAIL_CLIENT_ID || '',
      clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
      refreshToken: '',
      userEmail: ''
    };

    if (!config.clientId || !config.clientSecret) {
      throw new Error('GMAIL_CLIENT_ID et GMAIL_CLIENT_SECRET sont requis');
    }

    const oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      this.getRedirectUri()
    );

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.send'
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // Force l'affichage de l'écran de consentement pour obtenir un refresh token
      scope: scopes
    });
  }

  /**
   * Échanger le code d'autorisation contre un refresh token
   */
  static async exchangeCodeForTokens(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expiry_date: number;
  }> {
    const config: GmailConfig = {
      clientId: process.env.GMAIL_CLIENT_ID || '',
      clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
      refreshToken: '',
      userEmail: ''
    };

    if (!config.clientId || !config.clientSecret) {
      throw new Error('GMAIL_CLIENT_ID et GMAIL_CLIENT_SECRET sont requis');
    }

    const oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      this.getRedirectUri()
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      throw new Error('Aucun refresh_token reçu. Assurez-vous d\'utiliser access_type=offline et prompt=consent');
    }

    return {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token!,
      expiry_date: tokens.expiry_date!
    };
  }

  /**
   * Tester la connexion Gmail avec le token actuel
   */
  static async testConnection(): Promise<{
    success: boolean;
    email?: string;
    error?: string;
  }> {
    try {
      const auth = this.initializeOAuth2Client();
      const gmail = google.gmail({ version: 'v1', auth });

      // Tenter de récupérer le profil pour vérifier la connexion
      const { data: profile } = await gmail.users.getProfile({
        userId: 'me'
      });

      return {
        success: true,
        email: profile.emailAddress || undefined
      };
    } catch (error: any) {
      console.error('Erreur test connexion Gmail:', error);
      
      // Vérifier si c'est une erreur invalid_grant
      if (error.code === 400 || error.message?.includes('invalid_grant')) {
        return {
          success: false,
          error: 'invalid_grant - Le refresh token n\'est plus valide. Réauthorisation requise.'
        };
      }

      return {
        success: false,
        error: error.message || 'Erreur de connexion inconnue'
      };
    }
  }

  /**
   * Extraire le domaine d'un email
   */
  private static extractEmailDomain(email: string): string | null {
    if (!email || !email.includes('@')) {
      return null;
    }
    return email.split('@')[1].toLowerCase();
  }

  /**
   * Extraire le contenu (HTML et text) d'un email Gmail
   */
  private static extractEmailBody(payload: any): { html: string | null; text: string | null; snippet: string } {
    let html: string | null = null;
    let text: string | null = null;
    const snippet = payload.snippet || '';

    // Fonction récursive pour parcourir les parts
    const extractParts = (part: any) => {
      if (part.mimeType === 'text/html' && part.body?.data) {
        html = Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.mimeType === 'text/plain' && part.body?.data) {
        text = Buffer.from(part.body.data, 'base64').toString('utf-8');
      }

      // Si le message a des parts multiples (multipart)
      if (part.parts) {
        for (const subPart of part.parts) {
          extractParts(subPart);
        }
      }
    };

    // Si le body est directement dans payload.body
    if (payload.body?.data) {
      if (payload.mimeType === 'text/html') {
        html = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      } else if (payload.mimeType === 'text/plain') {
        text = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      }
    }

    // Sinon, parcourir les parts
    if (payload.parts) {
      for (const part of payload.parts) {
        extractParts(part);
      }
    }

    return { html, text, snippet };
  }

  /**
   * Vérifier si un email correspond à un prospect (même email ou même domaine)
   */
  private static async checkProspectEmailMatch(
    replyFrom: string,
    replyTo: string
  ): Promise<{ prospectId: string; emailId: string } | null> {
    // Chercher par email exact
    const { data: exactMatch } = await supabase
      .from('prospects')
      .select('id, email')
      .eq('email', replyFrom.toLowerCase())
      .single();

    if (exactMatch) {
      // Trouver l'email le plus récent envoyé à ce prospect
      const { data: prospectEmail } = await supabase
        .from('prospects_emails')
        .select('id')
        .eq('prospect_id', exactMatch.id)
        .eq('replied', false)
        .order('sent_at', { ascending: false })
        .limit(1)
        .single();

      if (prospectEmail) {
        return {
          prospectId: exactMatch.id,
          emailId: prospectEmail.id
        };
      }
    }

    // Chercher par domaine
    const replyDomain = this.extractEmailDomain(replyFrom);
    if (!replyDomain) {
      return null;
    }

    // Récupérer tous les prospects avec le même domaine
    const { data: domainMatches } = await supabase
      .from('prospects')
      .select('id, email')
      .not('email', 'is', null);

    if (!domainMatches) {
      return null;
    }

    for (const prospect of domainMatches) {
      const prospectDomain = this.extractEmailDomain(prospect.email);
      if (prospectDomain === replyDomain) {
        // Trouver l'email le plus récent envoyé à ce prospect
        const { data: prospectEmail } = await supabase
          .from('prospects_emails')
          .select('id')
          .eq('prospect_id', prospect.id)
          .eq('replied', false)
          .order('sent_at', { ascending: false })
          .limit(1)
          .single();

        if (prospectEmail) {
          return {
            prospectId: prospect.id,
            emailId: prospectEmail.id
          };
        }
      }
    }

    return null;
  }

  /**
   * Détecter si un email est un bounce (notification d'échec de livraison)
   */
  private static isBounceEmail(fromEmail: string, subject: string, bodyText: string): {
    isBounce: boolean;
    originalRecipient?: string;
    bounceType?: 'hard' | 'soft';
    bounceReason?: string;
  } {
    // Emails système qui indiquent des bounces
    const bounceFromPatterns = [
      'mailer-daemon@',
      'postmaster@',
      'mail-daemon@',
      'noreply@',
      'no-reply@',
      'bounce@',
      'bounces@'
    ];

    const fromLower = fromEmail.toLowerCase();
    const isBounce = bounceFromPatterns.some(pattern => fromLower.includes(pattern));

    if (!isBounce) {
      return { isBounce: false };
    }

    // Extraire l'email original depuis le corps ou le sujet
    const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const emailsInBody = bodyText.match(emailPattern) || [];
    const emailsInSubject = subject.match(emailPattern) || [];
    
    // Le premier email trouvé est généralement l'email qui a bounced
    const originalRecipient = emailsInSubject[0] || emailsInBody[0];

    // Déterminer le type de bounce
    const bodyLower = bodyText.toLowerCase();
    let bounceType: 'hard' | 'soft' = 'hard';
    let bounceReason = 'Unknown';

    // Hard bounces (permanents)
    if (bodyLower.includes('user unknown') || 
        bodyLower.includes('address not found') ||
        bodyLower.includes('no such user') ||
        bodyLower.includes('recipient address rejected')) {
      bounceType = 'hard';
      bounceReason = 'Invalid email address';
    }
    // Soft bounces (temporaires)
    else if (bodyLower.includes('mailbox full') ||
             bodyLower.includes('quota exceeded') ||
             bodyLower.includes('temporarily unavailable')) {
      bounceType = 'soft';
      bounceReason = 'Mailbox full or temporary issue';
    }

    return {
      isBounce: true,
      originalRecipient,
      bounceType,
      bounceReason
    };
  }

  /**
   * Récupérer les nouveaux emails depuis Gmail
   */
  static async fetchNewReplies(sinceDate?: Date): Promise<{
    processed: number;
    updated: number;
    errors: string[];
  }> {
    try {
      const auth = this.initializeOAuth2Client();
      const gmail = google.gmail({ version: 'v1', auth });

      // Construire la requête de recherche
      let query = 'is:unread in:inbox';
      
      if (sinceDate) {
        const sinceTimestamp = Math.floor(sinceDate.getTime() / 1000);
        query += ` after:${sinceTimestamp}`;
      }

      // Rechercher les emails
      const { data: messages } = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 50
      });

      if (!messages.messages || messages.messages.length === 0) {
        return { processed: 0, updated: 0, errors: [] };
      }

      const results = {
        processed: 0,
        updated: 0,
        errors: [] as string[]
      };

      // Traiter chaque email
      for (const message of messages.messages) {
        try {
          // Récupérer les détails COMPLETS de l'email (avec body)
          const { data: messageData } = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full' // ✅ Changé de 'metadata' à 'full' pour avoir le contenu
          });

          const headers = messageData.payload?.headers || [];
          const fromHeader = headers.find((h: any) => h.name === 'From');
          const toHeader = headers.find((h: any) => h.name === 'To');
          const subjectHeader = headers.find((h: any) => h.name === 'Subject');
          const inReplyTo = headers.find((h: any) => h.name === 'In-Reply-To');
          const references = headers.find((h: any) => h.name === 'References');
          const messageIdHeader = headers.find((h: any) => h.name === 'Message-ID');

          // ✅ Extraire le contenu du body (HTML et/ou text)
          const emailBody = this.extractEmailBody(messageData.payload);

          // Vérifier si c'est une réponse (a un In-Reply-To ou References)
          if (!inReplyTo && !references) {
            continue;
          }

          if (!fromHeader?.value || !toHeader?.value) {
            continue;
          }

          // Extraire l'email de l'expéditeur
          const fromEmail = fromHeader.value.match(/<(.+)>/) 
            ? fromHeader.value.match(/<(.+)>/)?.[1] 
            : fromHeader.value.split(' ')[0];

          if (!fromEmail) {
            continue;
          }

          // ✅ Détecter si c'est un bounce (notification d'échec de livraison)
          const subject = subjectHeader?.value || '';
          const bodyText = emailBody.text || emailBody.html || emailBody.snippet || '';
          const bounceInfo = this.isBounceEmail(fromEmail, subject, bodyText);

          if (bounceInfo.isBounce && bounceInfo.originalRecipient) {
            console.log(`📩 Bounce détecté pour: ${bounceInfo.originalRecipient} (Type: ${bounceInfo.bounceType})`);
            
            // Chercher le prospect par email
            const { data: prospect } = await supabase
              .from('prospects')
              .select('id')
              .eq('email', bounceInfo.originalRecipient.toLowerCase())
              .single();

            if (prospect) {
              // Récupérer les emails envoyés à mettre à jour
              const { data: existingEmails } = await supabase
                .from('prospects_emails')
                .select('id, metadata')
                .eq('prospect_id', prospect.id)
                .eq('bounced', false);

              // Mettre à jour chaque email avec metadata mergé
              if (existingEmails && existingEmails.length > 0) {
                for (const email of existingEmails) {
                  const updatedMetadata = {
                    ...(email.metadata || {}),
                    bounced_reason: bounceInfo.bounceReason,
                    bounced_type: bounceInfo.bounceType,
                    bounce_detected_at: new Date().toISOString()
                  };

                  await supabase
                    .from('prospects_emails')
                    .update({
                      bounced: true,
                      bounced_at: new Date().toISOString(),
                      metadata: updatedMetadata
                    })
                    .eq('id', email.id);
                }
              }

              // Mettre à jour le statut du prospect
              const { error: updateProspectError } = await supabase
                .from('prospects')
                .update({
                  emailing_status: 'bounced',
                  email_validity: bounceInfo.bounceType === 'hard' ? 'invalid' : 'risky',
                  updated_at: new Date().toISOString()
                })
                .eq('id', prospect.id);

              if (updateProspectError) {
                console.error('❌ Erreur mise à jour prospect bounced:', updateProspectError);
              }

              // Récupérer et mettre à jour les emails programmés
              const { data: scheduledEmails } = await supabase
                .from('prospect_email_scheduled')
                .select('id, metadata')
                .eq('prospect_id', prospect.id)
                .eq('status', 'scheduled');

              if (scheduledEmails && scheduledEmails.length > 0) {
                for (const scheduled of scheduledEmails) {
                  const updatedMetadata = {
                    ...(scheduled.metadata || {}),
                    cancelled_reason: 'email_bounced',
                    bounce_type: bounceInfo.bounceType,
                    bounce_reason: bounceInfo.bounceReason,
                    cancelled_at: new Date().toISOString()
                  };

                  await supabase
                    .from('prospect_email_scheduled')
                    .update({
                      status: 'cancelled',
                      updated_at: new Date().toISOString(),
                      metadata: updatedMetadata
                    })
                    .eq('id', scheduled.id);
                }
              }

              console.log(`✅ Prospect ${prospect.id} marqué comme bounced (${bounceInfo.bounceType})`);
            } else {
              console.log(`⚠️ Bounce détecté mais prospect non trouvé pour: ${bounceInfo.originalRecipient}`);
            }

            // Marquer le message comme lu et continuer
            await this.markAsRead(message.id!);
            results.processed++;
            continue; // Ne pas traiter comme une réponse normale
          }

          // Extraire l'email du destinataire (notre email)
          const toEmail = toHeader.value.match(/<(.+)>/) 
            ? toHeader.value.match(/<(.+)>/)?.[1] 
            : toHeader.value.split(' ')[0];

          // ✅ NOUVEAU: Vérifier si c'est une réponse à un email expert → client
          const expertEmailMatch = await this.checkExpertClientEmailMatch(
            fromEmail,
            inReplyTo?.value ?? undefined,
            references?.value ? references.value.split(' ') : []
          );

          if (expertEmailMatch) {
            // C'est une réponse à un email expert → client
            const receivedAt = new Date(messageData.internalDate 
              ? parseInt(messageData.internalDate) 
              : Date.now()).toISOString();

            // Vérifier si cet email existe déjà
            const { data: existingEmail } = await supabase
              .from('expert_client_emails_received')
              .select('id')
              .eq('gmail_message_id', message.id)
              .maybeSingle();

            if (existingEmail) {
              console.log(`ℹ️ Email expert déjà stocké (gmail_message_id: ${message.id}), skip...`);
              results.processed++;
              continue;
            }

            // Stocker l'email reçu dans expert_client_emails_received
            const { data: emailReceived, error: insertError } = await supabase
              .from('expert_client_emails_received')
              .insert({
                expert_email_id: expertEmailMatch.expert_email_id,
                expert_id: expertEmailMatch.expert_id,
                client_id: expertEmailMatch.client_id,
                client_produit_id: expertEmailMatch.client_produit_id || null,
                gmail_message_id: message.id,
                gmail_thread_id: messageData.threadId,
                from_email: fromEmail,
                from_name: fromHeader.value,
                to_email: toEmail,
                subject: subjectHeader?.value || '',
                body_html: emailBody.html,
                body_text: emailBody.text,
                snippet: emailBody.snippet,
                in_reply_to: inReplyTo?.value || null,
                references: references?.value ? references.value.split(' ') : [],
                headers: headers,
                labels: messageData.labelIds || [],
                received_at: receivedAt,
                is_read: false,
                is_replied: false
              })
              .select()
              .single();

            if (insertError) {
              console.error('❌ Erreur stockage email expert reçu:', insertError);
              results.errors.push(`Erreur stockage email expert reçu: ${insertError.message}`);
            } else {
              console.log(`✅ Email expert reçu stocké: ${emailReceived.id}`);

              // Notifier l'expert
              await this.notifyExpertForClientReply(
                expertEmailMatch.expert_id,
                expertEmailMatch.client_id,
                emailReceived.id,
                fromEmail
              );

              // Notifier l'admin
              await this.notifyAdminForClientReply(
                expertEmailMatch.client_id,
                emailReceived.id
              );

              results.updated++;
            }

            // Marquer comme lu et continuer (ne pas traiter comme prospect)
            await this.markAsRead(message.id!);
            results.processed++;
            continue;
          }

          // Chercher le prospect correspondant (logique existante)
          let match = await this.checkProspectEmailMatch(fromEmail, toEmail || '');

          // ✅ Si aucun prospect trouvé, créer automatiquement un nouveau prospect
          if (!match) {
            console.log(`📝 Création automatique d'un prospect pour ${fromEmail}`);
            const newProspect = await this.createProspectFromEmail(
              fromEmail,
              fromHeader.value,
              emailBody.text || emailBody.html || ''
            );
            
            if (newProspect) {
              match = {
                prospectId: newProspect.id,
                emailId: 'auto-created' // Pas d'email envoyé précédemment
              };
            }
          }

          if (match) {
            const receivedAt = new Date(messageData.internalDate 
              ? parseInt(messageData.internalDate) 
              : Date.now()).toISOString();

            // ✅ Vérifier si cet email existe déjà (éviter les doublons)
            const { data: existingEmail } = await supabase
              .from('prospect_email_received')
              .select('id')
              .eq('gmail_message_id', message.id)
              .maybeSingle();

            if (existingEmail) {
              console.log(`ℹ️ Email déjà stocké (gmail_message_id: ${message.id}), skip...`);
              results.processed++;
              continue;
            }

            // ✅ Stocker l'email reçu dans prospect_email_received
            const { data: emailReceived, error: insertError } = await supabase
              .from('prospect_email_received')
              .insert({
                prospect_id: match.prospectId,
                gmail_message_id: message.id,
                gmail_thread_id: messageData.threadId,
                from_email: fromEmail,
                from_name: fromHeader.value,
                to_email: toEmail,
                subject: subjectHeader?.value || '',
                body_html: emailBody.html,
                body_text: emailBody.text,
                snippet: emailBody.snippet,
                in_reply_to: inReplyTo?.value || null,
                references: references?.value ? references.value.split(' ') : [],
                headers: headers,
                labels: messageData.labelIds || [],
                received_at: receivedAt,
                is_read: false,
                is_replied: false
              })
              .select()
              .single();

            if (insertError) {
              const errorDetails = {
                message: insertError.message,
                details: insertError.details,
                hint: insertError.hint,
                code: insertError.code
              };
              const errorMsg = insertError.message || insertError.details || insertError.hint || JSON.stringify(insertError);
              results.errors.push(`Erreur stockage email reçu: ${errorMsg}`);
              console.error('❌ Erreur stockage email:', errorDetails);
              console.error('❌ Erreur complète:', JSON.stringify(insertError, null, 2));
            } else {
              console.log(`✅ Email reçu stocké: ${emailReceived.id}`);

              // Mettre à jour le statut replied dans prospects_emails (si c'est une vraie réponse à notre email)
              if (match.emailId !== 'auto-created') {
                await supabase
                  .from('prospects_emails')
                  .update({
                    replied: true,
                    replied_at: receivedAt,
                    metadata: {
                      gmail_message_id: message.id,
                      reply_from: fromEmail,
                      reply_subject: subjectHeader?.value || '',
                      email_received_id: emailReceived.id
                    }
                  })
                  .eq('id', match.emailId);
              }

              results.updated++;
              console.log(`✅ Réponse détectée pour prospect ${match.prospectId}`);
              
              // ✅ Arrêter automatiquement la séquence pour ce prospect
              if (match.emailId !== 'auto-created') {
                await this.stopProspectSequence(match.prospectId, fromEmail);
              }
              
              // ✅ Créer une notification admin avec lien vers page de synthèse
              await this.createAdminNotificationForReply(
                match.prospectId, 
                emailReceived.id,
                fromEmail, 
                match.emailId === 'auto-created'
              );
            }
          }

          results.processed++;
        } catch (error: any) {
          results.errors.push(`Erreur traitement message ${message.id}: ${error.message}`);
          console.error('Erreur traitement message Gmail:', error);
        }
      }

      return results;
    } catch (error: any) {
      console.error('Erreur récupération réponses Gmail:', error);
      throw error;
    }
  }

  /**
   * Marquer un email comme lu dans Gmail
   */
  static async markAsRead(messageId: string): Promise<boolean> {
    try {
      const auth = this.initializeOAuth2Client();
      const gmail = google.gmail({ version: 'v1', auth });

      await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });

      return true;
    } catch (error: any) {
      console.error('Erreur marquage email comme lu:', error);
      return false;
    }
  }

  /**
   * Créer automatiquement un prospect depuis un email reçu
   */
  private static async createProspectFromEmail(
    email: string,
    fromHeaderFull: string,
    emailContent: string
  ): Promise<{ id: string; email: string } | null> {
    try {
      // ⛔ Ne pas créer de prospect pour les emails système
      const systemEmailPatterns = [
        'mailer-daemon@',
        'postmaster@',
        'noreply@',
        'no-reply@',
        'bounce@',
        'bounces@',
        'donotreply@',
        'do-not-reply@'
      ];

      const emailLower = email.toLowerCase();
      if (systemEmailPatterns.some(pattern => emailLower.includes(pattern))) {
        console.log(`⛔ Email système ignoré: ${email}`);
        return null;
      }

      // Extraire le nom depuis le header "From: John Doe <john@example.com>"
      const nameMatch = fromHeaderFull.match(/^([^<]+)</);
      let firstname: string | null = null;
      let lastname: string | null = null;

      if (nameMatch && nameMatch[1]) {
        const fullName = nameMatch[1].trim().replace(/['"]/g, '');
        const nameParts = fullName.split(' ');
        if (nameParts.length >= 2) {
          firstname = nameParts[0];
          lastname = nameParts.slice(1).join(' ');
        } else {
          firstname = fullName;
        }
      }

      // Extraire le domaine pour le nom d'entreprise
      const domain = this.extractEmailDomain(email);
      const companyName = domain ? domain.split('.')[0] : null;

      // Créer le prospect
      const { data: newProspect, error: createError } = await supabase
        .from('prospects')
        .insert({
          email: email.toLowerCase(),
          source: 'email_reply',
          email_validity: 'valid', // On suppose que l'email est valide puisqu'on a reçu un email
          firstname,
          lastname,
          company_name: companyName,
          enrichment_status: 'pending',
          ai_status: 'pending',
          emailing_status: 'replied', // Directement en "replied" puisque c'est une réponse
          score_priority: 5, // Priorité élevée pour les réponses entrantes
          metadata: {
            created_from: 'gmail_reply',
            original_from_header: fromHeaderFull,
            auto_created: true,
            created_at: new Date().toISOString()
          }
        })
        .select('id, email')
        .single();

      if (createError) {
        console.error(`❌ Erreur création prospect automatique pour ${email}:`, createError);
        return null;
      }

      console.log(`✅ Prospect créé automatiquement: ${newProspect.id} (${email})`);
      return newProspect;
    } catch (error: any) {
      console.error(`❌ Erreur createProspectFromEmail:`, error);
      return null;
    }
  }

  /**
   * Arrêter automatiquement la séquence d'un prospect qui a répondu
   */
  private static async stopProspectSequence(prospectId: string, replyFrom: string): Promise<void> {
    try {
      // 1. Annuler tous les emails programmés en attente pour ce prospect
      const { data: cancelledEmails, error: cancelError } = await supabase
        .from('prospect_email_scheduled')
        .update({
          status: 'cancelled',
          cancelled_reason: `Séquence arrêtée : réponse reçue de ${replyFrom}`,
          updated_at: new Date().toISOString()
        })
        .eq('prospect_id', prospectId)
        .eq('status', 'scheduled')
        .select();

      if (cancelError) {
        console.error(`❌ Erreur annulation emails programmés pour prospect ${prospectId}:`, cancelError);
      } else {
        const count = cancelledEmails?.length || 0;
        console.log(`✅ ${count} email(s) programmé(s) annulé(s) pour prospect ${prospectId} (a répondu)`);
      }

      // 2. Mettre à jour le statut du prospect
      const { data: prospect } = await supabase
        .from('prospects')
        .select('metadata')
        .eq('id', prospectId)
        .single();
      
      const updatedMetadata = {
        ...(prospect?.metadata || {}),
        last_reply_from: replyFrom,
        last_reply_at: new Date().toISOString(),
        sequence_stopped: true,
        sequence_stopped_at: new Date().toISOString()
      };

      const { error: prospectError } = await supabase
        .from('prospects')
        .update({
          emailing_status: 'replied',
          updated_at: new Date().toISOString(),
          metadata: updatedMetadata
        })
        .eq('id', prospectId);

      if (prospectError) {
        console.error(`❌ Erreur mise à jour statut prospect ${prospectId}:`, prospectError);
      } else {
        console.log(`✅ Prospect ${prospectId} marqué comme "replied", séquence arrêtée`);
      }
    } catch (error: any) {
      console.error(`❌ Erreur stopProspectSequence pour ${prospectId}:`, error);
    }
  }

  /**
   * Créer une notification admin quand un prospect répond
   */
  private static async createAdminNotificationForReply(
    prospectId: string,
    emailReceivedId: string,
    replyFrom: string,
    isNewProspect: boolean = false
  ): Promise<void> {
    try {
      // Récupérer les infos du prospect
      const { data: prospect, error: prospectError } = await supabase
        .from('prospects')
        .select('email, firstname, lastname, company_name')
        .eq('id', prospectId)
        .single();

      if (prospectError || !prospect) {
        console.error(`❌ Impossible de récupérer prospect ${prospectId} pour notification`);
        return;
      }

      const prospectName = prospect.firstname && prospect.lastname 
        ? `${prospect.firstname} ${prospect.lastname}`
        : prospect.company_name || prospect.email;

      // Message différent si c'est un nouveau prospect créé automatiquement
      const title = isNewProspect
        ? `🆕 Nouveau contact: ${prospectName}`
        : `📧 Réponse reçue de ${prospectName}`;

      const message = isNewProspect
        ? `Un nouvel email a été reçu de ${prospectName} (${prospect.email}). Un prospect a été créé automatiquement. Consultez la séquence et répondez.`
        : `Le prospect ${prospectName} (${prospect.email}) a répondu à votre email de prospection. Consultez la séquence complète et sa réponse.`;

      // ✅ MIGRATION: Créer une notification dans notification pour chaque admin
      const { data: admins, error: adminsError } = await supabase
        .from('Admin')
        .select('id, auth_user_id')
        .eq('is_active', true);

      if (adminsError || !admins || admins.length === 0) {
        console.error(`❌ Erreur récupération admins pour notification prospect ${prospectId}:`, adminsError);
        return;
      }

      // Créer une notification pour chaque admin
      const notificationPromises = admins
        .filter(admin => admin.auth_user_id)
        .map(async (admin) => {
          const { error: notifError } = await supabase
            .from('notification')
            .insert({
              user_id: admin.auth_user_id,
              user_type: 'admin',
              notification_type: isNewProspect ? 'prospect_new_email' : 'prospect_reply',
              title,
              message,
              priority: isNewProspect ? 'urgent' : 'high',
              status: 'unread',
              is_read: false,
              metadata: {
                prospect_id: prospectId,
                email_received_id: emailReceivedId,
                prospect_email: prospect.email,
                prospect_name: prospectName,
                reply_from: replyFrom,
                is_new_prospect: isNewProspect,
                replied_at: new Date().toISOString()
              },
              action_url: `/admin/prospection/sequence/${prospectId}`,
              action_data: {
                action_label: 'Voir la séquence'
              },
              created_at: new Date().toISOString()
            });

          return notifError;
        });

      const errors = await Promise.all(notificationPromises);
      const hasError = errors.some(err => err !== null);

      if (hasError) {
        console.error(`❌ Erreur création notification admin pour prospect ${prospectId}`);
      } else {
        console.log(`✅ ${admins.filter(a => a.auth_user_id).length} notification(s) admin créée(s) pour ${isNewProspect ? 'nouveau prospect' : 'réponse'}: ${prospectName}`);
      }
    } catch (error: any) {
      console.error(`❌ Erreur createAdminNotificationForReply pour ${prospectId}:`, error);
    }
  }

  /**
   * Vérifier si un email reçu est une réponse à un email expert → client
   * Retourne les infos de l'email expert si match trouvé
   */
  private static async checkExpertClientEmailMatch(
    fromEmail: string,
    inReplyTo?: string,
    references?: string[]
  ): Promise<{
    expert_email_id: string;
    expert_id: string;
    client_id: string;
    client_produit_id?: string;
  } | null> {
    try {
      // Si pas de in_reply_to ni references, ce n'est pas une réponse
      if (!inReplyTo && (!references || references.length === 0)) {
        return null;
      }

      // Chercher l'email envoyé par l'expert via le Message-ID
      // Le Message-ID est stocké dans expert_client_emails.message_id
      const messageIdsToCheck = [
        inReplyTo,
        ...(references || [])
      ].filter(Boolean) as string[];

      if (messageIdsToCheck.length === 0) {
        return null;
      }

      // Chercher dans expert_client_emails via message_id
      // Note: message_id peut être dans le format <message-id> ou juste message-id
      const cleanMessageIds = messageIdsToCheck.map(id => {
        // Enlever les < > si présents
        return id.replace(/^<|>$/g, '');
      });

      const { data: expertEmail, error } = await supabase
        .from('expert_client_emails')
        .select('id, expert_id, client_id, client_produit_id, message_id')
        .in('message_id', cleanMessageIds)
        .eq('status', 'sent')
        .limit(1)
        .maybeSingle();

      if (error || !expertEmail) {
        // Aussi chercher dans les references (le message_id peut être dans les references)
        // Essayer avec une recherche partielle
        for (const msgId of cleanMessageIds) {
          const { data: expertEmailPartial } = await supabase
            .from('expert_client_emails')
            .select('id, expert_id, client_id, client_produit_id, message_id')
            .like('message_id', `%${msgId}%`)
            .eq('status', 'sent')
            .limit(1)
            .maybeSingle();

          if (expertEmailPartial) {
            console.log(`✅ Email expert trouvé via recherche partielle: ${expertEmailPartial.id}`);
            return {
              expert_email_id: expertEmailPartial.id,
              expert_id: expertEmailPartial.expert_id,
              client_id: expertEmailPartial.client_id,
              client_produit_id: expertEmailPartial.client_produit_id || undefined
            };
          }
        }
        return null;
      }

      console.log(`✅ Email expert trouvé: ${expertEmail.id} (message_id: ${expertEmail.message_id})`);
      return {
        expert_email_id: expertEmail.id,
        expert_id: expertEmail.expert_id,
        client_id: expertEmail.client_id,
        client_produit_id: expertEmail.client_produit_id || undefined
      };
    } catch (error) {
      console.error('❌ Erreur checkExpertClientEmailMatch:', error);
      return null;
    }
  }

  /**
   * Notifier l'expert qu'un client a répondu à son email
   */
  private static async notifyExpertForClientReply(
    expert_id: string,
    client_id: string,
    email_received_id: string,
    from_email: string
  ): Promise<void> {
    try {
      // Récupérer les infos de l'expert
      const { data: expert, error: expertError } = await supabase
        .from('Expert')
        .select('auth_user_id, name, first_name, last_name, email')
        .eq('id', expert_id)
        .single();

      if (expertError || !expert?.auth_user_id) {
        console.error('❌ Expert non trouvé pour notification:', expertError);
        return;
      }

      // Récupérer les infos du client
      const { data: client } = await supabase
        .from('Client')
        .select('name, first_name, last_name, company_name, email')
        .eq('id', client_id)
        .single();

      const clientName = client?.first_name && client?.last_name
        ? `${client.first_name} ${client.last_name}`
        : client?.name || client?.company_name || 'Client';

      // Créer la notification pour l'expert
      const { error: notifError } = await supabase
        .from('notification')
        .insert({
          user_id: expert.auth_user_id,
          user_type: 'expert',
          title: `📧 Réponse reçue de ${clientName}`,
          message: `${clientName} a répondu à votre email. Vous pouvez consulter sa réponse et lui répondre directement.`,
          notification_type: 'client_reply',
          priority: 'high',
          is_read: false,
          action_url: `/expert/clients/${client_id}`,
          action_data: {
            client_id,
            email_received_id,
            from_email,
            client_name: clientName
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (notifError) {
        console.error('❌ Erreur notification expert:', notifError);
      } else {
        console.log(`✅ Notification expert créée pour réponse client: ${clientName}`);
      }

      // Envoyer un email à l'expert si configuré
      if (expert.email && !expert.email.includes('@profitum.temp')) {
        try {
          const { EmailService } = await import('./EmailService');
          // Email sera envoyé via le système de notifications
        } catch (emailError) {
          console.error('⚠️ Erreur envoi email expert (non bloquant):', emailError);
        }
      }
    } catch (error: any) {
      console.error('❌ Erreur notifyExpertForClientReply:', error);
    }
  }

  /**
   * Notifier l'admin qu'un client a répondu à un expert
   */
  private static async notifyAdminForClientReply(
    client_id: string,
    email_received_id: string
  ): Promise<void> {
    try {
      // Récupérer tous les admins actifs
      const { data: admins } = await supabase
        .from('Admin')
        .select('auth_user_id')
        .eq('is_active', true);

      if (!admins || admins.length === 0) {
        return;
      }

      // Récupérer les infos du client
      const { data: client } = await supabase
        .from('Client')
        .select('name, first_name, last_name, company_name, email')
        .eq('id', client_id)
        .single();

      const clientName = client?.first_name && client?.last_name
        ? `${client.first_name} ${client.last_name}`
        : client?.name || client?.company_name || 'Client';

      // Créer une notification pour chaque admin
      for (const admin of admins) {
        if (!admin.auth_user_id) continue;

        const { error: notifError } = await supabase
          .from('notification')
          .insert({
            user_id: admin.auth_user_id,
            user_type: 'admin',
            title: `📧 Échange client-expert`,
            message: `${clientName} a répondu à un expert. Consultez la fiche client pour voir les échanges.`,
            notification_type: 'client_expert_exchange',
            priority: 'medium',
            is_read: false,
            action_url: `/admin/clients/${client_id}`,
            action_data: {
              client_id,
              email_received_id,
              client_name: clientName
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (notifError) {
          console.error(`❌ Erreur notification admin ${admin.auth_user_id}:`, notifError);
        }
      }

      console.log(`✅ Notifications admin créées pour échange client-expert: ${clientName}`);
    } catch (error: any) {
      console.error('❌ Erreur notifyAdminForClientReply:', error);
    }
  }
}

