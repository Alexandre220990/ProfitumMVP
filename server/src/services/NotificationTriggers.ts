import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * ============================================================================
 * SERVICE CENTRALISÉ DE NOTIFICATIONS MÉTIER
 * ============================================================================
 * 
 * Ce service gère TOUTES les notifications automatiques de l'application.
 * Il est appelé par les routes lors d'événements métier importants.
 * 
 * Types de notifications :
 * - CLIENT : 5 types
 * - EXPERT : 5 types
 * - ADMIN : 8 types
 * - APPORTEUR : 6 types
 * 
 * Date: 27 Octobre 2025
 */

const PRIORITY_SLA_MAP: Record<'urgent' | 'high' | 'medium' | 'low', number> = {
  urgent: 24,
  high: 48,
  medium: 72,
  low: 96
};

type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

interface NotificationData {
  user_id: string;
  user_type: 'client' | 'expert' | 'admin' | 'apporteur';
  title: string;
  message: string;
  notification_type: string;
  priority: NotificationPriority;
  event_id?: string;
  event_title?: string;
  metadata?: any;
  action_url?: string;
  action_data?: any;
}

interface AdminNotificationData {
  type: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  metadata?: any;
  action_url?: string;
  action_label?: string;
}

export class NotificationTriggers {
  private static readonly SUPPORT_EMAIL = 'support@profitum.fr';

  private static normalizeSlug(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    const slug = value
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return slug || null;
  }
  
  // ============================================================================
  // HELPERS PRIVÉS
  // ============================================================================
  
  private static buildMetadata(
    metadata: Record<string, any> | undefined,
    priority: NotificationPriority
  ): Record<string, any> {
    const safeMetadata =
      metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? { ...metadata } : {};

    const triggeredAt: string =
      safeMetadata.triggered_at ??
      new Date().toISOString();

    const slaHours: number =
      safeMetadata.sla_hours ??
      PRIORITY_SLA_MAP[priority] ??
      PRIORITY_SLA_MAP.medium;

    const dueAt: string =
      safeMetadata.due_at ??
      new Date(new Date(triggeredAt).getTime() + slaHours * 60 * 60 * 1000).toISOString();

    return {
      ...safeMetadata,
      triggered_at: triggeredAt,
      sla_hours: slaHours,
      due_at: dueAt,
      escalation_level: safeMetadata.escalation_level ?? 0
    };
  }

  private static getProductTagFromValue(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    const cleaned = value.toString().trim();
    if (!cleaned) {
      return null;
    }

    // Retirer d'éventuels badges déjà présents et caractères spéciaux
    const withoutBadge = cleaned.replace(/^\[[^\]]+\]\s*/, '');
    const alphanumericMatch = withoutBadge.match(/[A-Za-z0-9]{2,}/);

    if (!alphanumericMatch) {
      return null;
    }

