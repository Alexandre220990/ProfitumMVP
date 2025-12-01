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
      try {
        const transporter = this.initializeTransporter();
        const textVersion = input.body.replace(/<[^>]*>/g, '');

        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER || 'Profitum <profitum.app@gmail.com>',
          to: prospect.email,
          subject: input.subject,
          html: input.body,
          text: textVersion
        });

        console.log('✅ Email prospect envoyé:', {
          to: prospect.email,
          subject: input.subject,
          messageId: info.messageId
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
            scheduled_email_id: input.scheduled_email_id
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
   */
  static async sendBulkProspectEmails(input: SendBulkProspectEmailsInput): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    errors: Array<{ prospect_id: string; error: string }>;
  }> {
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as Array<{ prospect_id: string; error: string }>
    };

    // Envoyer les emails en parallèle (avec limite pour éviter surcharge)
    const batchSize = 5; // 5 emails à la fois
    for (let i = 0; i < input.prospect_ids.length; i += batchSize) {
      const batch = input.prospect_ids.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (prospectId) => {
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

          return result;
        })
      );

      // Petite pause entre les batches pour éviter surcharge SMTP
      if (i + batchSize < input.prospect_ids.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      success: results.failed === 0,
      ...results
    };
  }

  /**
   * Envoyer les emails programmés qui sont dus
   */
  static async sendScheduledEmailsDue(): Promise<{
    sent: number;
    failed: number;
    errors: Array<{ email_id: string; error: string }>;
  }> {
    try {
      // Récupérer les emails programmés à envoyer
      const { data: scheduledEmails, error } = await supabase
        .from('prospect_emails_to_send_today')
        .select('*')
        .limit(50); // Limite pour éviter surcharge

      if (error || !scheduledEmails || scheduledEmails.length === 0) {
        return { sent: 0, failed: 0, errors: [] };
      }

      const results = {
        sent: 0,
        failed: 0,
        errors: [] as Array<{ email_id: string; error: string }>
      };

      // Envoyer chaque email
      for (const scheduledEmail of scheduledEmails) {
        const result = await this.sendProspectEmail({
          prospect_id: scheduledEmail.prospect_id,
          subject: scheduledEmail.subject,
          body: scheduledEmail.body,
          step: scheduledEmail.step_number,
          scheduled_email_id: scheduledEmail.id
        });

        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push({
            email_id: scheduledEmail.id,
            error: result.error || 'Erreur inconnue'
          });
        }

        // Petite pause entre chaque envoi
        await new Promise(resolve => setTimeout(resolve, 500));
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

