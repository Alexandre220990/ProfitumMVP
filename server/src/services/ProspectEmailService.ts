/**
 * Service d'envoi d'emails pour les prospects
 * Envoi direct via SMTP (sans Instantly/Lemlist)
 */

import { createClient } from '@supabase/supabase-js';
import * as nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SendProspectEmailInput {
  prospect_id: string;
  subject: string;
  body: string;
  step?: number;
  scheduled_email_id?: string; // Si c'est un email programmé
  thread_info?: {
    in_reply_to?: string; // Message-ID de l'email auquel on répond
    references?: string[]; // Liste des Message-IDs du thread
    thread_id?: string; // Thread ID Gmail
  };
}

export interface SendBulkProspectEmailsInput {
  prospect_ids: string[];
  subject: string;
  body: string;
  step?: number;
}

export class ProspectEmailService {
  private static emailTransporter: nodemailer.Transporter | null = null;

  /**
   * Convertir les sauts de ligne en HTML
   * Préserve les balises HTML existantes et convertit uniquement les \n en <br>
   */
  private static convertLineBreaksToHTML(text: string): string {
    // Si le texte contient déjà des balises HTML significatives, ne pas toucher
    const hasHTMLTags = /<(p|div|br|h1|h2|h3|h4|h5|h6|ul|ol|li|table|tr|td|th)[>\s]/i.test(text);
    
    if (hasHTMLTags) {
      // Déjà du HTML, ne pas modifier
      return text;
    }
    
    // Texte brut : convertir les sauts de ligne en <br> et wrapper dans des paragraphes
    // 1. Remplacer les doubles sauts de ligne par des séparateurs de paragraphe
    // 2. Remplacer les sauts de ligne simples par <br>
    const paragraphs = text
      .split(/\n\s*\n/)  // Séparer par double saut de ligne
      .map(para => {
        // Pour chaque paragraphe, remplacer les sauts de ligne simples par <br>
        const withBreaks = para
          .trim()
          .replace(/\n/g, '<br>');
        return withBreaks ? `<p style="margin: 0 0 1em 0;">${withBreaks}</p>` : '';
      })
      .filter(p => p)
      .join('');
    
    return paragraphs || text;
  }

  /**
   * Initialiser le transporteur email
   */
  private static initializeTransporter(): nodemailer.Transporter {
    if (!this.emailTransporter) {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('Variables SMTP non configurées (SMTP_USER, SMTP_PASS)');
      }

      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
    return this.emailTransporter;
  }

