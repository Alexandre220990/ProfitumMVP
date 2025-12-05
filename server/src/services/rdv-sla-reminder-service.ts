import { createClient } from '@supabase/supabase-js';
import { EmailService } from './EmailService';
import { SecureLinkService } from './secure-link-service';
import { NotificationPreferencesChecker } from './notification-preferences-checker';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Configuration SLA pour les RDV non traités
 * Seuils en heures depuis la date/heure prévue du RDV (scheduled_date + scheduled_time)
 */
const RDV_SLA_CONFIG = {
  targetHours: 24,      // 24h : Rappel normal
  acceptableHours: 48,  // 48h : Rappel important
  criticalHours: 120    // 120h (5 jours) : Rappel urgent
};

interface RDVNotification {
  id: string;
  title: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  created_at: string;
  client_id?: string;
  expert_id?: string;
  apporteur_id?: string;
  Client?: {
    name?: string;
    company_name?: string;
    email?: string;
  };
  Expert?: {
    name?: string;
    email?: string;
  };
  ApporteurAffaires?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

/**
 * Service spécialisé pour les rappels automatiques des RDV non traités
 * selon les SLA définis
 */
export class RDVSlaReminderService {
  /**
   * Vérifier et envoyer les rappels pour les RDV non traités
   */
  static async checkAndSendReminders(): Promise<void> {
    try {
      console.log('🔔 [RDV SLA Reminder] Début de la vérification des rappels...');

      const now = new Date();
      
      // Récupérer tous les RDV en attente (proposed ou scheduled) non complétés
      const { data: rdvs, error } = await supabase
        .from('RDV')
        .select(`
          id,
          title,
          scheduled_date,
          scheduled_time,
          status,
          created_at,
          client_id,
          expert_id,
          apporteur_id,
          Client (
            name,
            company_name,
            email
          ),
          Expert (
            name,
            email
          ),
          ApporteurAffaires (
            first_name,
            last_name,
            email
          )
        `)
        .in('status', ['proposed', 'scheduled'])
        .limit(500);

      if (error) {
        console.error('❌ [RDV SLA Reminder] Erreur récupération RDV:', error);
        return;
      }

      if (!rdvs || rdvs.length === 0) {
        console.log('ℹ️  [RDV SLA Reminder] Aucun RDV à vérifier.');
        return;
      }

      let remindersSent = 0;
      let startNotificationsSent = 0;

      for (const rdv of rdvs) {
        // Transformer les relations tableaux en objets
        const transformedRdv: RDVNotification = {
          ...rdv,
          Client: Array.isArray(rdv.Client) && rdv.Client.length > 0 ? rdv.Client[0] : undefined,
          Expert: Array.isArray(rdv.Expert) && rdv.Expert.length > 0 ? rdv.Expert[0] : undefined,
          ApporteurAffaires: Array.isArray(rdv.ApporteurAffaires) && rdv.ApporteurAffaires.length > 0 ? rdv.ApporteurAffaires[0] : undefined,
        };
        
        // Vérifier si le RDV démarre maintenant
        if (this.isRdvStartingNow(transformedRdv, now)) {
          await this.sendRdvStartNotification(transformedRdv);
          startNotificationsSent++;
        }
        
        // Vérifier les rappels SLA (pour les RDV en retard)
        const shouldRemind = this.shouldSendReminder(transformedRdv, now);
        
        if (shouldRemind.should && shouldRemind.threshold) {
          await this.sendReminder(transformedRdv, shouldRemind.threshold);
          remindersSent++;
        }
      }

      console.log(`✅ [RDV SLA Reminder] Vérification terminée - ${remindersSent} rappel(s) envoyé(s), ${startNotificationsSent} notification(s) de démarrage envoyée(s)`);
    } catch (error) {
      console.error('❌ [RDV SLA Reminder] Erreur lors de la vérification:', error);
    }
  }

