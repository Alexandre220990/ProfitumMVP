import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { NOTIFICATION_SLA_CONFIG, calculateSLAStatus } from '../config/notification-sla-config';
import { EmailService } from './EmailService';
import { SecureLinkService } from './secure-link-service';
import { NotificationPreferencesChecker } from './notification-preferences-checker';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface ContactLeadNotification {
  id: string;
  user_id: string;
  user_type: 'admin' | 'expert' | 'client' | 'apporteur';
  notification_type: 'contact_message' | 'lead_to_treat';
  created_at: string;
  metadata: any;
}

/**
 * Service spécialisé pour les rappels automatiques des notifications
 * de type contact_message et lead_to_treat selon les SLA définis
 */
export class ContactLeadReminderService {
  /**
   * Vérifier et envoyer les rappels pour les notifications contact/lead non traitées
   */
  static async checkAndSendReminders(): Promise<void> {
    try {
      console.log('🔔 [ContactLead Reminder] Début de la vérification des rappels...');

      const now = new Date();
      
      // Récupérer toutes les notifications contact_message et lead_to_treat non lues
      const { data: notifications, error } = await supabase
        .from('notification')
        .select('id, user_id, user_type, notification_type, created_at, metadata, is_read, status')
        .in('notification_type', ['contact_message', 'lead_to_treat'])
        .eq('is_read', false)
        .in('status', ['unread', 'active'])
        .limit(500);

      if (error) {
        console.error('❌ [ContactLead Reminder] Erreur récupération notifications:', error);
        return;
      }

      if (!notifications || notifications.length === 0) {
        console.log('ℹ️  [ContactLead Reminder] Aucune notification à vérifier.');
        return;
      }

      const slaConfig = NOTIFICATION_SLA_CONFIG.contact_message;
      let remindersSent = 0;

      for (const notification of notifications) {
        const shouldRemind = this.shouldSendReminder(notification, now, slaConfig);
        
        if (shouldRemind.should && shouldRemind.threshold) {
          await this.sendReminder(notification, shouldRemind.threshold, slaConfig);
          remindersSent++;
        }
      }

      console.log(`✅ [ContactLead Reminder] Vérification terminée - ${remindersSent} rappel(s) envoyé(s)`);
    } catch (error) {
      console.error('❌ [ContactLead Reminder] Erreur lors de la vérification:', error);
    }
  }

  /**
   * Détermine si un rappel doit être envoyé selon les seuils SLA
   */
  static shouldSendReminder(
    notification: ContactLeadNotification,
    now: Date,
    slaConfig: typeof NOTIFICATION_SLA_CONFIG.contact_message
  ): { should: boolean; threshold: '24h' | '48h' | '120h' | null } {
    const metadata = notification.metadata || {};
    const remindersSent = metadata.reminders_sent || {};
    const createdAt = notification.created_at;
    
    if (!createdAt) {
      return { should: false, threshold: null };
    }

    const createdDate = new Date(createdAt);
    const hoursElapsed = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);

    // Vérifier chaque seuil dans l'ordre (du plus récent au plus ancien)
    if (hoursElapsed >= slaConfig.criticalHours && !remindersSent['120h']) {
      return { should: true, threshold: '120h' };
    }
    if (hoursElapsed >= slaConfig.acceptableHours && !remindersSent['48h']) {
      return { should: true, threshold: '48h' };
    }
    if (hoursElapsed >= slaConfig.targetHours && !remindersSent['24h']) {
      return { should: true, threshold: '24h' };
    }