  /**
   * Envoyer un email à un prospect
   */
  static async sendProspectEmail(input: SendProspectEmailInput): Promise<{ success: boolean; email_id?: string; error?: string }> {
    try {
      // Récupérer le prospect
      const { data: prospect, error: prospectError } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', input.prospect_id)
        .single();

      if (prospectError || !prospect) {
        return {
          success: false,
          error: `Prospect non trouvé: ${prospectError?.message}`
        };
      }

      // Vérifier la validité de l'email
      if (prospect.email_validity === 'invalid') {
        return {
          success: false,
          error: 'Email invalide (marqué comme invalid)'
        };
      }

      // Envoyer l'email via SMTP
      let info: any;
      try {
        const transporter = this.initializeTransporter();
        
        // ✅ Convertir les sauts de ligne en HTML si nécessaire
        const htmlBody = this.convertLineBreaksToHTML(input.body);
        const textVersion = htmlBody.replace(/<[^>]*>/g, '');

        // ✅ Construire les headers pour threads Gmail (conversations groupées)
        const mailOptions: any = {
          from: process.env.SMTP_FROM || process.env.SMTP_USER || 'Profitum <profitum.app@gmail.com>',
          to: prospect.email,
          subject: input.subject,
          html: htmlBody,
          text: textVersion
        };

        // ✅ Ajouter les headers pour threading si fournis
        if (input.thread_info) {
          const headers: any = {};
          
          if (input.thread_info.in_reply_to) {
            headers['In-Reply-To'] = input.thread_info.in_reply_to;
          }
          
          if (input.thread_info.references && input.thread_info.references.length > 0) {
            headers['References'] = input.thread_info.references.join(' ');
          }

          if (Object.keys(headers).length > 0) {
            mailOptions.headers = headers;
          }
        }

        info = await transporter.sendMail(mailOptions);

        console.log('✅ Email prospect envoyé:', {
          to: prospect.email,
          subject: input.subject,
          messageId: info.messageId,
          threadInfo: input.thread_info ? 'Conversation groupée' : 'Nouveau thread'
        });
      } catch (emailError: any) {
        console.error('❌ Erreur envoi email:', emailError);
        return {
          success: false,
          error: `Échec envoi email: ${emailError.message}`
        };
      }

      // Créer l'enregistrement dans prospects_emails
      const { data: prospectEmail, error: emailError } = await supabase
        .from('prospects_emails')
        .insert({
          prospect_id: input.prospect_id,
          step: input.step || 1,
          subject: input.subject,
          body: input.body,
          sent_at: new Date().toISOString(),
          opened: false,
          clicked: false,
          replied: false,
          email_provider: 'manual',
          metadata: {
            sent_via: 'app_direct',
            scheduled_email_id: input.scheduled_email_id,
            message_id: info.messageId, // ✅ Stocker le message-id pour threading
            thread_info: input.thread_info || null
          }
        })
        .select()
        .single();

      if (emailError) {
        console.error('Erreur création enregistrement email:', emailError);
        // L'email a été envoyé mais l'enregistrement a échoué
        return {
          success: true,
          error: 'Email envoyé mais erreur enregistrement'
        };
      }

      // Si c'était un email programmé, le marquer comme envoyé
      if (input.scheduled_email_id) {
        await supabase
          .from('prospect_email_scheduled')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            prospect_email_id: prospectEmail.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', input.scheduled_email_id);
      }

      // Mettre à jour le statut du prospect
      await supabase
        .from('prospects')
        .update({
          emailing_status: 'sent',
          updated_at: new Date().toISOString()
        })
        .eq('id', input.prospect_id);

      return {
        success: true,
        email_id: prospectEmail.id
      };
    } catch (error: any) {
      console.error('Erreur envoi email prospect:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Envoyer des emails en bulk à plusieurs prospects
   * Protection anti-blacklistage : délais aléatoires, rate limiting
   */
  static async sendBulkProspectEmails(input: SendBulkProspectEmailsInput): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    errors: Array<{ prospect_id: string; error: string }>;
  }> {
    const { 
      getRandomEmailDelay, 
      isBusinessHours,
      canSendEmail 
    } = await import('../utils/email-sending-utils');

    // Vérifier les heures de travail
    if (!isBusinessHours(new Date())) {
      throw new Error('Les emails ne peuvent être envoyés que pendant les heures de travail (9h-18h, lundi-vendredi)');
    }

    // Récupérer les emails envoyés dans la dernière heure pour rate limiting
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentEmails } = await supabase
      .from('prospects_emails')
      .select('sent_at')
      .gte('sent_at', oneHourAgo)
      .not('sent_at', 'is', null);

    const emailsSentInLastHour = recentEmails?.length || 0;
    const MAX_EMAILS_PER_HOUR = 12;

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as Array<{ prospect_id: string; error: string }>
    };

    // Envoyer les emails séquentiellement avec délais aléatoires (pas en parallèle pour éviter blacklistage)
    for (const prospectId of input.prospect_ids) {
      // Vérifier le rate limiting
      if (!canSendEmail(emailsSentInLastHour + results.sent, MAX_EMAILS_PER_HOUR)) {
        console.log(`⏸️  Rate limit atteint (${emailsSentInLastHour + results.sent}/${MAX_EMAILS_PER_HOUR} emails/heure). Arrêt de l'envoi bulk.`);
        results.errors.push({
          prospect_id: prospectId,
          error: `Rate limit atteint. ${input.prospect_ids.length - results.sent - results.failed} email(s) non envoyé(s).`
        });
        break;
      }

      const result = await this.sendProspectEmail({
        prospect_id: prospectId,
        subject: input.subject,
        body: input.body,
        step: input.step
      });

      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        results.errors.push({
          prospect_id: prospectId,
          error: result.error || 'Erreur inconnue'
        });
      }

      // Délai aléatoire entre chaque envoi (5-60 secondes) pour comportement humain
      // Sauf pour le dernier email
      if (prospectId !== input.prospect_ids[input.prospect_ids.length - 1]) {
        const delay = getRandomEmailDelay();
        const delaySeconds = Math.round(delay / 1000);
        console.log(`⏳ Pause aléatoire: ${delaySeconds}s avant le prochain envoi...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: results.failed === 0,
      ...results
    };
  }

  /**
   * Envoyer les emails programmés qui sont dus
   * Protection anti-blacklistage : délais aléatoires, heures de travail, rate limiting
   */
  static async sendScheduledEmailsDue(): Promise<{
    sent: number;
    failed: number;
    errors: Array<{ email_id: string; error: string }>;
  }> {
    try {
      const { 
        getRandomEmailDelay, 
        isBusinessHours, 
        adjustToBusinessHours,
        canSendEmail 
      } = await import('../utils/email-sending-utils');

      // Récupérer les emails programmés à envoyer
      const { data: scheduledEmails, error } = await supabase
        .from('prospect_emails_to_send_today')
        .select('*')
        .limit(50); // Limite pour éviter surcharge

      if (error || !scheduledEmails || scheduledEmails.length === 0) {
        return { sent: 0, failed: 0, errors: [] };
      }

      // Récupérer les emails envoyés dans la dernière heure pour rate limiting
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentEmails } = await supabase
        .from('prospects_emails')
        .select('sent_at')
        .gte('sent_at', oneHourAgo)
        .not('sent_at', 'is', null);

      const emailsSentInLastHour = recentEmails?.length || 0;
      const MAX_EMAILS_PER_HOUR = 12; // Limite pour éviter blacklistage

      const results = {
        sent: 0,
        failed: 0,
        errors: [] as Array<{ email_id: string; error: string }>
      };

      // Filtrer les emails qui sont dans les heures de travail
      const now = new Date();
      const emailsToSend = scheduledEmails.filter(email => {
        const scheduledDate = new Date(email.scheduled_for);
        
        // Si l'email est programmé pour maintenant ou dans le passé
        if (scheduledDate <= now) {
          // Vérifier si on est dans les heures de travail
          if (!isBusinessHours(now)) {
            // Ajuster à la prochaine heure de travail
            const adjustedDate = adjustToBusinessHours(now);
            // Mettre à jour la date programmée pour le prochain créneau
            supabase
              .from('prospect_email_scheduled')
              .update({ scheduled_for: adjustedDate.toISOString() })
              .eq('id', email.id)
              .then(() => {
                console.log(`📅 Email ${email.id} reporté aux heures de travail: ${adjustedDate.toISOString()}`);
              });
            return false; // Ne pas envoyer maintenant
          }
          return true; // Dans les heures de travail, on peut envoyer
        }
        return false; // Pas encore l'heure
      });

      // Envoyer chaque email avec rate limiting et délais aléatoires
      for (const scheduledEmail of emailsToSend) {
        // Vérifier le rate limiting
        if (!canSendEmail(emailsSentInLastHour + results.sent, MAX_EMAILS_PER_HOUR)) {
          console.log(`⏸️  Rate limit atteint (${emailsSentInLastHour + results.sent}/${MAX_EMAILS_PER_HOUR} emails/heure). Report des emails restants.`);
          // Reporter les emails restants au prochain créneau disponible
          const nextAvailableTime = adjustToBusinessHours(
            new Date(Date.now() + 60 * 60 * 1000) // Dans 1 heure
          );
          await supabase
            .from('prospect_email_scheduled')
            .update({ scheduled_for: nextAvailableTime.toISOString() })
            .eq('id', scheduledEmail.id);
          continue;
        }

        const result = await this.sendProspectEmail({
          prospect_id: scheduledEmail.prospect_id,
          subject: scheduledEmail.subject,
          body: scheduledEmail.body,
          step: scheduledEmail.step_number,
          scheduled_email_id: scheduledEmail.id
        });

        if (result.success) {
          results.sent++;
          console.log(`✅ Email envoyé (${results.sent}/${MAX_EMAILS_PER_HOUR} cette heure)`);
        } else {
          results.failed++;
          results.errors.push({
            email_id: scheduledEmail.id,
            error: result.error || 'Erreur inconnue'
          });
        }

        // Délai aléatoire entre chaque envoi (5-60 secondes) pour comportement humain
        // Sauf pour le dernier email
        if (scheduledEmail !== emailsToSend[emailsToSend.length - 1]) {
          const delay = getRandomEmailDelay();
          const delaySeconds = Math.round(delay / 1000);
          console.log(`⏳ Pause aléatoire: ${delaySeconds}s avant le prochain envoi...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      return results;
    } catch (error: any) {
      console.error('Erreur envoi emails programmés:', error);
      return {
        sent: 0,
        failed: 0,
        errors: [{ email_id: 'unknown', error: error.message }]
      };
    }
  }
}