  /**
   * Détermine si un rappel doit être envoyé selon les seuils SLA
   * Calcule le délai écoulé depuis la date/heure prévue du RDV (scheduled_date + scheduled_time)
   * Un RDV est "overdue" quand la date/heure prévue dépasse la date/heure actuelle
   */
  static shouldSendReminder(
    rdv: RDVNotification,
    now: Date
  ): { should: boolean; threshold: '24h' | '48h' | '120h' | null } {
    // Utiliser la date/heure prévue du RDV, pas la date de création
    if (!rdv.scheduled_date || !rdv.scheduled_time) {
      return { should: false, threshold: null };
    }

    try {
      // Récupérer le timezone du RDV (par défaut Europe/Paris)
      const timezone = (rdv as any).timezone || 'Europe/Paris';
      
      // Construire la date de référence pour obtenir l'offset
      const [year, month, day] = rdv.scheduled_date.split('-').map(Number);
      const [hour, minute] = rdv.scheduled_time.split(':').map(Number);
      const refDate = new Date(year, month - 1, day, hour, minute);
      
      // Obtenir l'offset du timezone
      const offset = this.getTimezoneOffset(refDate, timezone);
      
      // Construire la date complète avec timezone
      const dateTimeWithTimezone = `${rdv.scheduled_date}T${rdv.scheduled_time}:00${offset}`;
      const scheduledDateTime = new Date(dateTimeWithTimezone);
      
      // Vérifier si le RDV est passé (overdue)
      if (scheduledDateTime > now) {
        // RDV pas encore arrivé, pas de rappel SLA
        return { should: false, threshold: null };
      }

      // Calculer les heures écoulées depuis la date/heure prévue
      const hoursElapsed = (now.getTime() - scheduledDateTime.getTime()) / (1000 * 60 * 60);

      // Récupérer les métadonnées pour vérifier les rappels déjà envoyés
      const metadata = (rdv as any).metadata || {};
      const remindersSent = metadata.reminders_sent || {};

      // Vérifier chaque seuil dans l'ordre (du plus récent au plus ancien)
      if (hoursElapsed >= RDV_SLA_CONFIG.criticalHours && !remindersSent['120h']) {
        return { should: true, threshold: '120h' };
      }
      if (hoursElapsed >= RDV_SLA_CONFIG.acceptableHours && !remindersSent['48h']) {
        return { should: true, threshold: '48h' };
      }
      if (hoursElapsed >= RDV_SLA_CONFIG.targetHours && !remindersSent['24h']) {
        return { should: true, threshold: '24h' };
      }

      return { should: false, threshold: null };
    } catch (error) {
      console.error(`❌ [RDV SLA Reminder] Erreur calcul shouldSendReminder pour RDV ${rdv.id}:`, error);
      return { should: false, threshold: null };
    }
  }

