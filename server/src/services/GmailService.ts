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
        'urn:ietf:wg:oauth:2.0:oob'
      );

      this.oauth2Client.setCredentials({
        refresh_token: config.refreshToken
      });
    }

    return this.oauth2Client;
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

          // Extraire l'email du destinataire (notre email)
          const toEmail = toHeader.value.match(/<(.+)>/) 
            ? toHeader.value.match(/<(.+)>/)?.[1] 
            : toHeader.value.split(' ')[0];

          // Chercher le prospect correspondant
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
              results.errors.push(`Erreur stockage email reçu: ${insertError.message}`);
              console.error('❌ Erreur stockage email:', insertError);
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
          updated_at: new Date().toISOString(),
          metadata: {
            cancelled_reason: 'prospect_replied',
            cancelled_at: new Date().toISOString(),
            reply_from: replyFrom
          }
        })
        .eq('prospect_id', prospectId)
        .eq('status', 'pending')
        .select();

      if (cancelError) {
        console.error(`❌ Erreur annulation emails programmés pour prospect ${prospectId}:`, cancelError);
      } else {
        const count = cancelledEmails?.length || 0;
        console.log(`✅ ${count} email(s) programmé(s) annulé(s) pour prospect ${prospectId} (a répondu)`);
      }

      // 2. Mettre à jour le statut du prospect
      const { error: prospectError } = await supabase
        .from('prospects')
        .update({
          emailing_status: 'replied',
          updated_at: new Date().toISOString(),
          metadata: {
            last_reply_from: replyFrom,
            last_reply_at: new Date().toISOString(),
            sequence_stopped: true
          }
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
        ? `Un nouvel email a été reçu de ${prospectName} (${prospect.email}). Un prospect a été créé automatiquement. Consultez l'email et répondez directement.`
        : `Le prospect ${prospectName} (${prospect.email}) a répondu à votre email de prospection. Consultez sa réponse et répondez directement.`;

      // ✅ Créer la notification admin avec lien vers page de synthèse
      const { error: notifError } = await supabase
        .from('AdminNotification')
        .insert({
          type: isNewProspect ? 'prospect_new_email' : 'prospect_reply',
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
          // ✅ Pointer vers la page de synthèse de l'email
          action_url: `/admin/prospection/email-reply/${prospectId}/${emailReceivedId}`,
          action_label: 'Voir l\'email et répondre',
          created_at: new Date().toISOString()
        });

      if (notifError) {
        console.error(`❌ Erreur création notification admin pour prospect ${prospectId}:`, notifError);
      } else {
        console.log(`✅ Notification admin créée pour ${isNewProspect ? 'nouveau prospect' : 'réponse'}: ${prospectName}`);
      }
    } catch (error: any) {
      console.error(`❌ Erreur createAdminNotificationForReply pour ${prospectId}:`, error);
    }
  }
}

