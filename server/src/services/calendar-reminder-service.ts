import { createClient } from '@supabase/supabase-js';
import { NotificationService } from './NotificationService';
import { EmailService } from './EmailService';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class CalendarReminderService {
  constructor() {
    // Initialisation simplifiée
  }

  /**
   * Vérifier et envoyer les rappels d'événements
   */
  async processReminders(): Promise<void> {
    try {
      const now = new Date();
      
      // Récupérer tous les rappels non envoyés avec leurs RDV
      const { data: reminders, error } = await supabase
        .from('RDV_Reminders')
        .select(`
          *,
          RDV!rdv_id (
            id,
            title,
            description,
            scheduled_date,
            scheduled_time,
            duration_minutes,
            location,
            meeting_url,
            created_by,
            client_id,
            expert_id
          )
        `)
        .eq('status', 'pending')
        .order('minutes_before', { ascending: true });

      if (error) {
        console.error('❌ Erreur récupération rappels:', error);
        return;
      }

      if (!reminders || reminders.length === 0) {
        // Ne pas logger si aucun rappel à traiter pour éviter les logs répétés
        return;
      }

      console.log(`📅 Traitement de ${reminders.length} rappel(s) d'événement(s)`);

      for (const reminder of reminders) {
        await this.processReminder(reminder, now);
      }

    } catch (error) {
      console.error('❌ Erreur traitement rappels:', error);
    }
  }

  /**
   * Traiter un rappel spécifique
   */
  private async processReminder(reminder: any, now: Date): Promise<void> {
    try {
      const event = reminder.RDV;
      if (!event) {
        console.warn('⚠️ Événement non trouvé pour le rappel:', reminder.id);
        return;
      }

      const eventStart = new Date(`${event.scheduled_date}T${event.scheduled_time}`);
      const reminderTime = new Date(eventStart.getTime() - (reminder.minutes_before * 60 * 1000));

      // Vérifier si c'est le moment d'envoyer le rappel
      if (now >= reminderTime && now <= eventStart) {
        await this.sendReminderNotification(reminder, event);
        
        // Marquer le rappel comme envoyé
        await supabase
          .from('RDV_Reminders')
          .update({
            status: 'sent',
            sent_at: now.toISOString()
          })
          .eq('id', reminder.id);

        console.log(`✅ Rappel envoyé pour l'événement: ${event.title}`);
      }

    } catch (error) {
      console.error('❌ Erreur traitement rappel:', error);
    }
  }

  /**
   * Envoyer la notification de rappel
   */
  private async sendReminderNotification(reminder: any, event: any): Promise<void> {
    try {
      const eventStart = new Date(`${event.scheduled_date}T${event.scheduled_time}`);
      const now = new Date();
      const timeUntilEvent = Math.round((eventStart.getTime() - now.getTime()) / (1000 * 60));

      // Déterminer les destinataires
      const recipients = await this.getEventRecipients(event);

      for (const recipient of recipients) {
        // Notification système
        await NotificationService.sendSystemNotification({
          user_id: recipient.user_id,
          title: 'Rappel événement calendrier',
          message: `Rappel pour l'événement "${event.title}" dans ${this.formatReminderTime(timeUntilEvent)}`,
          type: 'system',
          event_title: event.title,
          event_date: eventStart.toLocaleDateString('fr-FR'),
          event_time: eventStart.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          event_location: event.location || 'Non spécifié',
          reminder_time: this.formatReminderTime(timeUntilEvent),
          event_url: `${process.env.FRONTEND_URL}/calendar/event/${event.id}`,
          recipient_name: recipient.name || 'Utilisateur'
        });

        // Envoyer un email pour tous les rappels
        await this.sendReminderEmail(recipient, event, timeUntilEvent, eventStart);
      }

    } catch (error) {
      console.error('❌ Erreur envoi notification rappel:', error);
    }
  }

  /**
   * Récupérer les destinataires d'un événement
   */
  private async getEventRecipients(event: any): Promise<Array<{ user_id: string; user_type: string; name: string }>> {
    const recipients: Array<{ user_id: string; user_type: string; name: string }> = [];

    // Ajouter l'organisateur
    if (event.created_by) {
      // Rechercher dans Client
      const { data: clientOrganizer } = await supabase
        .from('Client')
        .select('id, email, name')
        .eq('id', event.created_by)
        .single();

      if (clientOrganizer) {
        recipients.push({
          user_id: clientOrganizer.id,
          user_type: 'client',
          name: clientOrganizer.name || clientOrganizer.email
        });
      } else {
        // Rechercher dans Expert
        const { data: expertOrganizer } = await supabase
          .from('Expert')
          .select('id, email, name')
          .eq('id', event.created_by)
          .single();

        if (expertOrganizer) {
          recipients.push({
            user_id: expertOrganizer.id,
            user_type: 'expert',
            name: expertOrganizer.name || expertOrganizer.email
          });
        }
      }
    }

    // Ajouter les participants
    const { data: participants } = await supabase
      .from('RDV_Participants')
      .select(`
        user_id,
        user_type,
        user_name
      `)
      .eq('rdv_id', event.id);

    if (participants) {
      for (const participant of participants) {
        recipients.push({
          user_id: participant.user_id,
          user_type: participant.user_type,
          name: participant.user_name || 'Participant'
        });
      }
    }

    return recipients;
  }

  /**
   * Formater le temps restant avant l'événement
   */
  private formatReminderTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} jour${days > 1 ? 's' : ''}`;
    }
  }

  /**
   * Créer des rappels automatiques pour un événement
   */
  async createDefaultReminders(eventId: string): Promise<void> {
    try {
      const defaultReminders = [
        { reminder_type: 'email', minutes_before: 1440 }, // 24h avant
        { reminder_type: 'email', minutes_before: 60 },   // 1h avant
        { reminder_type: 'email', minutes_before: 15 }    // 15min avant
      ];

      for (const reminder of defaultReminders) {
        await supabase
          .from('RDV_Reminders')
          .insert({
            rdv_id: eventId,
            reminder_type: reminder.reminder_type,
            minutes_before: reminder.minutes_before,
            status: 'pending'
          });
      }

      console.log(`✅ Rappels par défaut créés pour l'événement: ${eventId}`);

    } catch (error) {
      console.error('❌ Erreur création rappels par défaut:', error);
    }
  }

  /**
   * Supprimer tous les rappels d'un événement
   */
  async deleteEventReminders(eventId: string): Promise<void> {
    try {
      await supabase
        .from('RDV_Reminders')
        .delete()
        .eq('rdv_id', eventId);

      console.log(`✅ Rappels supprimés pour l'événement: ${eventId}`);

    } catch (error) {
      console.error('❌ Erreur suppression rappels:', error);
    }
  }

  /**
   * Vérifier les événements en retard
   */
  async checkOverdueEvents(): Promise<void> {
    try {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toISOString().split('T')[1].substring(0, 8);
      
      // Récupérer les événements en retard (date passée)
      const { data: overdueEvents, error } = await supabase
        .from('RDV')
        .select('*')
        .lt('scheduled_date', currentDate)
        .eq('status', 'scheduled');

      if (error) {
        console.error('❌ Erreur récupération événements en retard:', error);
        return;
      }

      if (!overdueEvents || overdueEvents.length === 0) {
        return;
      }

      console.log(`⚠️ ${overdueEvents.length} événements en retard détectés`);

      for (const event of overdueEvents) {
        await this.handleOverdueEvent(event);
      }

    } catch (error) {
      console.error('❌ Erreur vérification événements en retard:', error);
    }
  }

  /**
   * Gérer un événement en retard
   */
  private async handleOverdueEvent(event: any): Promise<void> {
    try {
      // Marquer l'événement comme terminé
      await supabase
        .from('RDV')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', event.id);

      // Envoyer une notification de fin d'événement
      const recipients = await this.getEventRecipients(event);

      for (const recipient of recipients) {
        await NotificationService.sendSystemNotification({
          user_id: recipient.user_id,
          title: 'Événement terminé',
          message: `L'événement "${event.title}" est maintenant terminé.`,
          type: 'system',
          event_title: event.title,
          event_date: new Date(`${event.scheduled_date}T${event.scheduled_time}`).toLocaleDateString('fr-FR'),
          event_time: new Date(`${event.scheduled_date}T${event.scheduled_time}`).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          event_location: event.location || 'Non spécifié',
          reminder_time: 'Événement terminé',
          event_url: `${process.env.FRONTEND_URL}/calendar/event/${event.id}`,
          recipient_name: recipient.name || 'Utilisateur'
        });
      }

      console.log(`✅ Événement marqué comme terminé: ${event.title}`);

    } catch (error) {
      console.error('❌ Erreur gestion événement en retard:', error);
    }
  }

  /**
   * Envoyer un email de rappel pour un événement
   */
  private async sendReminderEmail(
    recipient: { user_id: string; user_type: string; name: string },
    event: any,
    minutesUntilEvent: number,
    eventStart: Date
  ): Promise<void> {
    try {
      // Récupérer l'email de l'utilisateur selon son type
      let userEmail = '';
      
      if (recipient.user_type === 'admin') {
        const { data: admin } = await supabase
          .from('Admin')
          .select('email')
          .eq('auth_user_id', recipient.user_id)
          .single();
        userEmail = admin?.email || '';
      } else if (recipient.user_type === 'expert') {
        const { data: expert } = await supabase
          .from('Expert')
          .select('email')
          .eq('auth_user_id', recipient.user_id)
          .single();
        userEmail = expert?.email || '';
      } else if (recipient.user_type === 'client') {
        const { data: client } = await supabase
          .from('Client')
          .select('email')
          .eq('id', recipient.user_id)
          .single();
        userEmail = client?.email || '';
      } else if (recipient.user_type === 'apporteur') {
        const { data: apporteur } = await supabase
          .from('ApporteurAffaires')
          .select('email')
          .eq('id', recipient.user_id)
          .single();
        userEmail = apporteur?.email || '';
      }

      if (!userEmail) {
        console.warn(`⚠️ Email non trouvé pour ${recipient.user_type}:${recipient.user_id}`);
        return;
      }

      // Générer le template email
      const { subject, html, text } = this.generateEventReminderEmailTemplate(
        event,
        minutesUntilEvent,
        eventStart,
        recipient.name
      );

      // Envoyer l'email
      await EmailService.sendDailyReportEmail(userEmail, subject, html, text);
      
      console.log(`✅ Email de rappel envoyé à ${userEmail} pour l'événement: ${event.title}`);

    } catch (error) {
      console.error('❌ Erreur envoi email rappel:', error);
    }
  }

  /**
   * Génère le template email pour les rappels d'événements
   */
  private generateEventReminderEmailTemplate(
    event: any,
    minutesUntilEvent: number,
    eventStart: Date,
    recipientName: string
  ): { subject: string; html: string; text: string } {
    const isUrgent = minutesUntilEvent <= 15;
    const urgencyColor = isUrgent ? '#dc2626' : minutesUntilEvent <= 60 ? '#f59e0b' : '#3b82f6';
    const urgencyBg = isUrgent ? '#fef2f2' : minutesUntilEvent <= 60 ? '#fffbeb' : '#eff6ff';
    const icon = isUrgent ? '🚨' : minutesUntilEvent <= 60 ? '⏰' : '📅';

    const timeLabel = minutesUntilEvent < 60 
      ? `${minutesUntilEvent} minute${minutesUntilEvent > 1 ? 's' : ''}`
      : `${Math.floor(minutesUntilEvent / 60)} heure${Math.floor(minutesUntilEvent / 60) > 1 ? 's' : ''}`;

    const subject = `${icon} Rappel : ${event.title} dans ${timeLabel}`;
    const eventUrl = `${process.env.FRONTEND_URL || 'https://app.profitum.fr'}/calendar/event/${event.id}`;

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
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
      background: ${urgencyColor};
      color: white;
      padding: 16px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      margin: 32px 0;
      text-align: center;
      transition: background-color 0.2s;
    }
    .cta-button:hover {
      background: ${this.darkenColor(urgencyColor, 10)};
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
      <div class="header-title">Rappel événement</div>
      <div class="header-subtitle">Dans ${timeLabel}</div>
    </div>
    
    <div class="content">
      <div class="greeting">
        Bonjour ${recipientName || 'Utilisateur'},
      </div>
      
      <div class="alert-box">
        <div class="alert-title">
          ${isUrgent ? 'Événement imminent' : 'Rappel d\'événement'}
        </div>
        <div class="alert-text">
          Vous avez un événement prévu dans ${timeLabel} : <strong>${event.title || 'Sans titre'}</strong>
        </div>
      </div>
      
      <div class="info-card">
        <div class="info-row">
          <div class="info-label">Titre</div>
          <div class="info-value">${event.title || 'Sans titre'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Date</div>
          <div class="info-value">${eventStart.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Heure</div>
          <div class="info-value">${eventStart.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Durée</div>
          <div class="info-value">${event.duration_minutes || 60} minutes</div>
        </div>
        ${event.location ? `
        <div class="info-row">
          <div class="info-label">Lieu</div>
          <div class="info-value">${event.location}</div>
        </div>
        ` : ''}
        ${event.meeting_url ? `
        <div class="info-row">
          <div class="info-label">Lien de réunion</div>
          <div class="info-value"><a href="${event.meeting_url}">${event.meeting_url}</a></div>
        </div>
        ` : ''}
        ${event.description ? `
        <div class="info-row">
          <div class="info-label">Description</div>
          <div class="info-value">${event.description}</div>
        </div>
        ` : ''}
      </div>
      
      <div class="cta-container">
        <a href="${eventUrl}" class="cta-button">
          Voir l'événement
        </a>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-text">
        <p>Cet email a été envoyé automatiquement par le système de rappels Profitum.</p>
        <p style="margin-top: 12px;">
          <a href="${process.env.FRONTEND_URL || 'https://app.profitum.fr'}" class="footer-link">Accéder à la plateforme</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
${subject}

Bonjour ${recipientName || 'Utilisateur'},

Vous avez un événement prévu dans ${timeLabel} :

Titre : ${event.title || 'Sans titre'}
Date : ${eventStart.toLocaleDateString('fr-FR')}
Heure : ${eventStart.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
Durée : ${event.duration_minutes || 60} minutes
${event.location ? `Lieu : ${event.location}` : ''}
${event.meeting_url ? `Lien : ${event.meeting_url}` : ''}

Voir l'événement : ${eventUrl}
    `.trim();

    return { subject, html, text };
  }

  /**
   * Fonction utilitaire pour assombrir une couleur hex
   */
  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) - amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) - amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) - amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }
} 