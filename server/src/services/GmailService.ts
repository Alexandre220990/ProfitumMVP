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
          // Récupérer les détails de l'email
          const { data: messageData } = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'metadata',
            metadataHeaders: ['From', 'To', 'Subject', 'In-Reply-To', 'References']
          });

          const headers = messageData.payload?.headers || [];
          const fromHeader = headers.find((h: any) => h.name === 'From');
          const toHeader = headers.find((h: any) => h.name === 'To');
          const inReplyTo = headers.find((h: any) => h.name === 'In-Reply-To');
          const references = headers.find((h: any) => h.name === 'References');

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
          const match = await this.checkProspectEmailMatch(fromEmail, toEmail || '');

          if (match) {
            // Mettre à jour le statut replied
            const { error: updateError } = await supabase
              .from('prospects_emails')
              .update({
                replied: true,
                replied_at: new Date(messageData.internalDate 
                  ? parseInt(messageData.internalDate) 
                  : Date.now()).toISOString(),
                metadata: {
                  gmail_message_id: message.id,
                  reply_from: fromEmail,
                  reply_subject: headers.find((h: any) => h.name === 'Subject')?.value || ''
                }
              })
              .eq('id', match.emailId);

            if (updateError) {
              results.errors.push(`Erreur mise à jour email ${match.emailId}: ${updateError.message}`);
            } else {
              results.updated++;
              console.log(`✅ Réponse détectée pour prospect ${match.prospectId}, email ${match.emailId}`);
              
              // ✅ Arrêter automatiquement la séquence pour ce prospect
              await this.stopProspectSequence(match.prospectId, fromEmail);
              
              // ✅ Créer une notification admin
              await this.createAdminNotificationForReply(match.prospectId, fromEmail, message.id || 'unknown');
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
    replyFrom: string,
    gmailMessageId: string
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

      // Créer la notification admin
      const { error: notifError } = await supabase
        .from('AdminNotification')
        .insert({
          type: 'prospect_reply',
          title: `📧 Réponse reçue de ${prospectName}`,
          message: `Le prospect ${prospectName} (${prospect.email}) a répondu à votre email de prospection.`,
          priority: 'high',
          status: 'unread',
          is_read: false,
          metadata: {
            prospect_id: prospectId,
            prospect_email: prospect.email,
            prospect_name: prospectName,
            reply_from: replyFrom,
            gmail_message_id: gmailMessageId,
            replied_at: new Date().toISOString()
          },
          action_url: `/admin/prospection?prospect_id=${prospectId}`,
          action_label: 'Voir le prospect',
          created_at: new Date().toISOString()
        });

      if (notifError) {
        console.error(`❌ Erreur création notification admin pour prospect ${prospectId}:`, notifError);
      } else {
        console.log(`✅ Notification admin créée pour réponse de ${prospectName}`);
      }
    } catch (error: any) {
      console.error(`❌ Erreur createAdminNotificationForReply pour ${prospectId}:`, error);
    }
  }
}

