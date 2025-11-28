/**
 * Service de rapport d'activité quotidien pour les admins
 * Génère et envoie un rapport quotidien avec :
 * - RDV de la journée (tous les experts)
 * - Notifications archivées de la journée
 * - RDV du lendemain
 */

import { createClient } from '@supabase/supabase-js';
import { EmailService } from './EmailService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RDVData {
  id: string;
  title: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  meeting_type: string;
  location?: string;
  meeting_url?: string;
  Client?: {
    id: string;
    name?: string;
    company_name?: string;
    email?: string;
  };
  Expert?: {
    id: string;
    name?: string;
    email?: string;
  };
  ApporteurAffaires?: {
    id: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
  };
}

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type?: string;
  priority?: string;
  created_at: string;
  archived_at: string;
}

interface DailyReportData {
  reportDate: string;
  rdvToday: RDVData[];
  notificationsArchived: NotificationData[];
  rdvTomorrow: RDVData[];
}

export class DailyActivityReportService {
  /**
   * Générer le rapport d'activité pour une date donnée
   */
  static async generateDailyReport(date: Date = new Date()): Promise<DailyReportData> {
    // Normaliser la date (midnight UTC)
    const dateStr = date.toISOString().split('T')[0];
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log(`📊 Génération rapport d'activité pour le ${dateStr}`);

    // 1. Récupérer les RDV de la journée (tous les RDV, peu importe le statut)
    const { data: rdvToday, error: rdvTodayError } = await supabase
      .from('RDV')
      .select(`
        id,
        title,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        status,
        meeting_type,
        location,
        meeting_url,
        Client:client_id(id, name, company_name, email),
        Expert:expert_id(id, name, email),
        ApporteurAffaires:apporteur_id(id, first_name, last_name, company_name)
      `)
      .eq('scheduled_date', dateStr)
      .order('scheduled_time', { ascending: true });

    if (rdvTodayError) {
      console.error('❌ Erreur récupération RDV du jour:', rdvTodayError);
    }

    // 2. Récupérer les notifications archivées de la journée
    // Depuis AdminNotification
    const { data: adminNotifications, error: adminNotifError } = await supabase
      .from('AdminNotification')
      .select('id, title, message, type, priority, created_at, archived_at')
      .eq('status', 'archived')
      .gte('archived_at', `${dateStr}T00:00:00.000Z`)
      .lt('archived_at', `${tomorrowStr}T00:00:00.000Z`)
      .order('archived_at', { ascending: false });

    if (adminNotifError) {
      console.error('❌ Erreur récupération AdminNotification:', adminNotifError);
    }

    // Depuis notification (pour les admins)
    const { data: generalNotifications, error: generalNotifError } = await supabase
      .from('notification')
      .select('id, title, message, notification_type as type, priority, created_at, archived_at')
      .eq('user_type', 'admin')
      .eq('status', 'archived')
      .gte('archived_at', `${dateStr}T00:00:00.000Z`)
      .lt('archived_at', `${tomorrowStr}T00:00:00.000Z`)
      .order('archived_at', { ascending: false });

    if (generalNotifError) {
      console.error('❌ Erreur récupération notification:', generalNotifError);
    }

    // Fusionner les notifications
    const notificationsArchived: NotificationData[] = [
      ...(adminNotifications || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        priority: n.priority || 'normal',
        created_at: n.created_at,
        archived_at: n.archived_at
      })),
      ...(generalNotifications || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        priority: n.priority || 'normal',
        created_at: n.created_at,
        archived_at: n.archived_at
      }))
    ];

    // 3. Récupérer les RDV du lendemain
    const { data: rdvTomorrow, error: rdvTomorrowError } = await supabase
      .from('RDV')
      .select(`
        id,
        title,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        status,
        meeting_type,
        location,
        meeting_url,
        Client:client_id(id, name, company_name, email),
        Expert:expert_id(id, name, email),
        ApporteurAffaires:apporteur_id(id, first_name, last_name, company_name)
      `)
      .eq('scheduled_date', tomorrowStr)
      .order('scheduled_time', { ascending: true });

    if (rdvTomorrowError) {
      console.error('❌ Erreur récupération RDV du lendemain:', rdvTomorrowError);
    }

    // Normaliser les données RDV (Supabase retourne les relations comme tableaux)
    const normalizeRDV = (rdv: any): RDVData => ({
      ...rdv,
      Client: Array.isArray(rdv.Client) ? rdv.Client[0] : rdv.Client,
      Expert: Array.isArray(rdv.Expert) ? rdv.Expert[0] : rdv.Expert,
      ApporteurAffaires: Array.isArray(rdv.ApporteurAffaires) ? rdv.ApporteurAffaires[0] : rdv.ApporteurAffaires
    });

    return {
      reportDate: dateStr,
      rdvToday: (rdvToday || []).map(normalizeRDV),
      notificationsArchived,
      rdvTomorrow: (rdvTomorrow || []).map(normalizeRDV)
    };
  }

  /**
   * Formater le rapport en HTML pour l'email
   */
  static formatReportAsHTML(reportData: DailyReportData): string {
    const reportDate = new Date(reportData.reportDate);
    const formattedDate = reportDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formatTime = (time: string) => {
      return time.substring(0, 5); // HH:MM
    };

    const formatStatus = (status: string) => {
      const statusMap: Record<string, { label: string; color: string }> = {
        'scheduled': { label: 'Planifié', color: '#3b82f6' },
        'confirmed': { label: 'Confirmé', color: '#10b981' },
        'completed': { label: 'Terminé', color: '#059669' },
        'cancelled': { label: 'Annulé', color: '#ef4444' },
        'rescheduled': { label: 'Reporté', color: '#8b5cf6' }
      };
      const statusInfo = statusMap[status] || { label: status, color: '#6b7280' };
      return `<span style="color: ${statusInfo.color}; font-weight: 600;">${statusInfo.label}</span>`;
    };

    const formatPriority = (priority: string) => {
      const priorityMap: Record<string, { label: string; color: string }> = {
        'urgent': { label: 'Urgent', color: '#dc2626' },
        'high': { label: 'Élevée', color: '#f59e0b' },
        'normal': { label: 'Normale', color: '#3b82f6' },
        'low': { label: 'Basse', color: '#6b7280' }
      };
      const priorityInfo = priorityMap[priority] || { label: priority, color: '#6b7280' };
      return `<span style="color: ${priorityInfo.color}; font-weight: 600;">${priorityInfo.label}</span>`;
    };

    const getClientName = (rdv: RDVData) => {
      if (rdv.Client?.company_name) return rdv.Client.company_name;
      if (rdv.Client?.name) return rdv.Client.name;
      return 'Client non renseigné';
    };

    const getExpertName = (rdv: RDVData) => {
      if (rdv.Expert?.name) return rdv.Expert.name;
      return 'Expert non assigné';
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Rapport d'activité quotidien - ${formattedDate}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .section { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .section-title { font-size: 20px; font-weight: 700; color: #1f2937; margin-bottom: 15px; }
          .section-subtitle { font-size: 14px; color: #6b7280; margin-bottom: 20px; }
          .item { padding: 15px; background: #f9fafb; border-radius: 6px; margin: 10px 0; border-left: 3px solid #e5e7eb; }
          .item-header { font-weight: 600; color: #1f2937; margin-bottom: 8px; }
          .item-detail { font-size: 14px; color: #4b5563; margin: 4px 0; }
          .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
          .empty-state { text-align: center; padding: 40px; color: #9ca3af; font-style: italic; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 12px; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat { text-align: center; }
          .stat-number { font-size: 32px; font-weight: 700; color: #2563eb; }
          .stat-label { font-size: 14px; color: #6b7280; margin-top: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Rapport d'activité quotidien</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">${formattedDate}</p>
          </div>
          
          <div class="content">
            <!-- Statistiques -->
            <div class="stats">
              <div class="stat">
                <div class="stat-number">${reportData.rdvToday.length}</div>
                <div class="stat-label">RDV aujourd'hui</div>
              </div>
              <div class="stat">
                <div class="stat-number">${reportData.notificationsArchived.length}</div>
                <div class="stat-label">Notifications archivées</div>
              </div>
              <div class="stat">
                <div class="stat-number">${reportData.rdvTomorrow.length}</div>
                <div class="stat-label">RDV demain</div>
              </div>
            </div>

            <!-- RDV de la journée -->
            <div class="section">
              <div class="section-title">📅 Rendez-vous de la journée</div>
              <div class="section-subtitle">Tous les RDV prévus pour aujourd'hui (${reportData.rdvToday.length} RDV)</div>
              ${reportData.rdvToday.length === 0 
                ? '<div class="empty-state">Aucun RDV prévu aujourd\'hui</div>'
                : reportData.rdvToday.map(rdv => `
                  <div class="item">
                    <div class="item-header">${rdv.title || 'RDV sans titre'}</div>
                    <div class="item-detail"><strong>Expert :</strong> ${getExpertName(rdv)}</div>
                    <div class="item-detail"><strong>Client :</strong> ${getClientName(rdv)}</div>
                    <div class="item-detail"><strong>Heure :</strong> ${formatTime(rdv.scheduled_time)} (${rdv.duration_minutes || 60} min)</div>
                    <div class="item-detail"><strong>Type :</strong> ${rdv.meeting_type || 'Non spécifié'}</div>
                    <div class="item-detail"><strong>Statut :</strong> ${formatStatus(rdv.status)}</div>
                    ${rdv.location ? `<div class="item-detail"><strong>Lieu :</strong> ${rdv.location}</div>` : ''}
                    ${rdv.meeting_url ? `<div class="item-detail"><strong>Lien :</strong> <a href="${rdv.meeting_url}">${rdv.meeting_url}</a></div>` : ''}
                  </div>
                `).join('')
              }
            </div>

            <!-- Notifications archivées -->
            <div class="section">
              <div class="section-title">📋 Notifications archivées</div>
              <div class="section-subtitle">Notifications marquées comme archivées aujourd'hui (${reportData.notificationsArchived.length} notifications)</div>
              ${reportData.notificationsArchived.length === 0
                ? '<div class="empty-state">Aucune notification archivée aujourd\'hui</div>'
                : reportData.notificationsArchived.map(notif => `
                  <div class="item">
                    <div class="item-header">${notif.title}</div>
                    <div class="item-detail">${notif.message}</div>
                    <div class="item-detail"><strong>Type :</strong> ${notif.type || 'Non spécifié'}</div>
                    <div class="item-detail"><strong>Priorité :</strong> ${formatPriority(notif.priority || 'normal')}</div>
                    <div class="item-detail" style="font-size: 12px; color: #9ca3af;">Archivée à ${new Date(notif.archived_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                `).join('')
              }
            </div>

            <!-- RDV du lendemain -->
            <div class="section">
              <div class="section-title">🔜 Rendez-vous de demain</div>
              <div class="section-subtitle">RDV prévus pour demain (${reportData.rdvTomorrow.length} RDV)</div>
              ${reportData.rdvTomorrow.length === 0
                ? '<div class="empty-state">Aucun RDV prévu demain</div>'
                : reportData.rdvTomorrow.map(rdv => `
                  <div class="item">
                    <div class="item-header">${rdv.title || 'RDV sans titre'}</div>
                    <div class="item-detail"><strong>Expert :</strong> ${getExpertName(rdv)}</div>
                    <div class="item-detail"><strong>Client :</strong> ${getClientName(rdv)}</div>
                    <div class="item-detail"><strong>Heure :</strong> ${formatTime(rdv.scheduled_time)} (${rdv.duration_minutes || 60} min)</div>
                    <div class="item-detail"><strong>Type :</strong> ${rdv.meeting_type || 'Non spécifié'}</div>
                    <div class="item-detail"><strong>Statut :</strong> ${formatStatus(rdv.status)}</div>
                    ${rdv.location ? `<div class="item-detail"><strong>Lieu :</strong> ${rdv.location}</div>` : ''}
                    ${rdv.meeting_url ? `<div class="item-detail"><strong>Lien :</strong> <a href="${rdv.meeting_url}">${rdv.meeting_url}</a></div>` : ''}
                  </div>
                `).join('')
              }
            </div>

            <div class="footer">
              <p>Profitum - Plateforme de gestion des aides financières</p>
              <p style="font-size: 11px; color: #9ca3af;">Rapport généré automatiquement le ${new Date().toLocaleString('fr-FR')}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Envoyer le rapport d'activité quotidien à un admin
   */
  static async sendDailyReport(adminEmail: string, adminName: string, date?: Date): Promise<boolean> {
    try {
      console.log(`📧 Génération et envoi du rapport d'activité pour ${adminEmail}`);

      // Générer le rapport
      const reportData = await this.generateDailyReport(date);

      // Formater en HTML
      const html = this.formatReportAsHTML(reportData);

      // Générer la version texte
      const text = `
Rapport d'activité quotidien - ${new Date(reportData.reportDate).toLocaleDateString('fr-FR')}

RDV de la journée (${reportData.rdvToday.length}) :
${reportData.rdvToday.map(rdv => `- ${rdv.title || 'RDV'} : ${rdv.scheduled_time} avec ${rdv.Expert?.name || 'Expert'} et ${rdv.Client?.company_name || rdv.Client?.name || 'Client'}`).join('\n') || 'Aucun RDV'}

Notifications archivées (${reportData.notificationsArchived.length}) :
${reportData.notificationsArchived.map(n => `- ${n.title} : ${n.message}`).join('\n') || 'Aucune notification'}

RDV du lendemain (${reportData.rdvTomorrow.length}) :
${reportData.rdvTomorrow.map(rdv => `- ${rdv.title || 'RDV'} : ${rdv.scheduled_time} avec ${rdv.Expert?.name || 'Expert'} et ${rdv.Client?.company_name || rdv.Client?.name || 'Client'}`).join('\n') || 'Aucun RDV'}
      `.trim();

      // Envoyer l'email
      const subject = `Rapport d'activité quotidien - ${new Date(reportData.reportDate).toLocaleDateString('fr-FR')}`;
      
      // Utiliser la méthode privée sendEmail via une méthode publique
      // On va créer une méthode publique dans EmailService pour cela
      const success = await EmailService.sendDailyReportEmail(adminEmail, subject, html, text);

      if (success) {
        console.log(`✅ Rapport d'activité envoyé avec succès à ${adminEmail}`);
      } else {
        console.error(`❌ Échec envoi rapport d'activité à ${adminEmail}`);
      }

      return success;

    } catch (error: any) {
      console.error('❌ Erreur génération/envoi rapport d\'activité:', error);
      return false;
    }
  }
}

