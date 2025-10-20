/**
 * Service Email RDV - Envoi emails pour les rendez-vous
 * Utilise le NotificationService existant
 */

import { createClient } from '@supabase/supabase-js';
import * as nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';
import Handlebars from 'handlebars';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

export class RDVEmailService {
  private static emailTransporter: nodemailer.Transporter;

  /**
   * Initialiser le transporteur email
   */
  private static initializeTransporter() {
    if (!this.emailTransporter) {
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
  }

  /**
   * Charger et compiler un template HTML
   */
  private static loadTemplate(templateName: string): HandlebarsTemplateDelegate {
    const templatePath = join(__dirname, '../../templates/emails', templateName);
    const templateContent = readFileSync(templatePath, 'utf8');
    
    // Enregistrer helpers Handlebars
    Handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });
    
    return Handlebars.compile(templateContent);
  }

  /**
   * Envoyer email de confirmation RDV au client
   */
  static async sendRDVConfirmationToClient(rdvData: {
    rdv_id: string;
    client_email: string;
    client_name: string;
    company_name: string;
    meetings: Array<{
      expert_name: string;
      scheduled_date: string;
      scheduled_time: string;
      duration_minutes: number;
      meeting_type: string;
      location?: string;
      products: Array<{
        name: string;
        estimated_savings: number;
      }>;
    }>;
    total_savings: number;
    products_count: number;
    temp_password?: string;
    apporteur_name: string;
    apporteur_email: string;
    apporteur_phone?: string;
    platform_url: string;
  }): Promise<boolean> {
    try {
      // ⛔ BLOQUER les emails temporaires pour éviter les bounces
      if (rdvData.client_email.includes('@profitum.temp') || rdvData.client_email.includes('temp_')) {
        console.log(`⛔ Email temporaire bloqué (bounce prevention): ${rdvData.client_email}`);
        return true; // Retourner success pour ne pas bloquer le workflow
      }

      this.initializeTransporter();

      // Charger et compiler le template
      const template = this.loadTemplate('rdv-confirmation-client.html');
      const html = template(rdvData);

      // Configuration email
      const mailOptions = {
        from: `"Profitum - RDV Confirmé" <${process.env.SMTP_USER}>`,
        to: rdvData.client_email,
        subject: `🎉 Vos rendez-vous sont confirmés - ${rdvData.company_name}`,
        html: html
      };

      // Envoyer l'email
      await this.emailTransporter.sendMail(mailOptions);

      console.log(`✅ Email confirmation RDV envoyé à ${rdvData.client_email}`);
      return true;

    } catch (error) {
      console.error('❌ Erreur envoi email confirmation RDV:', error);
      return false;
    }
  }

  /**
   * Envoyer notification RDV à l'expert
   */
  static async sendRDVNotificationToExpert(rdvData: {
    meeting_id: string;
    expert_email: string;
    expert_name: string;
    client_name: string;
    client_email: string;
    client_phone: string;
    company_name: string;
    scheduled_date: string;
    scheduled_time: string;
    duration_minutes: number;
    meeting_type: string;
    location?: string;
    products: Array<{
      name: string;
      estimated_savings: number;
    }>;
    total_savings: number;
    products_count: number;
    qualification_score: number;
    apporteur_name: string;
    platform_url: string;
  }): Promise<boolean> {
    try {
      this.initializeTransporter();

      // Charger et compiler le template
      const template = this.loadTemplate('rdv-notification-expert.html');
      const html = template(rdvData);

      // Configuration email
      const mailOptions = {
        from: `"Profitum - Nouveau RDV" <${process.env.SMTP_USER}>`,
        to: rdvData.expert_email,
        subject: `🆕 Nouveau RDV proposé - ${rdvData.company_name}`,
        html: html,
        priority: 'high' as 'high'
      };

      // Envoyer l'email
      await this.emailTransporter.sendMail(mailOptions);

      console.log(`✅ Email notification RDV envoyé à ${rdvData.expert_email}`);
      return true;

    } catch (error) {
      console.error('❌ Erreur envoi notification expert:', error);
      return false;
    }
  }

  /**
   * Envoyer notification date alternative au client
   */
  static async sendAlternativeDateProposal(rdvData: {
    meeting_id: string;
    client_email: string;
    client_name: string;
    original_date: string;
    original_time: string;
    alternative_date: string;
    alternative_time: string;
    expert_name: string;
    expert_notes?: string;
    products: Array<{
      name: string;
      estimated_savings: number;
    }>;
    apporteur_name: string;
    apporteur_email: string;
    platform_url: string;
  }): Promise<boolean> {
    try {
      this.initializeTransporter();

      // Charger et compiler le template
      const template = this.loadTemplate('rdv-alternative-proposee.html');
      const html = template(rdvData);

      // Configuration email
      const mailOptions = {
        from: `"Profitum - Date Alternative" <${process.env.SMTP_USER}>`,
        to: rdvData.client_email,
        subject: `📅 Nouvelle date proposée par ${rdvData.expert_name}`,
        html: html
      };

      // Envoyer l'email
      await this.emailTransporter.sendMail(mailOptions);

      console.log(`✅ Email date alternative envoyé à ${rdvData.client_email}`);
      return true;

    } catch (error) {
      console.error('❌ Erreur envoi email date alternative:', error);
      return false;
    }
  }

  /**
   * TEST - Envoyer email de test
   */
  static async sendTestEmail(to: string): Promise<boolean> {
    try {
      this.initializeTransporter();

      const mailOptions = {
        from: `"Profitum - Test" <${process.env.SMTP_USER}>`,
        to: to,
        subject: '✅ Test Email RDV - Profitum',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #667eea;">🎉 Email Test Réussi !</h1>
            <p>Ce message confirme que le service email RDV fonctionne correctement.</p>
            <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
            <p><strong>Service :</strong> RDVEmailService</p>
            <div style="background: #f0f4f8; padding: 20px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0;"><strong>Configuration :</strong></p>
              <ul>
                <li>SMTP Host : ${process.env.SMTP_HOST || 'Non configuré'}</li>
                <li>SMTP Port : ${process.env.SMTP_PORT || 'Non configuré'}</li>
                <li>SMTP User : ${process.env.SMTP_USER || 'Non configuré'}</li>
              </ul>
            </div>
            <p style="margin-top: 20px; color: #48bb78;">✅ Service email opérationnel !</p>
          </div>
        `,
        text: 'Email test RDV - Service opérationnel !'
      };

      await this.emailTransporter.sendMail(mailOptions);

      console.log(`✅ Email test envoyé avec succès à ${to}`);
      return true;

    } catch (error) {
      console.error('❌ Erreur envoi email test:', error);
      console.error('Détails erreur:', error);
      return false;
    }
  }
}