  /**
   * Envoie un rappel pour un RDV
   */
  static async sendReminder(
    rdv: RDVNotification,
    threshold: '24h' | '48h' | '120h'
  ): Promise<void> {
    try {
      // Calculer le délai écoulé depuis la date/heure prévue du RDV
      if (!rdv.scheduled_date || !rdv.scheduled_time) {
        console.warn(`⚠️ [RDV SLA Reminder] RDV ${rdv.id} sans date/heure prévue`);
        return;
      }

      // Récupérer le timezone du RDV (par défaut Europe/Paris)
      const timezone = (rdv as any).timezone || 'Europe/Paris';
      
      // Construire la date de référence pour obtenir l'offset
      const [year, month, day] = rdv.scheduled_date.split('-').map(Number);
      const [hour, minute] = rdv.scheduled_time.split(':').map(Number);
      const refDate = new Date(year, month - 1, day, hour, minute);
      
      // Obtenir l'offset du timezone
      const offset = this.getTimezoneOffset(refDate, timezone);
      
      // Construire la date complète avec timezone
      const dateTimeWithTimezone = `${rdv.scheduled_date}T${rdv.scheduled_time}:00${offset}`;
      const scheduledDateTime = new Date(dateTimeWithTimezone);
      
      const now = new Date();
      const hoursElapsed = (now.getTime() - scheduledDateTime.getTime()) / (1000 * 60 * 60);
      const daysElapsed = Math.floor(hoursElapsed / 24);

      // Déterminer la priorité et le message selon le seuil
      let reminderPriority: 'high' | 'urgent' = 'high';
      let reminderMessage = '';

      const clientName = rdv.Client?.company_name || rdv.Client?.name || 'Client';
      const expertName = rdv.Expert?.name || 'Non assigné';
      const rdvDate = rdv.scheduled_date ? new Date(rdv.scheduled_date).toLocaleDateString('fr-FR') : 'Date non définie';
      const rdvTime = rdv.scheduled_time ? rdv.scheduled_time.substring(0, 5) : 'Heure non définie';

      if (threshold === '120h') {
        reminderPriority = 'urgent';
        reminderMessage = `🚨 URGENT : RDV prévu le ${rdvDate} à ${rdvTime} passé depuis ${daysElapsed} jours - ${rdv.title || 'Sans titre'} - Client: ${clientName}`;
      } else if (threshold === '48h') {
        reminderPriority = 'high';
        reminderMessage = `⚠️ RDV prévu le ${rdvDate} à ${rdvTime} passé depuis ${daysElapsed} jours - ${rdv.title || 'Sans titre'} - Client: ${clientName}`;
      } else {
        reminderPriority = 'high';
        reminderMessage = `📋 Rappel : RDV prévu le ${rdvDate} à ${rdvTime} à traiter - ${rdv.title || 'Sans titre'} - Client: ${clientName}`;
      }

      // Récupérer tous les admins actifs
      const { data: admins } = await supabase
        .from('Admin')
        .select('auth_user_id, email, name')
        .eq('is_active', true)
        .not('auth_user_id', 'is', null);

      if (!admins || admins.length === 0) {
        console.warn('⚠️ [RDV SLA Reminder] Aucun admin actif trouvé');
        return;
      }

      // Déterminer le niveau SLA selon le threshold
      const slaLevel = threshold === '120h' ? 'critical' 
        : threshold === '48h' ? 'acceptable' : 'target';

      // Créer une notification et envoyer un email à chaque admin
      for (const admin of admins) {
        if (!admin.auth_user_id) continue;

        // Vérifier les préférences avant d'envoyer
        const shouldSendInApp = await NotificationPreferencesChecker.shouldSendInApp(
          admin.auth_user_id,
          'admin',
          'rdv_sla_reminder'
        );

        const shouldSendEmail = await NotificationPreferencesChecker.shouldSendEmail(
          admin.auth_user_id,
          'admin',
          'rdv_sla_reminder',
          slaLevel
        );

        // Créer la notification in-app si autorisée
        if (shouldSendInApp) {
          const { data: newNotification, error: insertError } = await supabase
            .from('notification')
            .insert({
              user_id: admin.auth_user_id,
              user_type: 'admin',
              title: reminderMessage,
              message: `RDV était prévu le ${rdvDate} à ${rdvTime} (passé depuis ${Math.floor(hoursElapsed)}h). Expert: ${expertName}`,
              notification_type: 'rdv_sla_reminder',
              priority: reminderPriority,
              is_read: false,
              status: 'unread',
              action_url: `/admin/agenda-admin?rdvId=${rdv.id}`,
              action_data: {
                rdv_id: rdv.id,
                threshold: threshold,
                days_elapsed: daysElapsed,
                hours_elapsed: Math.floor(hoursElapsed),
                scheduled_datetime: `${rdv.scheduled_date}T${rdv.scheduled_time}`
              },
              metadata: {
                rdv_id: rdv.id,
                threshold: threshold,
                days_elapsed: daysElapsed,
                hours_elapsed: Math.floor(hoursElapsed),
                client_name: clientName,
                expert_name: expertName,
                scheduled_date: rdv.scheduled_date,
                scheduled_time: rdv.scheduled_time,
                scheduled_datetime: `${rdv.scheduled_date}T${rdv.scheduled_time}`
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select();

          if (!insertError && newNotification && newNotification.length > 0) {
            // Marquer les anciennes notifications pour ce RDV comme remplacées
            // On cherche les notifications calendar_invitation et calendar_reminder non lues pour ce RDV
            const { data: oldNotifications } = await supabase
              .from('notification')
              .select('id')
              .eq('user_id', admin.auth_user_id)
              .in('notification_type', ['calendar_invitation', 'calendar_reminder'])
              .eq('is_read', false)
              .neq('status', 'replaced')
              .or(`metadata->>rdv_id.eq.${rdv.id},action_data->>rdv_id.eq.${rdv.id}`);

            if (oldNotifications && oldNotifications.length > 0) {
              // Récupérer les notifications complètes pour fusionner les metadata
              const { data: fullNotifications } = await supabase
                .from('notification')
                .select('id, metadata')
                .in('id', oldNotifications.map((n: any) => n.id));

              // Mettre à jour chaque notification avec ses metadata fusionnés
              if (fullNotifications) {
                for (const notif of fullNotifications) {
                  const updatedMetadata = {
                    ...(notif.metadata || {}),
                    replaced_by_sla_reminder: true,
                    sla_reminder_notification_id: newNotification[0]?.id,
                    replacement_date: new Date().toISOString()
                  };

                  await supabase
                    .from('notification')
                    .update({
                      status: 'replaced',
                      metadata: updatedMetadata,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', notif.id);
                }
              }
              
              console.log(`✅ [RDV SLA Reminder] ${oldNotifications.length} notification(s) originale(s) marquée(s) comme remplacée(s) pour l'admin ${admin.email}`);
            }
          }
        } else {
          console.log(`⏭️ [RDV SLA Reminder] Notification in-app non créée pour ${admin.email} - préférences désactivées`);
        }

        // ⚠️ EMAILS GROUPÉS DÉSACTIVÉS - Les rappels sont maintenant intégrés au rapport matinal
        // Les notifications in-app sont toujours créées ci-dessus
        // Plus d'envoi d'email individuel à 9h
      }

      // Mettre à jour les métadonnées du RDV pour marquer le rappel comme envoyé
      const currentMetadata = (rdv as any).metadata || {};
      const updatedRemindersSent = {
        ...(currentMetadata.reminders_sent || {}),
        [threshold]: true
      };

      await supabase
        .from('RDV')
        .update({
          metadata: {
            ...currentMetadata,
            reminders_sent: updatedRemindersSent,
            last_sla_reminder_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', rdv.id);

      console.log(`✅ [RDV SLA Reminder] Rappel ${threshold} envoyé pour RDV ${rdv.id}`);
    } catch (error) {
      console.error(`❌ [RDV SLA Reminder] Erreur lors de l'envoi du rappel:`, error);
    }
  }

  /**
   * Génère le template email pour les rappels RDV
   */
  static generateReminderEmailTemplate(
    rdv: RDVNotification,
    threshold: '24h' | '48h' | '120h',
    daysElapsed: number,
    hoursElapsed: number,
    clientName: string,
    expertName: string,
    adminName: string,
    adminId?: string,
    adminType?: string
  ): { subject: string; html: string; text: string } {
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

    const rdvDate = rdv.scheduled_date ? new Date(rdv.scheduled_date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'Date non définie';
    const rdvTime = rdv.scheduled_time || 'Heure non définie';

    const subject = threshold === '120h' 
      ? `${icon} URGENT : RDV non traité depuis ${daysElapsed} jour${daysElapsed > 1 ? 's' : ''}`
      : threshold === '48h'
      ? `${icon} RDV en attente depuis ${daysElapsed} jour${daysElapsed > 1 ? 's' : ''}`
      : `${icon} Rappel : RDV à traiter`;

    const actionPath = `/admin/agenda-admin?rdvId=${rdv.id}`;
    const actionLink = SecureLinkService.generateSmartLinkHTML(
      'Voir et traiter le RDV',
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
      <div class="header-title">RDV en attente</div>
      <div class="header-subtitle">Délai écoulé : ${daysElapsed} jour${daysElapsed > 1 ? 's' : ''}</div>
    </div>
    
    <div class="content">
      <div class="greeting">
        Bonjour ${adminName || 'Administrateur'},
      </div>
      
      <div class="alert-box">
        <div class="alert-title">
          ${threshold === '120h' ? 'Action urgente requise' : threshold === '48h' ? 'Action importante requise' : 'Rappel de traitement'}
        </div>
        <div class="alert-text">
          Un rendez-vous nécessite votre attention depuis ${daysElapsed} jour${daysElapsed > 1 ? 's' : ''} (${Math.floor(hoursElapsed)} heures).
          ${threshold === '120h' ? ' Ce RDV dépasse le délai critique et nécessite un traitement immédiat.' : ''}
        </div>
      </div>
      
      <div class="info-card">
        <div class="info-row">
          <div class="info-label">Titre</div>
          <div class="info-value">${rdv.title || 'Sans titre'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Client</div>
          <div class="info-value">${clientName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Expert</div>
          <div class="info-value">${expertName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Date prévue</div>
          <div class="info-value">${rdvDate}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Heure prévue</div>
          <div class="info-value">${rdvTime}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Statut</div>
          <div class="info-value">${rdv.status === 'proposed' ? 'Proposé' : rdv.status === 'scheduled' ? 'Planifié' : rdv.status}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Délai écoulé</div>
          <div class="info-value">
            ${daysElapsed} jour${daysElapsed > 1 ? 's' : ''}
            <span class="time-badge">${threshold}</span>
          </div>
        </div>
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

Bonjour ${adminName || 'Administrateur'},

Un rendez-vous nécessite votre attention :

Titre : ${rdv.title || 'Sans titre'}
Client : ${clientName}
Expert : ${expertName}
Date prévue : ${rdvDate}
Heure prévue : ${rdvTime}
Statut : ${rdv.status === 'proposed' ? 'Proposé' : rdv.status === 'scheduled' ? 'Planifié' : rdv.status}
Délai écoulé : ${daysElapsed} jour${daysElapsed > 1 ? 's' : ''} (${threshold})

Voir le RDV : ${process.env.FRONTEND_URL || 'https://app.profitum.fr'}${actionPath}
    `.trim();

    return { subject, html, text };
  }

  /**
   * Obtient l'offset du timezone (en format +01:00) pour une date donnée
   * Gère automatiquement l'heure d'été/hiver
   */
  static getTimezoneOffset(date: Date, timezone: string): string {
    // Créer un formatter avec le timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Obtenir la date dans le timezone cible
    const parts = formatter.formatToParts(date);
    const dateInTimezone = new Date(
      parseInt(parts.find(p => p.type === 'year')!.value),
      parseInt(parts.find(p => p.type === 'month')!.value) - 1,
      parseInt(parts.find(p => p.type === 'day')!.value),
      parseInt(parts.find(p => p.type === 'hour')!.value),
      parseInt(parts.find(p => p.type === 'minute')!.value),
      parseInt(parts.find(p => p.type === 'second')!.value)
    );
    
    // Calculer l'offset en minutes
    const offsetMinutes = (dateInTimezone.getTime() - date.getTime()) / (1000 * 60);
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes >= 0 ? '+' : '-';
    
    return `${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
  }

  /**
   * Vérifie si un RDV démarre maintenant (heure de début = heure actuelle, avec une tolérance de 5 minutes)
   */
  static isRdvStartingNow(rdv: RDVNotification, now: Date): boolean {
    if (!rdv.scheduled_date || !rdv.scheduled_time) {
      return false;
    }

    try {
      // Récupérer le timezone du RDV (par défaut Europe/Paris)
      const timezone = (rdv as any).timezone || 'Europe/Paris';
      
      // Construire une date de référence pour obtenir l'offset correct (gère heure d'été/hiver)
      const [year, month, day] = rdv.scheduled_date.split('-').map(Number);
      const [hour, minute] = rdv.scheduled_time.split(':').map(Number);
      const refDate = new Date(year, month - 1, day, hour, minute);
      
      // Obtenir l'offset du timezone pour cette date
      const offset = this.getTimezoneOffset(refDate, timezone);
      
      // Construire la date complète avec timezone
      const dateTimeWithTimezone = `${rdv.scheduled_date}T${rdv.scheduled_time}:00${offset}`;
      const scheduledDateTime = new Date(dateTimeWithTimezone);
      
      const timeDiff = Math.abs(now.getTime() - scheduledDateTime.getTime());
      const minutesDiff = timeDiff / (1000 * 60);

      // RDV démarre maintenant si on est dans une fenêtre de ±5 minutes autour de l'heure prévue
      return minutesDiff <= 5;
    } catch (error) {
      console.error(`❌ [RDV Start] Erreur calcul date/heure pour RDV ${rdv.id}:`, error);
      return false;
    }
  }

  /**
   * Envoie une notification spéciale pour les RDV qui démarrent maintenant
   */
  static async sendRdvStartNotification(rdv: RDVNotification): Promise<void> {
    try {
      const metadata = (rdv as any).metadata || {};
      
      // Vérifier si la notification de démarrage a déjà été envoyée
      if (metadata.start_notification_sent) {
        return; // Déjà envoyée
      }

      const clientName = rdv.Client?.company_name || rdv.Client?.name || 'Client';
      const expertName = rdv.Expert?.name || 'Non assigné';
      const apporteurName = rdv.ApporteurAffaires 
        ? `${rdv.ApporteurAffaires.first_name || ''} ${rdv.ApporteurAffaires.last_name || ''}`.trim()
        : null;

      const rdvDate = rdv.scheduled_date ? new Date(rdv.scheduled_date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'Date non définie';
      const rdvTime = rdv.scheduled_time || 'Heure non définie';

      // Récupérer tous les admins actifs
      const { data: admins } = await supabase
        .from('Admin')
        .select('auth_user_id, email, name')
        .eq('is_active', true)
        .not('auth_user_id', 'is', null);

      // Envoyer aux admins
      if (admins && admins.length > 0) {
        for (const admin of admins) {
          if (!admin.auth_user_id || !admin.email) continue;
          if (admin.email.includes('@profitum.temp') || admin.email.includes('temp_')) continue;

          try {
            const { subject, html, text } = this.generateRdvStartEmailTemplate(
              rdv,
              clientName,
              expertName,
              apporteurName,
              rdvDate,
              rdvTime,
              admin.name || 'Administrateur',
              'admin'
            );

            await EmailService.sendDailyReportEmail(admin.email, subject, html, text);
            console.log(`✅ [RDV Start] Email envoyé à admin ${admin.email} pour RDV ${rdv.id}`);

            // Notification in-app
            await supabase.from('notification').insert({
              user_id: admin.auth_user_id,
              user_type: 'admin',
              title: `🚀 RDV "${rdv.title || 'Sans titre'}" démarre maintenant`,
              message: `Le RDV avec ${clientName} démarre maintenant (${rdvDate} à ${rdvTime})`,
              notification_type: 'rdv_starting_now',
              priority: 'urgent',
              is_read: false,
              status: 'unread',
              action_url: `/admin/agenda-admin?rdvId=${rdv.id}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          } catch (error) {
            console.error(`❌ [RDV Start] Erreur envoi email admin ${admin.email}:`, error);
          }
        }
      }

      // Envoyer au client si disponible
      if (rdv.Client?.email && !rdv.Client.email.includes('@profitum.temp')) {
        try {
          const { subject, html, text } = this.generateRdvStartEmailTemplate(
            rdv,
            clientName,
            expertName,
            apporteurName,
            rdvDate,
            rdvTime,
            clientName,
            'client'
          );

          await EmailService.sendDailyReportEmail(rdv.Client.email, subject, html, text);
          console.log(`✅ [RDV Start] Email envoyé au client ${rdv.Client.email} pour RDV ${rdv.id}`);
        } catch (error) {
          console.error(`❌ [RDV Start] Erreur envoi email client:`, error);
        }
      }

      // Envoyer à l'expert si disponible
      if (rdv.Expert?.email && !rdv.Expert.email.includes('@profitum.temp')) {
        try {
          const { subject, html, text } = this.generateRdvStartEmailTemplate(
            rdv,
            clientName,
            expertName,
            apporteurName,
            rdvDate,
            rdvTime,
            expertName,
            'expert'
          );

          await EmailService.sendDailyReportEmail(rdv.Expert.email, subject, html, text);
          console.log(`✅ [RDV Start] Email envoyé à l'expert ${rdv.Expert.email} pour RDV ${rdv.id}`);
        } catch (error) {
          console.error(`❌ [RDV Start] Erreur envoi email expert:`, error);
        }
      }

      // Marquer la notification comme envoyée
      await supabase
        .from('RDV')
        .update({
          metadata: {
            ...metadata,
            start_notification_sent: true,
            start_notification_sent_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', rdv.id);

      console.log(`✅ [RDV Start] Notification de démarrage envoyée pour RDV ${rdv.id}`);
    } catch (error) {
      console.error(`❌ [RDV Start] Erreur lors de l'envoi de la notification:`, error);
    }
  }

  /**
   * Génère le template email pour les RDV qui démarrent maintenant
   */
  static generateRdvStartEmailTemplate(
    rdv: RDVNotification,
    clientName: string,
    expertName: string,
    apporteurName: string | null,
    rdvDate: string,
    rdvTime: string,
    recipientName: string,
    recipientType: 'admin' | 'client' | 'expert'
  ): { subject: string; html: string; text: string } {
    const urgencyColor = '#10b981'; // Vert pour "démarre maintenant"
    const urgencyBg = '#ecfdf5';
    const icon = '🚀';

    const subject = `${icon} Votre RDV "${rdv.title || 'Sans titre'}" démarre maintenant`;

    const actionPath = recipientType === 'admin' 
      ? `/admin/agenda-admin?rdvId=${rdv.id}`
      : `/calendar/event/${rdv.id}`;
    
    const actionLink = SecureLinkService.generateSmartLinkHTML(
      'Voir le RDV',
      actionPath,
      undefined,
      recipientType,
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
      <div class="header-title">RDV démarre maintenant</div>
      <div class="header-subtitle">${rdvDate} à ${rdvTime}</div>
    </div>
    
    <div class="content">
      <div class="greeting">
        Bonjour ${recipientName},
      </div>
      
      <div class="alert-box">
        <div class="alert-title">
          Votre rendez-vous démarre maintenant
        </div>
        <div class="alert-text">
          Le rendez-vous <strong>"${rdv.title || 'Sans titre'}"</strong> est prévu pour commencer maintenant.
        </div>
      </div>
      
      <div class="info-card">
        <div class="info-row">
          <div class="info-label">Titre</div>
          <div class="info-value">${rdv.title || 'Sans titre'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Client</div>
          <div class="info-value">${clientName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Expert</div>
          <div class="info-value">${expertName}</div>
        </div>
        ${apporteurName ? `
        <div class="info-row">
          <div class="info-label">Apporteur</div>
          <div class="info-value">${apporteurName}</div>
        </div>
        ` : ''}
        <div class="info-row">
          <div class="info-label">Date</div>
          <div class="info-value">${rdvDate}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Heure</div>
          <div class="info-value">${rdvTime}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Statut</div>
          <div class="info-value">${rdv.status === 'proposed' ? 'Proposé' : rdv.status === 'scheduled' ? 'Planifié' : rdv.status}</div>
        </div>
      </div>
      
      <div class="cta-container">
        ${actionLink}
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-text">
        <p>Cet email a été envoyé automatiquement par le système de notifications Profitum.</p>
        <p style="margin-top: 12px;">
          <a href="${SecureLinkService.getPlatformUrl(recipientType)}" class="footer-link">Accéder à la plateforme</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
${subject}

Bonjour ${recipientName},

Votre rendez-vous démarre maintenant :

Titre : ${rdv.title || 'Sans titre'}
Client : ${clientName}
Expert : ${expertName}
${apporteurName ? `Apporteur : ${apporteurName}` : ''}
Date : ${rdvDate}
Heure : ${rdvTime}
Statut : ${rdv.status === 'proposed' ? 'Proposé' : rdv.status === 'scheduled' ? 'Planifié' : rdv.status}

Voir le RDV : ${SecureLinkService.getPlatformUrl(recipientType)}${actionPath}
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