    return { should: false, threshold: null };
  }

  /**
   * Envoie un rappel pour une notification
   */
  static async sendReminder(
    notification: ContactLeadNotification,
    threshold: '24h' | '48h' | '120h',
    slaConfig: typeof NOTIFICATION_SLA_CONFIG.contact_message
  ): Promise<void> {
    try {
      const metadata = notification.metadata || {};
      const escalationLevel = Number(metadata.escalation_level || 0);
      const createdAt = notification.created_at;
      const hoursElapsed = createdAt 
        ? (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
        : 0;

      if (!metadata.contact_message_id || !metadata.name || !metadata.email) {
        console.warn(`⚠️ [ContactLead Reminder] Métadonnées incomplètes pour notification ${notification.id}`);
        return;
      }

      // Déterminer la priorité et le message selon le seuil
      let reminderPriority: 'high' | 'urgent' = 'high';
      let reminderMessage = '';
      const daysElapsed = Math.floor(hoursElapsed / 24);

      if (threshold === '120h') {
        reminderPriority = 'urgent';
        reminderMessage = `🚨 URGENT : ${notification.notification_type === 'lead_to_treat' ? 'Lead' : 'Demande de contact'} non traité(e) depuis ${daysElapsed} jours - ${metadata.name} (${metadata.email})`;
      } else if (threshold === '48h') {
        reminderPriority = 'high';
        reminderMessage = `⚠️ ${notification.notification_type === 'lead_to_treat' ? 'Lead' : 'Demande de contact'} en attente depuis ${daysElapsed} jours - ${metadata.name} (${metadata.email})`;
      } else {
        reminderPriority = 'high';
        reminderMessage = `📋 Rappel : ${notification.notification_type === 'lead_to_treat' ? 'Lead' : 'Demande de contact'} à traiter - ${metadata.name} (${metadata.email})`;
      }

      // Déterminer l'action_url selon le type d'utilisateur
      let actionUrl = `/admin/contact/${metadata.contact_message_id}`;
      if (notification.user_type === 'expert') {
        actionUrl = `/expert/leads/${metadata.contact_message_id}`;
      } else if (notification.user_type === 'client') {
        actionUrl = `/leads/${metadata.contact_message_id}`;
      } else if (notification.user_type === 'apporteur') {
        actionUrl = `/apporteur/leads/${metadata.contact_message_id}`;
      }

      // Créer la notification de rappel
      const { error: reminderError } = await supabase
        .from('notification')
        .insert({
          user_id: notification.user_id,
          user_type: notification.user_type,
          title: reminderMessage,
          message: metadata.message || metadata.contexte || `${notification.notification_type === 'lead_to_treat' ? 'Lead' : 'Contact'} de ${metadata.name}`,
          notification_type: 'reminder',
          priority: reminderPriority,
          is_read: false,
          status: 'unread',
          action_url: actionUrl,
          action_data: {
            contact_message_id: metadata.contact_message_id,
            original_notification_id: notification.id,
            escalation_level: escalationLevel + 1,
            threshold: threshold
          },
          metadata: {
            original_notification_id: notification.id,
            contact_message_id: metadata.contact_message_id,
            name: metadata.name,
            email: metadata.email,
            phone: metadata.phone,
            hours_elapsed: Math.floor(hoursElapsed),
            escalation_level: escalationLevel + 1,
            reminder_type: notification.notification_type,
            threshold: threshold
          }
        });

      if (reminderError) {
        console.error(`❌ [ContactLead Reminder] Erreur création rappel pour ${notification.id}:`, reminderError);
        return;
      }

      // Mettre à jour les métadonnées de la notification originale pour marquer le rappel comme envoyé
      const updatedRemindersSent = {
        ...(metadata.reminders_sent || {}),
        [threshold]: true
      };

      const { error: updateError } = await supabase
        .from('notification')
        .update({
          metadata: {
            ...metadata,
            reminders_sent: updatedRemindersSent,
            escalation_level: escalationLevel + 1,
            last_escalation_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', notification.id);

      if (updateError) {
        console.error(`❌ [ContactLead Reminder] Erreur mise à jour métadonnées pour ${notification.id}:`, updateError);
      }

      // Envoyer un email pour TOUS les rappels (24h, 48h, 120h)
      await ContactLeadReminderService.sendEmailReminder(notification, threshold, daysElapsed, hoursElapsed, metadata);

      console.log(`✅ [ContactLead Reminder] Rappel ${threshold} envoyé pour notification ${notification.id}`);
    } catch (error) {
      console.error(`❌ [ContactLead Reminder] Erreur lors de l'envoi du rappel:`, error);
    }
  }

  /**
   * Envoie un email aux admins pour TOUS les rappels (24h, 48h, 120h)
   */
  static async sendEmailReminder(
    notification: ContactLeadNotification,
    threshold: '24h' | '48h' | '120h',
    daysElapsed: number,
    hoursElapsed: number,
    metadata: any
  ): Promise<void> {
    try {
      // Récupérer les informations de l'admin concerné
      let userEmail = '';
      let userName = '';

      if (notification.user_type === 'admin') {
        const { data: admin } = await supabase
          .from('Admin')
          .select('email, name')
          .eq('auth_user_id', notification.user_id)
          .single();

        if (admin) {
          userEmail = admin.email || '';
          userName = admin.name || '';
        }
      }

      // Si c'est un admin, vérifier les préférences avant d'envoyer l'email
      if (notification.user_type === 'admin' && userEmail) {
        const notificationType = notification.notification_type; // 'contact_message' ou 'lead_to_treat'
        const slaLevel = threshold === '120h' ? 'critical' 
          : threshold === '48h' ? 'acceptable' : 'target';

        // Vérifier les préférences utilisateur
        const shouldSendEmail = await NotificationPreferencesChecker.shouldSendEmail(
          notification.user_id,
          notification.user_type as 'admin',
          notificationType,
          slaLevel
        );

        if (!shouldSendEmail) {
          console.log(`⏭️ [ContactLead Reminder] Email non envoyé - préférences utilisateur désactivées pour ${notificationType} (${threshold})`);
          return;
        }

        // ⚠️ EMAILS GROUPÉS DÉSACTIVÉS - Les rappels sont maintenant intégrés au rapport matinal
        // Les notifications in-app sont toujours créées ci-dessus
        // Plus d'envoi d'email individuel à 9h
        console.log(`✅ [ContactLead Reminder] Notification in-app créée pour ${notificationType} (${threshold}) - Email groupé désactivé`);
      }
    } catch (error) {
      console.error('❌ [ContactLead Reminder] Erreur envoi email rappel:', error);
    }
  }

  /**
   * Génère le template email pour les rappels
   */
  static generateReminderEmailTemplate(
    notification: ContactLeadNotification,
    threshold: '24h' | '48h' | '120h',
    daysElapsed: number,
    hoursElapsed: number,
    metadata: any,
    userName: string,
    adminId?: string,
    adminType?: string
  ): { subject: string; html: string; text: string } {
    const isLead = notification.notification_type === 'lead_to_treat';
    const typeLabel = isLead ? 'Lead' : 'Demande de contact';
    
    // Déterminer le niveau d'urgence et les couleurs
    let urgencyLevel: 'info' | 'warning' | 'critical';
    let urgencyColor: string;
    let urgencyBg: string;
    let icon: string;
    
    if (threshold === '120h') {
      urgencyLevel = 'critical';
      urgencyColor = '#dc2626';
      urgencyBg = '#fef2f2';
      icon = '🚨';
    } else if (threshold === '48h') {
      urgencyLevel = 'warning';
      urgencyColor = '#f59e0b';
      urgencyBg = '#fffbeb';
      icon = '⚠️';
    } else {
      urgencyLevel = 'info';
      urgencyColor = '#3b82f6';
      urgencyBg = '#eff6ff';
      icon = '📋';
    }

    const subject = threshold === '120h' 
      ? `${icon} URGENT : ${typeLabel} non traité depuis ${daysElapsed} jour${daysElapsed > 1 ? 's' : ''}`
      : threshold === '48h'
      ? `${icon} ${typeLabel} en attente depuis ${daysElapsed} jour${daysElapsed > 1 ? 's' : ''}`
      : `${icon} Rappel : ${typeLabel} à traiter`;

    const actionPath = `/admin/contact/${metadata.contact_message_id}`;
    const actionLink = SecureLinkService.generateSmartLinkHTML(
      'Voir et traiter la demande',
      actionPath,
      adminId,
      adminType || 'admin',
      'cta-button'
    );
    
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f3f4f6;
      padding: 0;
      margin: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: linear-gradient(135deg, ${urgencyColor} 0%, ${this.darkenColor(urgencyColor, 20)} 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .header-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .header-subtitle {
      font-size: 16px;
      opacity: 0.95;
      font-weight: 400;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 24px;
      font-weight: 500;
    }
    .alert-box {
      background: ${urgencyBg};
      border-left: 4px solid ${urgencyColor};
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .alert-title {
      font-size: 16px;
      font-weight: 600;
      color: ${urgencyColor};
      margin-bottom: 8px;
    }
    .alert-text {
      font-size: 14px;
      color: #4b5563;
      line-height: 1.6;
    }
    .info-card {
      background: #f9fafb;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
    }
    .info-row {
      display: flex;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #6b7280;
      width: 140px;
      font-size: 14px;
    }
    .info-value {
      color: #1f2937;
      font-size: 14px;
      flex: 1;
    }
    .info-value a {
      color: ${urgencyColor};
      text-decoration: none;
    }
    .info-value a:hover {
      text-decoration: underline;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      margin: 32px 0;
      text-align: center;
      box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
    }
    .cta-container {
      text-align: center;
    }
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.6;
    }
    .footer-link {
      color: ${urgencyColor};
      text-decoration: none;
    }
    .time-badge {
      display: inline-block;
      background: ${urgencyColor};
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 8px;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      .content {
        padding: 30px 20px;
      }
      .info-row {
        flex-direction: column;
      }
      .info-label {
        width: 100%;
        margin-bottom: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="header-icon">${icon}</div>
      <div class="header-title">${typeLabel} en attente</div>
      <div class="header-subtitle">Délai écoulé : ${daysElapsed} jour${daysElapsed > 1 ? 's' : ''}</div>
    </div>
    
    <div class="content">
      <div class="greeting">
        Bonjour ${userName || 'Administrateur'},
      </div>
      
      <div class="alert-box">
        <div class="alert-title">
          ${threshold === '120h' ? 'Action urgente requise' : threshold === '48h' ? 'Action importante requise' : 'Rappel de traitement'}
        </div>
        <div class="alert-text">
          Une ${isLead ? 'demande de lead' : 'demande de contact'} nécessite votre attention depuis ${daysElapsed} jour${daysElapsed > 1 ? 's' : ''} (${Math.floor(hoursElapsed)} heures).
          ${threshold === '120h' ? ' Cette demande dépasse le délai critique et nécessite un traitement immédiat.' : ''}
        </div>
      </div>
      
      <div class="info-card">
        <div class="info-row">
          <div class="info-label">Contact</div>
          <div class="info-value">${metadata.name}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Email</div>
          <div class="info-value"><a href="mailto:${metadata.email}">${metadata.email}</a></div>
        </div>
        ${metadata.phone ? `
        <div class="info-row">
          <div class="info-label">Téléphone</div>
          <div class="info-value"><a href="tel:${metadata.phone}">${metadata.phone}</a></div>
        </div>
        ` : ''}
        ${metadata.subject ? `
        <div class="info-row">
          <div class="info-label">Sujet</div>
          <div class="info-value">${metadata.subject}</div>
        </div>
        ` : ''}
        <div class="info-row">
          <div class="info-label">Délai écoulé</div>
          <div class="info-value">
            ${daysElapsed} jour${daysElapsed > 1 ? 's' : ''}
            <span class="time-badge">${threshold}</span>
          </div>
        </div>
        ${metadata.contexte ? `
        <div class="info-row">
          <div class="info-label">Contexte</div>
          <div class="info-value">${metadata.contexte}</div>
        </div>
        ` : ''}
      </div>
      
      <div class="cta-container">
        ${actionLink}
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-text">
        <p>Cet email a été envoyé automatiquement par le système de rappels Profitum.</p>
        <p style="margin-top: 12px;">
          <a href="${SecureLinkService.getPlatformUrl('admin')}" class="footer-link">Accéder à la plateforme</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
${subject}

Bonjour ${userName || 'Administrateur'},

Une ${isLead ? 'demande de lead' : 'demande de contact'} nécessite votre attention :

Contact : ${metadata.name}
Email : ${metadata.email}
${metadata.phone ? `Téléphone : ${metadata.phone}` : ''}
${metadata.subject ? `Sujet : ${metadata.subject}` : ''}
Délai écoulé : ${daysElapsed} jour${daysElapsed > 1 ? 's' : ''} (${threshold})

${metadata.contexte ? `Contexte : ${metadata.contexte}` : ''}

Voir la demande : ${process.env.FRONTEND_URL || 'https://app.profitum.fr'}${actionPath}
    `.trim();

    return { subject, html, text };
  }

  /**
   * Fonction utilitaire pour assombrir une couleur hex
   */
  private static darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) - amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) - amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) - amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }
}

