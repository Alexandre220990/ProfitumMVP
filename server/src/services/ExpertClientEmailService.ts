/**
 * Service d'envoi d'emails Experts → Clients
 * Gère l'envoi d'emails uniques et de séquences avec template Profitum
 */

import { createClient } from '@supabase/supabase-js';
import * as nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SendExpertClientEmailInput {
  expert_id: string;
  client_id: string;
  client_produit_id?: string;
  subject: string;
  expert_message: string; // Message personnalisé de l'expert
  use_ai_enrichment?: boolean; // Si true, enrichir avec IA depuis synthèse client
  thread_info?: {
    in_reply_to?: string;
    references?: string[];
    thread_id?: string;
  };
  scheduled_email_id?: string; // Si c'est un email programmé
}

export interface CreateExpertClientEmailSequenceInput {
  expert_id: string;
  client_id: string;
  client_produit_id?: string;
  name?: string;
  start_date?: string;
  steps: Array<{
    step_number: number;
    delay_days: number;
    subject: string;
    expert_message: string;
  }>;
}

export class ExpertClientEmailService {
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
   * Convertir les sauts de ligne en HTML
   */
  private static convertLineBreaksToHTML(text: string): string {
    const hasHTMLTags = /<(p|div|br|h1|h2|h3|h4|h5|h6|ul|ol|li|table|tr|td|th)[>\s]/i.test(text);
    
    if (hasHTMLTags) {
      return text;
    }
    
    const paragraphs = text
      .split(/\n\s*\n/)
      .map(para => {
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
   * Générer le template HTML pour l'email expert → client
   */
  private static generateEmailTemplate(data: {
    expert_name: string;
    expert_company?: string;
    client_name: string;
    client_company?: string;
    produit_name?: string;
    expert_message: string;
  }): string {
    const expertMessageHTML = this.convertLineBreaksToHTML(data.expert_message);
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #059669;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #059669;
      margin-bottom: 10px;
    }
    .intro {
      background-color: #f0fdf4;
      border-left: 4px solid #059669;
      padding: 15px;
      margin-bottom: 25px;
      border-radius: 4px;
    }
    .expert-message {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .expert-signature {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .footer-note {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 12px;
      margin-top: 25px;
      font-size: 14px;
      color: #1e40af;
      border-radius: 4px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Profitum</div>
    </div>
    
    <p>Bonjour ${data.client_name}${data.client_company ? ` (${data.client_company})` : ''},</p>
    
    <div class="intro">
      <p style="margin: 0; font-weight: 600; color: #059669;">
        Profitum est heureux de vous mettre en relation avec <strong>${data.expert_name}</strong>${data.expert_company ? ` (${data.expert_company})` : ''}${data.produit_name ? `, expert spécialisé sur "${data.produit_name}"` : ''}, qui a accepté la prise en charge de votre demande.
      </p>
    </div>
    
    <div class="expert-message">
      <p style="margin-top: 0; font-weight: 600; color: #374151;">Message de ${data.expert_name}${data.expert_company ? ` (${data.expert_company})` : ''} :</p>
      ${expertMessageHTML}
    </div>
    
    <div class="expert-signature">
      <p style="margin: 0;">
        <strong>${data.expert_name}</strong>${data.expert_company ? `<br>${data.expert_company}` : ''}
      </p>
    </div>
    
    <div class="footer-note">
      <p style="margin: 0;">
        💡 <strong>Vous pouvez répondre directement à l'expert en répondant à cet email.</strong>
      </p>
    </div>
    
    <div class="footer">
      <p>Cet email a été envoyé via la plateforme Profitum</p>
      <p>© ${new Date().getFullYear()} Profitum - Tous droits réservés</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Enrichir le message avec IA depuis la synthèse client
   */
  private static async enrichMessageWithAI(
    expert_message: string,
    client_id: string,
    client_produit_id?: string
  ): Promise<string> {
    try {
      // Récupérer les données du client
      const { data: client } = await supabase
        .from('Client')
        .select('*')
        .eq('id', client_id)
        .single();

      if (!client) {
        return expert_message;
      }

      // Récupérer les données du ClientProduitEligible si fourni
      let produitData = null;
      if (client_produit_id) {
        const { data: cpe } = await supabase
          .from('ClientProduitEligible')
          .select(`
            *,
            ProduitEligible:produitId (
              id,
              nom,
              description
            )
          `)
          .eq('id', client_produit_id)
          .single();
        
        produitData = cpe;
      }

      // Construire le contexte pour l'IA
      const context = {
        client_name: client.name || client.company_name || 'Client',
        client_company: client.company_name,
        client_sector: client.secteurActivite,
        produit_name: produitData?.ProduitEligible?.nom,
        produit_description: produitData?.ProduitEligible?.description,
        montant_potentiel: produitData?.montantFinal,
        client_metadata: client.metadata
      };

      // Appeler l'API OpenAI pour enrichir le message
      if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️ OPENAI_API_KEY non configuré, message non enrichi');
        return expert_message;
      }

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const systemPrompt = `Tu es un assistant pour aider un expert à personnaliser son message email à un client sur la plateforme Profitum (courtage en financement professionnel).

Contexte client:
- Nom: ${context.client_name}
- Entreprise: ${context.client_company || 'Non renseigné'}
- Secteur: ${context.client_sector || 'Non renseigné'}
${context.produit_name ? `- Produit concerné: ${context.produit_name}` : ''}
${context.montant_potentiel ? `- Montant potentiel: ${context.montant_potentiel} €` : ''}

Le message de l'expert doit être:
- Professionnel mais chaleureux
- Personnalisé selon le contexte client
- Concis (maximum 3-4 paragraphes)
- Orienté solution et valeur ajoutée
- Sans jargon technique excessif

Enrichis le message de l'expert en le personnalisant selon le contexte, mais garde le ton et l'intention originale.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Message original de l'expert:\n\n${expert_message}\n\nEnrichis ce message en le personnalisant pour ${context.client_name}${context.client_company ? ` (${context.client_company})` : ''}.` }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const enrichedMessage = completion.choices[0]?.message?.content || expert_message;
      return enrichedMessage.trim();
    } catch (error) {
      console.error('❌ Erreur enrichissement IA:', error);
      return expert_message; // Retourner le message original en cas d'erreur
    }
  }

  /**
   * Envoyer un email expert → client
   */
  static async sendExpertClientEmail(
    input: SendExpertClientEmailInput
  ): Promise<{ success: boolean; email_id?: string; error?: string }> {
    try {
      // Récupérer l'expert
      const { data: expert, error: expertError } = await supabase
        .from('Expert')
        .select('*')
        .eq('id', input.expert_id)
        .single();

      if (expertError || !expert) {
        return {
          success: false,
          error: `Expert non trouvé: ${expertError?.message}`
        };
      }

      // Récupérer le client
      const { data: client, error: clientError } = await supabase
        .from('Client')
        .select('*')
        .eq('id', input.client_id)
        .single();

      if (clientError || !client) {
        return {
          success: false,
          error: `Client non trouvé: ${clientError?.message}`
        };
      }

      // Récupérer le produit si fourni
      let produitName = null;
      if (input.client_produit_id) {
        const { data: cpe } = await supabase
          .from('ClientProduitEligible')
          .select(`
            *,
            ProduitEligible:produitId (
              id,
              nom,
              description
            )
          `)
          .eq('id', input.client_produit_id)
          .single();
        
        produitName = cpe?.ProduitEligible?.nom || null;
      }

      // Enrichir le message avec IA si demandé
      let expertMessage = input.expert_message;
      if (input.use_ai_enrichment) {
        expertMessage = await this.enrichMessageWithAI(
          input.expert_message,
          input.client_id,
          input.client_produit_id
        );
      }

      // Construire les noms
      const expertName = expert.first_name && expert.last_name
        ? `${expert.first_name} ${expert.last_name}`
        : expert.name || expert.company_name || 'Expert';
      
      const clientName = client.first_name && client.last_name
        ? `${client.first_name} ${client.last_name}`
        : client.name || client.company_name || 'Client';

      // Générer le template HTML
      const htmlBody = this.generateEmailTemplate({
        expert_name: expertName,
        expert_company: expert.company_name || null,
        client_name: clientName,
        client_company: client.company_name || null,
        produit_name: produitName || null,
        expert_message: expertMessage
      });

      const textVersion = htmlBody.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

      // Envoyer l'email via SMTP
      let info: any;
      try {
        const transporter = this.initializeTransporter();
        
        // Construire les headers pour threading Gmail
        const mailOptions: any = {
          from: process.env.SMTP_FROM || process.env.SMTP_USER || 'Profitum <profitum.app@gmail.com>',
          to: client.email,
          subject: input.subject,
          html: htmlBody,
          text: textVersion,
          replyTo: expert.email // Permettre au client de répondre directement à l'expert
        };

        // Ajouter les headers pour threading si fournis
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

        console.log('✅ Email expert → client envoyé:', {
          expert: expertName,
          client: clientName,
          to: client.email,
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

      // Créer l'enregistrement dans expert_client_emails
      const { data: expertEmail, error: emailError } = await supabase
        .from('expert_client_emails')
        .insert({
          expert_id: input.expert_id,
          client_id: input.client_id,
          client_produit_id: input.client_produit_id || null,
          subject: input.subject,
          body_html: htmlBody,
          body_text: textVersion,
          sent_at: new Date().toISOString(),
          status: 'sent',
          message_id: info.messageId,
          in_reply_to: input.thread_info?.in_reply_to || null,
          references: input.thread_info?.references || null,
          metadata: {
            expert_message_original: input.expert_message,
            expert_message_enriched: input.use_ai_enrichment ? expertMessage : null,
            use_ai_enrichment: input.use_ai_enrichment || false,
            scheduled_email_id: input.scheduled_email_id || null,
            thread_info: input.thread_info || null
          }
        })
        .select()
        .single();

      if (emailError) {
        console.error('❌ Erreur création enregistrement email:', emailError);
        return {
          success: true,
          error: 'Email envoyé mais erreur enregistrement'
        };
      }

      // Si c'était un email programmé, le marquer comme envoyé
      if (input.scheduled_email_id) {
        await supabase
          .from('expert_client_email_scheduled')
          .update({
            status: 'sent',
            expert_email_id: expertEmail.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', input.scheduled_email_id);
      }

      // Notifier l'expert (notification in-app)
      try {
        const { ExpertNotificationService } = await import('./expert-notification-service');
        // Notification sera créée via le système de notifications
      } catch (notifError) {
        console.error('⚠️ Erreur notification expert (non bloquant):', notifError);
      }

      return {
        success: true,
        email_id: expertEmail.id
      };
    } catch (error: any) {
      console.error('❌ Erreur envoi email expert → client:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Créer et programmer une séquence d'emails
   */
  static async createEmailSequence(
    input: CreateExpertClientEmailSequenceInput
  ): Promise<{ success: boolean; sequence_id?: string; error?: string }> {
    try {
      const startDate = input.start_date 
        ? new Date(input.start_date)
        : new Date();

      // Créer la séquence
      const { data: sequence, error: sequenceError } = await supabase
        .from('expert_client_email_sequences')
        .insert({
          expert_id: input.expert_id,
          client_id: input.client_id,
          client_produit_id: input.client_produit_id || null,
          name: input.name || `Séquence ${new Date().toLocaleDateString('fr-FR')}`,
          start_date: startDate.toISOString(),
          status: 'scheduled',
          metadata: {
            steps_count: input.steps.length
          }
        })
        .select()
        .single();

      if (sequenceError || !sequence) {
        return {
          success: false,
          error: `Erreur création séquence: ${sequenceError?.message}`
        };
      }

      // Créer les emails programmés
      let currentDate = new Date(startDate);
      const scheduledEmails = [];

      for (const step of input.steps.sort((a, b) => a.step_number - b.step_number)) {
        if (step.step_number > 1) {
          // Ajouter le délai pour les emails suivants
          currentDate = new Date(currentDate.getTime() + step.delay_days * 24 * 60 * 60 * 1000);
        }

        scheduledEmails.push({
          sequence_id: sequence.id,
          expert_id: input.expert_id,
          client_id: input.client_id,
          client_produit_id: input.client_produit_id || null,
          step_number: step.step_number,
          delay_days: step.delay_days,
          subject: step.subject,
          body_html: '', // Sera généré à l'envoi
          body_text: '',
          scheduled_for: currentDate.toISOString(),
          status: 'scheduled',
          metadata: {
            expert_message: step.expert_message
          }
        });
      }

      const { error: scheduledError } = await supabase
        .from('expert_client_email_scheduled')
        .insert(scheduledEmails);

      if (scheduledError) {
        // Nettoyer la séquence en cas d'erreur
        await supabase
          .from('expert_client_email_sequences')
          .delete()
          .eq('id', sequence.id);
        
        return {
          success: false,
          error: `Erreur création emails programmés: ${scheduledError.message}`
        };
      }

      console.log(`✅ Séquence créée: ${sequence.id} avec ${input.steps.length} emails`);

      return {
        success: true,
        sequence_id: sequence.id
      };
    } catch (error: any) {
      console.error('❌ Erreur création séquence:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }
}