    return alphanumericMatch[0].toUpperCase();
  }

  private static computeProductTag(
    originalTitle: string,
    metadata: Record<string, any>,
    eventTitle?: string | null
  ): string | null {
    // Si le titre possède déjà un badge, ne rien faire
    if (/^\[[^\]]+\]/.test(originalTitle)) {
      return null;
    }

    const candidateKeys = [
      'product_tag',
      'produit',
      'product',
      'product_name',
      'product_key',
      'produit_slug',
      'dossier_code',
      'dossier',
      'dossier_nom'
    ];

    for (const key of candidateKeys) {
      if (metadata && typeof metadata[key] === 'string') {
        const tag = this.getProductTagFromValue(metadata[key]);
        if (tag) {
          return tag;
        }
      }
    }

    if (eventTitle) {
      const tag = this.getProductTagFromValue(eventTitle);
      if (tag) {
        return tag;
      }
    }

    return null;
  }

  private static decorateTitleWithProductTag(
    title: string,
    tag: string | null
  ): string {
    if (!tag || /^\[[^\]]+\]/.test(title)) {
      return title;
    }

    return `[${tag}] ${title}`;
  }

  /**
   * Créer une notification standard (client/expert/apporteur)
   */
  private static async createNotification(data: NotificationData): Promise<boolean> {
    try {
      const metadata = this.buildMetadata(data.metadata, data.priority);
      const actionData =
        data.action_data && typeof data.action_data === 'object' ? data.action_data : {};

      const productTag = this.computeProductTag(data.title, metadata, data.event_title);
      const decoratedTitle = this.decorateTitleWithProductTag(data.title, productTag);

      const { data: notification, error } = await supabase
        .from('notification')
        .insert({
          user_id: data.user_id,
          user_type: data.user_type,
          title: decoratedTitle,
          message: data.message,
          notification_type: data.notification_type,
          priority: data.priority,
          event_id: data.event_id,
          event_title: data.event_title,
          status: 'unread',
          is_read: false,
          action_url: data.action_url || null,
          action_data: actionData,
          metadata,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création notification:', error);
        return false;
      }

      console.log(`✅ Notification créée: ${data.notification_type} pour ${data.user_type} ${data.user_id}`);

      // ✅ Envoyer automatiquement email et push notification
      await this.sendNotificationChannels(notification, data);

      return true;
    } catch (error) {
      console.error('❌ Erreur createNotification:', error);
      return false;
    }
  }

  /**
   * Créer une notification admin (table AdminNotification)
   */
  private static async createAdminNotification(data: AdminNotificationData): Promise<boolean> {
    try {
      const metadata = this.buildMetadata(data.metadata, data.priority);

      const { data: adminNotification, error } = await supabase
        .from('AdminNotification')
        .insert({
          type: data.type,
          title: data.title,
          message: data.message,
          priority: data.priority,
          status: 'unread',
          is_read: false,
          metadata,
          action_url: data.action_url,
          action_label: data.action_label,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création notification admin:', error);
        return false;
      }

      console.log(`✅ Notification admin créée: ${data.type}`);

      // ✅ Envoyer automatiquement email et push à tous les admins
      await this.sendAdminNotificationChannels(adminNotification, data);

      return true;
    } catch (error) {
      console.error('❌ Erreur createAdminNotification:', error);
      return false;
    }
  }

  // ============================================================================
  // ENVOI AUTOMATIQUE EMAIL ET PUSH
  // ============================================================================

  /**
   * Envoyer la notification via tous les canaux (email + push)
   */
  private static async sendNotificationChannels(notification: any, data: NotificationData): Promise<void> {
    try {
      // 1. Envoyer l'email (toujours)
      await this.sendNotificationEmail(notification, data);

      // 2. Envoyer la push notification (si device enregistré)
      await this.sendNotificationPush(notification, data);
    } catch (error) {
      console.error('❌ Erreur envoi canaux notification:', error);
      // Ne pas faire échouer la création de la notification si l'envoi échoue
    }
  }

  /**
   * Envoyer un email pour la notification
   */
  private static async sendNotificationEmail(notification: any, data: NotificationData): Promise<void> {
    try {
      const { EmailService } = await import('./EmailService');
      
      // Récupérer l'email de l'utilisateur
      let userEmail = '';
      
      if (data.user_type === 'admin') {
        const { data: admin } = await supabase
          .from('Admin')
          .select('email')
          .eq('auth_user_id', data.user_id)
          .single();
        userEmail = admin?.email || '';
      } else if (data.user_type === 'expert') {
        const { data: expert } = await supabase
          .from('Expert')
          .select('email')
          .eq('auth_user_id', data.user_id)
          .single();
        userEmail = expert?.email || '';
      } else if (data.user_type === 'client') {
        const { data: client } = await supabase
          .from('Client')
          .select('email')
          .eq('id', data.user_id)
          .single();
        userEmail = client?.email || '';
      } else if (data.user_type === 'apporteur') {
        const { data: apporteur } = await supabase
          .from('ApporteurAffaires')
          .select('email')
          .eq('id', data.user_id)
          .single();
        userEmail = apporteur?.email || '';
      }

      if (!userEmail) {
        console.warn(`⚠️ Email non trouvé pour ${data.user_type}:${data.user_id}`);
        return;
      }

      // Bloquer les emails temporaires
      if (userEmail.includes('@profitum.temp') || userEmail.includes('temp_')) {
        console.log(`⛔ Email temporaire bloqué: ${userEmail}`);
        return;
      }

      // Générer le template email
      const subject = `🔔 ${data.title}`;
      const html = this.generateEmailTemplate(notification, data);
      const text = `${data.title}\n\n${data.message}${data.action_url ? `\n\nVoir les détails: ${process.env.FRONTEND_URL || 'https://app.profitum.fr'}${data.action_url}` : ''}`;

      // Envoyer l'email
      await EmailService.sendDailyReportEmail(userEmail, subject, html, text);
      
      console.log(`✅ Email notification envoyé à ${userEmail}`);
    } catch (error) {
      console.error('❌ Erreur envoi email notification:', error);
    }
  }

  /**
   * Envoyer une push notification (si device enregistré)
   */
  private static async sendNotificationPush(notification: any, data: NotificationData): Promise<void> {
    try {
      // Récupérer les devices actifs de l'utilisateur
      const { data: devices, error } = await supabase
        .from('UserDevices')
        .select('id, device_token, active, device_type')
        .eq('user_id', data.user_id)
        .eq('active', true)
        .eq('device_type', 'web');

      if (error || !devices || devices.length === 0) {
        // Pas de device enregistré, pas de push
        return;
      }

      // Importer web-push
      const webpush = await import('web-push');

      // Récupérer les clés VAPID depuis les variables d'environnement
      const vapidPublicKey = process.env.FIREBASE_VAPID_KEY || process.env.VITE_FIREBASE_VAPID_KEY;
      const vapidPrivateKey = process.env.FIREBASE_VAPID_PRIVATE_KEY;

      if (!vapidPublicKey || !vapidPrivateKey) {
        console.warn('⚠️ Clés VAPID non configurées, push notifications désactivées');
        return;
      }

      webpush.setVapidDetails(
        'mailto:support@profitum.fr',
        vapidPublicKey,
        vapidPrivateKey
      );

      // Envoyer à tous les devices actifs
      const pushPromises = devices.map(async (device) => {
        try {
          if (!device.device_token) {
            return;
          }

          const subscription = JSON.parse(device.device_token);
          
          const payload = JSON.stringify({
            title: data.title,
            body: data.message,
            icon: '/images/logo.png',
            badge: '/images/logo.png',
            tag: data.notification_type || 'default',
            requireInteraction: data.priority === 'urgent' || data.priority === 'high',
            data: {
              notification_id: notification.id,
              notification_type: data.notification_type,
              action_url: data.action_url || '/',
              priority: data.priority
            }
          });

          await webpush.sendNotification(subscription, payload);
          console.log(`✅ Push envoyée à device ${device.id}`);
        } catch (error: any) {
          console.error(`❌ Erreur push device ${device.id}:`, error?.message || error);
          
          // Si le token est invalide, désactiver le device
          if (error?.statusCode === 410 || error?.statusCode === 404) {
            await supabase
              .from('UserDevices')
              .update({ active: false })
              .eq('id', device.id);
            console.log(`🔒 Device ${device.id} désactivé (token invalide)`);
          }
        }
      });

      await Promise.allSettled(pushPromises);
    } catch (error) {
      console.error('❌ Erreur envoi push notification:', error);
    }
  }

  /**
   * Envoyer les notifications admin à tous les admins (email + push)
   */
  private static async sendAdminNotificationChannels(adminNotification: any, data: AdminNotificationData): Promise<void> {
    try {
      // Récupérer tous les admins actifs
      const { data: admins, error } = await supabase
        .from('Admin')
        .select('id, auth_user_id, email')
        .eq('is_active', true)
        .not('auth_user_id', 'is', null);

      if (error || !admins || admins.length === 0) {
        console.warn('⚠️ Aucun admin actif trouvé');
        return;
      }

      // Envoyer à chaque admin
      for (const admin of admins) {
        if (!admin.auth_user_id || !admin.email) continue;

        // Envoyer l'email
        try {
          const { EmailService } = await import('./EmailService');
          
          // Bloquer les emails temporaires
          if (admin.email.includes('@profitum.temp') || admin.email.includes('temp_')) {
            continue;
          }

          const subject = `🔔 ${data.title}`;
          const html = this.generateAdminEmailTemplate(adminNotification, data);
          const text = `${data.title}\n\n${data.message}${data.action_url ? `\n\nVoir les détails: ${process.env.FRONTEND_URL || 'https://app.profitum.fr'}${data.action_url}` : ''}`;

          await EmailService.sendDailyReportEmail(admin.email, subject, html, text);
          console.log(`✅ Email admin envoyé à ${admin.email}`);
        } catch (error) {
          console.error(`❌ Erreur envoi email admin ${admin.id}:`, error);
        }

        // Envoyer la push notification
        try {
          await this.sendNotificationPush(
            { id: adminNotification.id, ...adminNotification },
            {
              user_id: admin.auth_user_id,
              user_type: 'admin',
              title: data.title,
              message: data.message,
              notification_type: data.type,
              priority: data.priority,
              action_url: data.action_url
            }
          );
        } catch (error) {
          console.error(`❌ Erreur envoi push admin ${admin.id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Erreur envoi canaux notification admin:', error);
    }
  }

  /**
   * Générer le template HTML pour l'email de notification
   */
  private static generateEmailTemplate(notification: any, data: NotificationData): string {
    const { SecureLinkService } = require('./secure-link-service');
    // Déterminer le type d'utilisateur depuis la notification
    const userType = notification.user_type || data.user_type || 'client';
    const frontendUrl = SecureLinkService.getPlatformUrl(userType as 'admin' | 'expert' | 'client' | 'apporteur');
    const actionUrl = data.action_url ? `${frontendUrl}${data.action_url}` : null;
    
    const priorityColors: Record<string, string> = {
      urgent: '#dc2626',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#6b7280'
    };
    
    const priorityColor = priorityColors[data.priority] || priorityColors.medium;

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, ${priorityColor} 0%, ${this.darkenColor(priorityColor, 20)} 100%); color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700;">${data.title}</h1>
    </div>
    
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #1f2937; margin-bottom: 24px;">${data.message}</p>
      
      ${actionUrl ? `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${actionUrl}" style="display: inline-block; padding: 14px 28px; background-color: ${priorityColor}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Voir les détails
        </a>
      </div>
      ` : ''}
      
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-top: 24px;">
        <p style="font-size: 12px; color: #6b7280; margin: 0; line-height: 1.6;">
          <strong>Type:</strong> ${data.notification_type}<br>
          <strong>Priorité:</strong> ${data.priority}<br>
          ${data.event_title ? `<strong>Événement:</strong> ${data.event_title}<br>` : ''}
        </p>
      </div>
    </div>
    
    <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 13px; color: #6b7280; margin: 0; line-height: 1.6;">
        Cet email a été envoyé automatiquement par Profitum.<br>
        Vous recevez cet email car vous avez une notification dans votre centre de notifications.
      </p>
      <p style="font-size: 13px; color: #6b7280; margin-top: 12px;">
        <a href="${frontendUrl}" style="color: ${priorityColor}; text-decoration: none;">Accéder à la plateforme</a>
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Générer le template HTML pour l'email de notification admin
   */
  private static generateAdminEmailTemplate(adminNotification: any, data: AdminNotificationData): string {
    const { SecureLinkService } = require('./secure-link-service');
    const frontendUrl = SecureLinkService.getPlatformUrl('admin');
    const actionUrl = data.action_url ? `${frontendUrl}${data.action_url}` : null;
    
    const priorityColors: Record<string, string> = {
      urgent: '#dc2626',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#6b7280'
    };
    
    const priorityColor = priorityColors[data.priority] || priorityColors.medium;

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, ${priorityColor} 0%, ${this.darkenColor(priorityColor, 20)} 100%); color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700;">${data.title}</h1>
    </div>
    
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #1f2937; margin-bottom: 24px;">${data.message}</p>
      
      ${actionUrl ? `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${actionUrl}" style="display: inline-block; padding: 14px 28px; background-color: ${priorityColor}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          ${data.action_label || 'Voir les détails'}
        </a>
      </div>
      ` : ''}
      
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-top: 24px;">
        <p style="font-size: 12px; color: #6b7280; margin: 0; line-height: 1.6;">
          <strong>Type:</strong> ${data.type}<br>
          <strong>Priorité:</strong> ${data.priority}<br>
        </p>
      </div>
    </div>
    
    <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 13px; color: #6b7280; margin: 0; line-height: 1.6;">
        Notification admin automatique - Profitum<br>
        <a href="${frontendUrl}/admin" style="color: ${priorityColor}; text-decoration: none;">Accéder au panneau admin</a>
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
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

  // ============================================================================
  // NOTIFICATIONS CLIENT (5 types)
  // ============================================================================

  /**
   * CLIENT 1: Changement de statut d'un dossier
   */
  static async onDossierStatusChange(
    clientId: string,
    dossier: { id: string; nom: string; statut: string; produit?: string }
  ): Promise<boolean> {
    const statusLabels: Record<string, string> = {
      'en_cours': '🟡 En cours',
      'documents_collecte': '📄 Documents en collecte',
      'en_attente_validation': '⏳ En attente de validation',
      'valide': '✅ Validé',
      'termine': '🎉 Terminé',
      'refuse': '❌ Refusé'
    };

    const statusLabel = statusLabels[dossier.statut] || dossier.statut;
    const priority = dossier.statut === 'valide' || dossier.statut === 'termine' ? 'high' : 'medium';

    return this.createNotification({
      user_id: clientId,
      user_type: 'client',
      title: `Dossier ${dossier.nom} mis à jour`,
      message: `Le statut de votre dossier est maintenant : ${statusLabel}`,
      notification_type: 'dossier_status_change',
      priority: priority,
      event_id: dossier.id,
      event_title: dossier.nom,
      metadata: {
        dossier_id: dossier.id,
        nouveau_statut: dossier.statut,
        produit: dossier.produit
      }
    });
  }

  /**
   * CLIENT 2: Rappel de paiement
   */
  static async onPaymentReminder(
    clientId: string,
    payment: { id: string; montant: number; produit: string; echeance: string }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: clientId,
      user_type: 'client',
      title: '💳 Rappel de paiement',
      message: `Un paiement de ${payment.montant}€ pour ${payment.produit} est attendu. Échéance: ${payment.echeance}`,
      notification_type: 'payment_reminder',
      priority: 'high',
      event_id: payment.id,
      metadata: {
        montant: payment.montant,
        produit: payment.produit,
        echeance: payment.echeance
      }
    });
  }

  /**
   * CLIENT 3: Validation administrative complète
   */
  static async onValidationComplete(
    clientId: string,
    dossier: { id: string; nom: string; produit: string; montant?: number }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: clientId,
      user_type: 'client',
      title: '🎉 Validation complète !',
      message: `Votre dossier ${dossier.nom} a été validé. Le traitement peut continuer.`,
      notification_type: 'validation_complete',
      priority: 'high',
      event_id: dossier.id,
      event_title: dossier.nom,
      metadata: {
        dossier_id: dossier.id,
        produit: dossier.produit,
        montant: dossier.montant
      }
    });
  }

  /**
   * CLIENT 4bis: Signature de charte demandée
   */
  static async onCharteSignatureRequested(
    clientAuthId: string | null,
    data: { dossier_id: string; produit: string; expert_name: string; charte_url?: string }
  ): Promise<boolean> {
    if (!clientAuthId) {
      console.warn('⚠️ onCharteSignatureRequested appelé sans clientAuthId', data);
      return false;
    }

    const produitSlug = this.normalizeSlug(data.produit);

    return this.createNotification({
      user_id: clientAuthId,
      user_type: 'client',
      title: '✍️ Signature de charte requise',
      message: `${data.expert_name} a envoyé la charte commerciale pour votre dossier ${data.produit}. Merci de la signer pour qu’il puisse démarrer l’audit.`,
      notification_type: 'charte_signature_requested',
      priority: 'high',
      event_id: data.dossier_id,
      action_url: produitSlug ? `/produits/${produitSlug}/${data.dossier_id}` : undefined,
      metadata: {
        dossier_id: data.dossier_id,
        produit: data.produit,
        produit_slug: produitSlug || undefined,
        expert_name: data.expert_name,
        charte_url: data.charte_url || null,
        next_step_label: 'Signer la charte commerciale',
        next_step_description: `L’expert ${data.expert_name} attend votre signature pour démarrer l’audit.`,
        recommended_action: 'Consulter et signer la charte dans votre espace documents.',
        support_email: NotificationTriggers.SUPPORT_EMAIL
      }
    });
  }

  /**
   * CLIENT 4: Commentaire d'un expert sur le dossier
   */
  static async onExpertComment(
    clientId: string,
    expert: { id: string; nom: string; prenom: string },
    dossier: { id: string; nom: string },
    commentaire: string
  ): Promise<boolean> {
    return this.createNotification({
      user_id: clientId,
      user_type: 'client',
      title: `💬 Commentaire de ${expert.prenom} ${expert.nom}`,
      message: commentaire.length > 100 ? commentaire.substring(0, 100) + '...' : commentaire,
      notification_type: 'expert_comment',
      priority: 'medium',
      event_id: dossier.id,
      event_title: dossier.nom,
      metadata: {
        expert_id: expert.id,
        expert_nom: `${expert.prenom} ${expert.nom}`,
        dossier_id: dossier.id,
        commentaire_complet: commentaire
      }
    });
  }

  /**
   * CLIENT 5: Deadline approche (7 jours avant)
   */
  static async onDeadlineApproaching(
    clientId: string,
    dossier: { id: string; nom: string; deadline: string; jours_restants: number }
  ): Promise<boolean> {
    const urgency = dossier.jours_restants <= 3 ? 'urgent' : 'high';
    const emoji = dossier.jours_restants <= 3 ? '🚨' : '⏰';

    return this.createNotification({
      user_id: clientId,
      user_type: 'client',
      title: `${emoji} Deadline approche`,
      message: `Plus que ${dossier.jours_restants} jour(s) pour compléter ${dossier.nom}. Deadline: ${dossier.deadline}`,
      notification_type: 'deadline_approaching',
      priority: urgency,
      event_id: dossier.id,
      event_title: dossier.nom,
      metadata: {
        dossier_id: dossier.id,
        deadline: dossier.deadline,
        jours_restants: dossier.jours_restants
      }
    });
  }

  static async onComplementaryDocumentsValidated(
    clientAuthId: string,
    data: { dossier_id: string; produit: string; expert_name: string; documents_count: number }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: clientAuthId,
      user_type: 'client',
      title: '✅ Documents complémentaires validés',
      message: `${data.expert_name} a validé ${data.documents_count} document${data.documents_count > 1 ? 's' : ''} pour votre dossier ${data.produit}. L'audit peut continuer.`,
      notification_type: 'complementary_documents_validated',
      priority: 'medium',
      event_id: data.dossier_id,
      metadata: {
        dossier_id: data.dossier_id,
        produit: data.produit,
        expert_name: data.expert_name,
        documents_count: data.documents_count,
        next_step_label: 'Suivre l’analyse de votre expert',
        next_step_description: `${data.expert_name} poursuit désormais l’audit avec les documents validés.`,
        recommended_action: 'Consulter la timeline du dossier pour suivre l’avancement.',
        support_email: NotificationTriggers.SUPPORT_EMAIL
      }
    });
  }

  static async onComplementaryDocumentsRejected(
    clientAuthId: string,
    data: { dossier_id: string; produit: string; expert_name: string; reason?: string }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: clientAuthId,
      user_type: 'client',
      title: '⚠️ Documents complémentaires à reprendre',
      message: `${data.expert_name} a besoin de documents complémentaires supplémentaires pour ${data.produit}.${data.reason ? '\nMotif : ' + data.reason : ''}`,
      notification_type: 'complementary_documents_rejected',
      priority: 'high',
      event_id: data.dossier_id,
      metadata: {
        dossier_id: data.dossier_id,
        produit: data.produit,
        expert_name: data.expert_name,
        reason: data.reason || null,
        next_step_label: 'Téléverser de nouveaux documents',
        next_step_description: `${data.expert_name} a besoin d’éléments supplémentaires pour poursuivre l’audit.`,
        recommended_action: 'Consulter la liste des documents rejetés et téléverser une nouvelle version.',
        support_email: NotificationTriggers.SUPPORT_EMAIL
      }
    });
  }

  static async onImplementationInProgress(
    clientAuthId: string,
    data: { dossier_id: string; produit: string; organisme?: string; reference?: string }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: clientAuthId,
      user_type: 'client',
      title: '🛠️ Dossier transmis à l’administration',
      message: `Votre expert a transmis votre dossier ${data.produit} à l’administration.${data.organisme ? ` Organisme : ${data.organisme}.` : ''}${data.reference ? ` Référence : ${data.reference}.` : ''}`,
      notification_type: 'implementation_in_progress',
      priority: 'medium',
      event_id: data.dossier_id,
      metadata: {
        dossier_id: data.dossier_id,
        produit: data.produit,
        organisme: data.organisme || null,
        reference: data.reference || null,
        next_step_label: 'Attendre la décision de l’administration',
        next_step_description: 'Vous serez notifié automatiquement dès que l’administration aura répondu.',
        recommended_action: 'Vérifier régulièrement votre espace client et préparer les justificatifs complémentaires si nécessaire.',
        support_email: NotificationTriggers.SUPPORT_EMAIL
      }
    });
  }

  static async onImplementationValidated(
    clientAuthId: string,
    data: { dossier_id: string; produit: string; montant_accorde: number; decision: 'accepte' | 'partiel' | 'refuse' }
  ): Promise<boolean> {
    const icon = data.decision === 'accepte' ? '✅' : data.decision === 'partiel' ? '⚠️' : '❌';
    const priority: 'medium' | 'high' = data.decision === 'refuse' ? 'high' : 'medium';

    return this.createNotification({
      user_id: clientAuthId,
      user_type: 'client',
      title: `${icon} Résultat administration` ,
      message: `L'administration a rendu sa décision (${data.decision}). Montant accordé : ${data.montant_accorde.toLocaleString('fr-FR')} € pour ${data.produit}.`,
      notification_type: 'implementation_validated',
      priority,
      event_id: data.dossier_id,
      metadata: {
        dossier_id: data.dossier_id,
        produit: data.produit,
        montant_accorde: data.montant_accorde,
        decision: data.decision,
        next_step_label: data.decision === 'refuse'
          ? 'Contacter votre expert'
          : 'Régler la commission expert',
        next_step_description: data.decision === 'refuse'
          ? 'Votre expert vous contactera afin de préparer les suites possibles.'
          : 'Procédez au règlement de la commission due à votre expert pour finaliser le dossier.',
        recommended_action: data.decision === 'refuse'
          ? 'Consulter le détail dans votre espace dossier et préparer les éléments de contestation.'
          : 'Régler la commission expert depuis votre espace client.',
        support_email: NotificationTriggers.SUPPORT_EMAIL
      }
    });
  }

  static async onPaymentRequested(
    clientAuthId: string,
    data: { dossier_id: string; produit: string; montant: number; facture_reference?: string }
  ): Promise<boolean> {
    const produitSlug = this.normalizeSlug(data.produit);

    return this.createNotification({
      user_id: clientAuthId,
      user_type: 'client',
      title: '💶 Paiement requis',
      message: `Votre remboursement est disponible pour ${data.produit}. Merci de régler ${data.montant.toLocaleString('fr-FR')} € à votre expert.${data.facture_reference ? `
Référence : ${data.facture_reference}` : ''}`,
      notification_type: 'payment_requested',
      priority: 'high',
      event_id: data.dossier_id,
      action_url: produitSlug ? `/produits/${produitSlug}/${data.dossier_id}` : undefined,
      metadata: {
        dossier_id: data.dossier_id,
        produit: data.produit,
        produit_slug: produitSlug || undefined,
        montant: data.montant,
        facture_reference: data.facture_reference || null,
        commission_type: 'expert',
        next_step_label: 'Régler la commission expert',
        next_step_description: 'Ce paiement rémunère votre expert et permet de clôturer définitivement votre dossier.',
        recommended_action: 'Effectuer le règlement de la commission expert depuis votre espace client. En cas de question, contactez notre support.',
        support_email: NotificationTriggers.SUPPORT_EMAIL
      }
    });
  }

  static async onPaymentConfirmed(
    clientAuthId: string,
    data: { dossier_id: string; produit: string; montant: number; paiement_date?: string }
  ): Promise<boolean> {
    const produitSlug = this.normalizeSlug(data.produit);

    return this.createNotification({
      user_id: clientAuthId,
      user_type: 'client',
      title: '✅ Paiement confirmé',
      message: `Nous avons bien reçu le paiement de ${data.montant.toLocaleString('fr-FR')} € pour rémunérer votre expert sur ${data.produit}. Le dossier est désormais clôturé.${data.paiement_date ? `
Date : ${data.paiement_date}` : ''}`,
      notification_type: 'payment_confirmed',
      priority: 'medium',
      event_id: data.dossier_id,
      action_url: produitSlug ? `/produits/${produitSlug}/${data.dossier_id}` : undefined,
      metadata: {
        dossier_id: data.dossier_id,
        produit: data.produit,
        montant: data.montant,
        produit_slug: produitSlug || undefined,
        paiement_date: data.paiement_date || null,
        next_step_label: 'Télécharger vos reçus',
        next_step_description: 'Vos justificatifs (facture et synthèse dossier) sont disponibles dans votre espace.',
        recommended_action: 'Archiver les pièces justificatives et informer votre comptabilité si nécessaire.',
        support_email: NotificationTriggers.SUPPORT_EMAIL
      }
    });
  }

  // ============================================================================
  // NOTIFICATIONS EXPERT (5 types)
  // ============================================================================

  /**
   * EXPERT 0: Charte signée par le client
   */
  static async onCharteSigned(
    expertAuthId: string | null,
    data: { dossier_id: string; produit: string; client_name: string }
  ): Promise<boolean> {
    if (!expertAuthId) {
      console.warn('⚠️ onCharteSigned appelé sans expertAuthId', data);
      return false;
    }

    return this.createNotification({
      user_id: expertAuthId,
      user_type: 'expert',
      title: '✅ Charte signée par le client',
      message: `${data.client_name} a signé la charte commerciale pour le dossier ${data.produit}. Vous pouvez lancer l'audit.`,
      notification_type: 'charte_signed',
      priority: 'medium',
      event_id: data.dossier_id,
      metadata: {
        dossier_id: data.dossier_id,
        produit: data.produit,
        client_name: data.client_name,
        next_step_label: 'Démarrer l’audit',
        next_step_description: 'L’audit peut commencer immédiatement, pensez à informer le client des premières actions.',
        recommended_action: 'Planifier l’audit et mettre à jour la timeline avec la date de démarrage.',
        support_email: NotificationTriggers.SUPPORT_EMAIL
      }
    });
  }

  /**
   * EXPERT 1: Client a uploadé un document
   */
  static async onDocumentUploaded(
    expertId: string,
    client: { id: string; nom: string; prenom: string },
    document: { id: string; nom: string; type: string },
    dossier: { id: string; nom: string }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: expertId,
      user_type: 'expert',
      title: `📄 Nouveau document de ${client.prenom} ${client.nom}`,
      message: `Document "${document.nom}" uploadé pour le dossier ${dossier.nom}`,
      notification_type: 'document_uploaded',
      priority: 'medium',
      event_id: dossier.id,
      event_title: dossier.nom,
      metadata: {
        client_id: client.id,
        client_nom: `${client.prenom} ${client.nom}`,
        document_id: document.id,
        document_nom: document.nom,
        document_type: document.type,
        dossier_id: dossier.id
      }
    });
  }

  /**
   * EXPERT 2: Rappel mission urgente
   */
  static async onAssignmentReminder(
    expertId: string,
    dossier: { id: string; nom: string; client_nom: string; jours_inactivite: number }
  ): Promise<boolean> {
    const urgency = dossier.jours_inactivite >= 7 ? 'urgent' : 'high';

    return this.createNotification({
      user_id: expertId,
      user_type: 'expert',
      title: '⏰ Rappel : Dossier en attente',
      message: `Le dossier ${dossier.nom} (${dossier.client_nom}) attend une action depuis ${dossier.jours_inactivite} jour(s)`,
      notification_type: 'assignment_reminder',
      priority: urgency,
      event_id: dossier.id,
      event_title: dossier.nom,
      metadata: {
        dossier_id: dossier.id,
        client_nom: dossier.client_nom,
        jours_inactivite: dossier.jours_inactivite,
        next_step_label: 'Reprendre contact avec le client',
        next_step_description: `Le dossier ${dossier.nom} est en attente depuis ${dossier.jours_inactivite} jour(s).`,
        recommended_action: 'Envoyer un message ou planifier un rendez-vous pour maintenir l’élan du dossier.',
        support_email: NotificationTriggers.SUPPORT_EMAIL
      }
    });
  }

  /**
   * EXPERT 3: Paiement reçu
   */
  static async onPaymentReceived(
    expertId: string,
    payment: { id: string; montant: number; client_nom: string; dossier_nom: string }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: expertId,
      user_type: 'expert',
      title: '💰 Paiement reçu',
      message: `Vous avez reçu ${payment.montant}€ pour le dossier ${payment.dossier_nom} (${payment.client_nom})`,
      notification_type: 'payment_received',
      priority: 'high',
      metadata: {
        payment_id: payment.id,
        montant: payment.montant,
        client_nom: payment.client_nom,
        dossier_nom: payment.dossier_nom
      }
    });
  }

  /**
   * EXPERT 4: Dossier marqué comme urgent par admin
   */
  static async onDossierUrgent(
    expertId: string,
    dossier: { id: string; nom: string; client_nom: string; raison: string }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: expertId,
      user_type: 'expert',
      title: '🚨 DOSSIER URGENT',
      message: `Le dossier ${dossier.nom} (${dossier.client_nom}) nécessite une attention immédiate. ${dossier.raison}`,
      notification_type: 'dossier_urgent',
      priority: 'urgent',
      event_id: dossier.id,
      event_title: dossier.nom,
      metadata: {
        dossier_id: dossier.id,
        client_nom: dossier.client_nom,
        raison: dossier.raison
      }
    });
  }

  /**
   * EXPERT 5: Demande client via messagerie
   */
  static async onClientRequest(
    expertId: string,
    client: { id: string; nom: string; prenom: string },
    request: { sujet: string; message: string; conversation_id?: string }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: expertId,
      user_type: 'expert',
      title: `📩 Demande de ${client.prenom} ${client.nom}`,
      message: `${request.sujet}: ${request.message.substring(0, 80)}...`,
      notification_type: 'client_request',
      priority: 'medium',
      event_id: request.conversation_id,
      metadata: {
        client_id: client.id,
        client_nom: `${client.prenom} ${client.nom}`,
        sujet: request.sujet,
        conversation_id: request.conversation_id
      }
    });
  }

  // ============================================================================
  // NOTIFICATIONS ADMIN (8 types)
  // ============================================================================

  /**
   * ADMIN 1: Nouveau client inscrit
   */
  static async onNewClientRegistration(
    client: { id: string; nom: string; prenom: string; email: string; company?: string }
  ): Promise<boolean> {
    return this.createAdminNotification({
      type: 'client_registration',
      title: '👤 Nouveau client inscrit',
      message: `${client.prenom} ${client.nom} (${client.email}) ${client.company ? `de ${client.company}` : ''} vient de s'inscrire`,
      priority: 'medium',
      metadata: {
        client_id: client.id,
        email: client.email,
        company: client.company
      },
      action_url: `/admin/clients/${client.id}`,
      action_label: 'Voir profil'
    });
  }

  /**
   * ADMIN 2: Nouvel expert en attente de validation
   */
  static async onNewExpertRegistration(
    expert: { id: string; nom: string; prenom: string; email: string; specialite?: string }
  ): Promise<boolean> {
    return this.createAdminNotification({
      type: 'expert_registration',
      title: '⭐ Nouvel expert en attente',
      message: `${expert.prenom} ${expert.nom} (${expert.specialite || 'Non spécifié'}) attend validation`,
      priority: 'high',
      metadata: {
        expert_id: expert.id,
        email: expert.email,
        specialite: expert.specialite
      },
      action_url: `/admin/experts/${expert.id}`,
      action_label: 'Valider'
    });
  }

  /**
   * ADMIN 3: Problème de paiement détecté
   */
  static async onPaymentIssue(
    payment: { id: string; client_id: string; client_nom: string; montant: number; erreur: string }
  ): Promise<boolean> {
    return this.createAdminNotification({
      type: 'payment_issue',
      title: '⚠️ Problème de paiement',
      message: `Paiement de ${payment.montant}€ échoué pour ${payment.client_nom}. Erreur: ${payment.erreur}`,
      priority: 'high',
      metadata: {
        payment_id: payment.id,
        client_id: payment.client_id,
        montant: payment.montant,
        erreur: payment.erreur
      },
      action_url: `/admin/payments/${payment.id}`,
      action_label: 'Investiguer'
    });
  }

  /**
   * ADMIN 4: Alerte fraude potentielle
   */
  static async onFraudAlert(
    alert: { type: string; user_id: string; user_type: string; raison: string; score_risque: number }
  ): Promise<boolean> {
    return this.createAdminNotification({
      type: 'fraud_alert',
      title: '🚨 ALERTE FRAUDE',
      message: `Activité suspecte détectée (${alert.type}). Score de risque: ${alert.score_risque}/100. ${alert.raison}`,
      priority: 'urgent',
      metadata: {
        user_id: alert.user_id,
        user_type: alert.user_type,
        type_fraude: alert.type,
        score_risque: alert.score_risque,
        raison: alert.raison
      },
      action_url: `/admin/security/alerts`,
      action_label: 'Voir détails'
    });
  }

  /**
   * ADMIN 5: Erreur système critique
   */
  static async onSystemError(
    error: { type: string; message: string; stack?: string; service: string }
  ): Promise<boolean> {
    return this.createAdminNotification({
      type: 'system_error',
      title: '🔴 Erreur système',
      message: `Erreur ${error.type} dans ${error.service}: ${error.message}`,
      priority: 'urgent',
      metadata: {
        error_type: error.type,
        service: error.service,
        stack: error.stack
      },
      action_url: '/admin/system/logs',
      action_label: 'Voir logs'
    });
  }

  /**
   * ADMIN 6: Activité anormalement élevée
   */
  static async onHighActivity(
    activity: { type: string; count: number; periode: string; seuil_normal: number }
  ): Promise<boolean> {
    return this.createAdminNotification({
      type: 'high_activity',
      title: '📈 Activité élevée détectée',
      message: `${activity.count} ${activity.type} en ${activity.periode} (normal: ${activity.seuil_normal})`,
      priority: 'medium',
      metadata: {
        activity_type: activity.type,
        count: activity.count,
        periode: activity.periode,
        seuil_normal: activity.seuil_normal
      },
      action_url: '/admin/analytics',
      action_label: 'Voir analytics'
    });
  }

  /**
   * ADMIN 7: Ticket support urgent
   */
  static async onSupportTicketUrgent(
    ticket: { id: string; user_nom: string; sujet: string; categorie: string }
  ): Promise<boolean> {
    return this.createAdminNotification({
      type: 'support_ticket',
      title: '🆘 Ticket support urgent',
      message: `${ticket.user_nom} - ${ticket.sujet} (${ticket.categorie})`,
      priority: 'high',
      metadata: {
        ticket_id: ticket.id,
        user_nom: ticket.user_nom,
        categorie: ticket.categorie
      },
      action_url: `/admin/support/${ticket.id}`,
      action_label: 'Traiter'
    });
  }

  /**
   * ADMIN 8: Document en attente de validation
   */
  static async onDocumentValidationPending(
    document: { id: string; client_id: string; client_nom: string; type: string; dossier_nom: string }
  ): Promise<boolean> {
    return this.createAdminNotification({
      type: 'document_validation',
      title: '📋 Document à valider',
      message: `${document.type} de ${document.client_nom} pour ${document.dossier_nom} attend validation`,
      priority: 'medium',
      metadata: {
        document_id: document.id,
        client_id: document.client_id,
        type: document.type,
        dossier_nom: document.dossier_nom
      },
      action_url: `/admin/documents/${document.id}`,
      action_label: 'Valider'
    });
  }

  // ============================================================================
  // NOTIFICATIONS APPORTEUR (6 types)
  // ============================================================================

  /**
   * APPORTEUR 1: Commission gagnée
   */
  static async onCommissionEarned(
    apporteurId: string,
    commission: { montant: number; client_nom: string; produit: string; taux: number }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: apporteurId,
      user_type: 'apporteur',
      title: '💰 Commission gagnée !',
      message: `Vous avez gagné ${commission.montant}€ (${commission.taux}%) pour ${commission.client_nom} - ${commission.produit}`,
      notification_type: 'commission_earned',
      priority: 'high',
      metadata: {
        montant: commission.montant,
        client_nom: commission.client_nom,
        produit: commission.produit,
        taux: commission.taux
      }
    });
  }

  /**
   * APPORTEUR 2: Expert trouvé pour prospect
   */
  static async onExpertMatched(
    apporteurId: string,
    match: { prospect_id: string; prospect_nom: string; expert_id: string; expert_nom: string; specialite: string }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: apporteurId,
      user_type: 'apporteur',
      title: '🎯 Expert trouvé',
      message: `${match.expert_nom} (${match.specialite}) a été trouvé pour ${match.prospect_nom}`,
      notification_type: 'expert_matched',
      priority: 'medium',
      event_id: match.prospect_id,
      metadata: {
        prospect_id: match.prospect_id,
        prospect_nom: match.prospect_nom,
        expert_id: match.expert_id,
        expert_nom: match.expert_nom,
        specialite: match.specialite
      }
    });
  }

  /**
   * APPORTEUR 3: Prospect qualifié automatiquement
   */
  static async onProspectQualified(
    apporteurId: string,
    prospect: { id: string; nom: string; score: number; potentiel: string }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: apporteurId,
      user_type: 'apporteur',
      title: '✨ Prospect qualifié',
      message: `${prospect.nom} a été qualifié avec un score de ${prospect.score}/100 (Potentiel: ${prospect.potentiel})`,
      notification_type: 'prospect_qualified',
      priority: 'medium',
      event_id: prospect.id,
      metadata: {
        prospect_id: prospect.id,
        score: prospect.score,
        potentiel: prospect.potentiel
      }
    });
  }

  /**
   * APPORTEUR 4: RDV terminé - demande feedback
   */
  static async onMeetingCompleted(
    apporteurId: string,
    meeting: { id: string; prospect_nom: string; expert_nom: string; date: string }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: apporteurId,
      user_type: 'apporteur',
      title: '✅ RDV terminé',
      message: `Le RDV entre ${meeting.expert_nom} et ${meeting.prospect_nom} est terminé. N'oubliez pas de demander un feedback.`,
      notification_type: 'meeting_completed',
      priority: 'medium',
      event_id: meeting.id,
      metadata: {
        meeting_id: meeting.id,
        prospect_nom: meeting.prospect_nom,
        expert_nom: meeting.expert_nom,
        date: meeting.date
      }
    });
  }

  /**
   * APPORTEUR 5: Affaire conclue
   */
  static async onDealClosed(
    apporteurId: string,
    deal: { id: string; client_nom: string; montant: number; produit: string; commission_prevue: number }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: apporteurId,
      user_type: 'apporteur',
      title: '🎉 Affaire conclue !',
      message: `${deal.client_nom} a signé pour ${deal.produit} (${deal.montant}€). Commission prévue: ${deal.commission_prevue}€`,
      notification_type: 'deal_closed',
      priority: 'high',
      event_id: deal.id,
      metadata: {
        deal_id: deal.id,
        client_nom: deal.client_nom,
        montant: deal.montant,
        produit: deal.produit,
        commission_prevue: deal.commission_prevue
      }
    });
  }

  /**
   * APPORTEUR 6: Paiement commission en attente
   */
  static async onCommissionPending(
    apporteurId: string,
    payment: { montant: number; deal_nom: string; date_traitement: string }
  ): Promise<boolean> {
    return this.createNotification({
      user_id: apporteurId,
      user_type: 'apporteur',
      title: '⏳ Commission en traitement',
      message: `Votre commission de ${payment.montant}€ (${payment.deal_nom}) est en cours de traitement. Paiement prévu: ${payment.date_traitement}`,
      notification_type: 'commission_pending',
      priority: 'medium',
      metadata: {
        montant: payment.montant,
        deal_nom: payment.deal_nom,
        date_traitement: payment.date_traitement
      }
    });
  }

  // ============================================================================
  // UTILITAIRES
  // ============================================================================

  /**
   * Envoyer une notification de test (pour debugging)
   */
  static async sendTestNotification(userId: string, userType: 'client' | 'expert' | 'admin' | 'apporteur'): Promise<boolean> {
    if (userType === 'admin') {
      return this.createAdminNotification({
        type: 'test',
        title: 'Test Notification Admin',
        message: `Notification de test envoyée le ${new Date().toLocaleString('fr-FR')}`,
        priority: 'medium'
      });
    }

    return this.createNotification({
      user_id: userId,
      user_type: userType,
      title: `Test Notification ${userType}`,
      message: `Notification de test envoyée le ${new Date().toLocaleString('fr-FR')}`,
      notification_type: 'test',
      priority: 'medium'
    });
  }
}

