/**
 * Service de rapport matinal
 * Envoie à 7h :
 * - Les RDV du jour
 * - Toutes les notifications non lues actuelles (hors RDV)
 * - Toutes les notifications lues hors RDV
 */

import { createClient } from '@supabase/supabase-js';
import { EmailService } from './EmailService';
import { SecureLinkService } from './secure-link-service';
import { NotificationPreferencesChecker } from './notification-preferences-checker';

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
  notification_type: string;
  priority: string;
  created_at: string;
  is_read: boolean;
  action_url?: string;
}

interface OverdueRDV {
  id: string;
  title: string;
  scheduled_date: string;
  scheduled_time: string;
  hoursOverdue: number;
  threshold: '24h' | '48h' | '120h';
  Client?: {
    name?: string;
    company_name?: string;
  };
  Expert?: {
    name?: string;
  };
}

interface PendingAction {
  dossier_id: string;
  actionType: string;
  daysWaiting: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  Client?: {
    name?: string;
    company_name?: string;
  };
  ProduitEligible?: {
    nom?: string;
  };
}

interface PendingContactLead {
  id: string;
  notification_type: 'contact_message' | 'lead_to_treat';
  hoursOverdue: number;
  threshold: '24h' | '48h' | '120h';
  metadata: {
    name?: string;
    email?: string;
  };
}

interface EscalatedNotification {
  id: string;
  notification_type: string;
  escalation_level: number;
  priority: string;
  title: string;
  message: string;
  created_at: string;
}

interface MorningReportData {
  reportDate: string;
  rdvToday: RDVData[];
  unreadNotifications: NotificationData[];
  readNotifications: NotificationData[];
  overdueRDVs: OverdueRDV[];
  pendingActions: PendingAction[];
  pendingContactsLeads: PendingContactLead[];
  escalatedNotifications: EscalatedNotification[];
  stats: {
    totalRDVToday: number;
    totalUnreadNotifications: number;
    totalReadNotifications: number;
    totalOverdueRDVs: number;
    totalPendingActions: number;
    totalPendingContactsLeads: number;
    totalEscalatedNotifications: number;
  };
}

export class MorningReportService {
  /**
   * Générer le rapport matinal pour une date donnée
   */
  static async generateMorningReport(date: Date = new Date()): Promise<MorningReportData> {
    const dateStr = date.toISOString().split('T')[0];

    console.log(`🌅 Génération rapport matinal pour le ${dateStr}`);

    // 1. Récupérer les RDV du jour
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

    const normalizeRDV = (rdv: any): RDVData => ({
      ...rdv,
      Client: Array.isArray(rdv.Client) ? rdv.Client[0] : rdv.Client,
      Expert: Array.isArray(rdv.Expert) ? rdv.Expert[0] : rdv.Expert,
      ApporteurAffaires: Array.isArray(rdv.ApporteurAffaires) ? rdv.ApporteurAffaires[0] : rdv.ApporteurAffaires
    });

    // 2. Récupérer toutes les notifications non lues (hors RDV)
    const { data: unreadNotifications, error: unreadError } = await supabase
      .from('notification')
      .select('id, title, message, notification_type, priority, created_at, is_read, action_url, action_data')
      .eq('user_type', 'admin')
      .eq('is_read', false)
      .neq('notification_type', 'rdv_reminder')
      .neq('notification_type', 'rdv_confirmed')
      .neq('notification_type', 'rdv_cancelled')
      .order('created_at', { ascending: false })
      .limit(100);

    if (unreadError) {
      console.error('❌ Erreur récupération notifications non lues:', unreadError);
    }

    // 3. Récupérer toutes les notifications lues (hors RDV) - seulement celles récentes (30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateLimit = thirtyDaysAgo.toISOString();

    const { data: readNotifications, error: readError } = await supabase
      .from('notification')
      .select('id, title, message, notification_type, priority, created_at, is_read, action_url, action_data')
      .eq('user_type', 'admin')
      .eq('is_read', true)
      .neq('notification_type', 'rdv_reminder')
      .neq('notification_type', 'rdv_confirmed')
      .neq('notification_type', 'rdv_cancelled')
      .gte('created_at', dateLimit)
      .order('created_at', { ascending: false })
      .limit(100);

    if (readError) {
      console.error('❌ Erreur récupération notifications lues:', readError);
    }

    // 4. Récupérer les RDV en retard (24h, 48h, 120h)
    const now = new Date();
    const overdueRDVs = await this.getOverdueRDVs(now);

    // 5. Récupérer les dossiers nécessitant une action
    const pendingActions = await this.getPendingActions(now);

    // 6. Récupérer les contacts/leads en attente
    const pendingContactsLeads = await this.getPendingContactsLeads(now);

    // 7. Récupérer les notifications escaladées
    const escalatedNotifications = await this.getEscalatedNotifications();

    return {
      reportDate: dateStr,
      rdvToday: (rdvToday || []).map(normalizeRDV),
      unreadNotifications: (unreadNotifications || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        notification_type: n.notification_type,
        priority: n.priority || 'normal',
        created_at: n.created_at,
        is_read: n.is_read,
        action_url: n.action_url || (n.action_data?.action_url || null)
      })),
      readNotifications: (readNotifications || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        notification_type: n.notification_type,
        priority: n.priority || 'normal',
        created_at: n.created_at,
        is_read: n.is_read,
        action_url: n.action_url || (n.action_data?.action_url || null)
      })),
      overdueRDVs,
      pendingActions,
      pendingContactsLeads,
      escalatedNotifications,
      stats: {
        totalRDVToday: (rdvToday || []).length,
        totalUnreadNotifications: (unreadNotifications || []).length,
        totalReadNotifications: (readNotifications || []).length,
        totalOverdueRDVs: overdueRDVs.length,
        totalPendingActions: pendingActions.length,
        totalPendingContactsLeads: pendingContactsLeads.length,
        totalEscalatedNotifications: escalatedNotifications.length
      }
    };
  }

  /**
   * Récupérer les RDV en retard (24h, 48h, 120h)
   */
  private static async getOverdueRDVs(now: Date): Promise<OverdueRDV[]> {
    try {
      const { data: rdvs, error } = await supabase
        .from('RDV')
        .select(`
          id,
          title,
          scheduled_date,
          scheduled_time,
          status,
          Client:client_id(id, name, company_name),
          Expert:expert_id(id, name)
        `)
        .in('status', ['proposed', 'scheduled'])
        .limit(500);

      if (error) {
        console.error('❌ Erreur récupération RDV en retard:', error);
        return [];
      }

      const overdueRDVs: OverdueRDV[] = [];

      for (const rdv of rdvs || []) {
        if (!rdv.scheduled_date || !rdv.scheduled_time) continue;

        const scheduledDateTime = new Date(`${rdv.scheduled_date}T${rdv.scheduled_time}`);
        
        // Vérifier si le RDV est passé
        if (scheduledDateTime > now) continue;

        const hoursElapsed = (now.getTime() - scheduledDateTime.getTime()) / (1000 * 60 * 60);
        
        let threshold: '24h' | '48h' | '120h' | null = null;
        if (hoursElapsed >= 120) {
          threshold = '120h';
        } else if (hoursElapsed >= 48) {
          threshold = '48h';
        } else if (hoursElapsed >= 24) {
          threshold = '24h';
        }

        if (threshold) {
          overdueRDVs.push({
            id: rdv.id,
            title: rdv.title || 'RDV sans titre',
            scheduled_date: rdv.scheduled_date,
            scheduled_time: rdv.scheduled_time,
            hoursOverdue: Math.floor(hoursElapsed),
            threshold,
            Client: Array.isArray(rdv.Client) ? rdv.Client[0] : rdv.Client,
            Expert: Array.isArray(rdv.Expert) ? rdv.Expert[0] : rdv.Expert
          });
        }
      }

      // Grouper par seuil
      return overdueRDVs.sort((a, b) => {
        const thresholdOrder = { '120h': 3, '48h': 2, '24h': 1 };
        return (thresholdOrder[b.threshold] || 0) - (thresholdOrder[a.threshold] || 0);
      });
    } catch (error) {
      console.error('❌ Erreur récupération RDV en retard:', error);
      return [];
    }
  }

  /**
   * Récupérer les dossiers nécessitant une action
   */
  private static async getPendingActions(now: Date): Promise<PendingAction[]> {
    try {
      // Récupérer les dossiers avec actionType
      const { data: dossiers, error } = await supabase
        .from('Dossier')
        .select(`
          id,
          actionType,
          updated_at,
          Client:client_id(id, name, company_name),
          ProduitEligible:produit_id(nom)
        `)
        .not('actionType', 'is', null)
        .limit(500);

      if (error) {
        console.error('❌ Erreur récupération dossiers avec actions:', error);
        return [];
      }

      const pendingActions: PendingAction[] = [];

      for (const dossier of dossiers || []) {
        if (!dossier.actionType || !dossier.updated_at) continue;

        const updatedAt = new Date(dossier.updated_at);
        const daysWaiting = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

        // Déterminer la priorité selon les jours d'attente
        let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (daysWaiting >= 15) {
          priority = 'critical';
        } else if (daysWaiting >= 10) {
          priority = 'high';
        } else if (daysWaiting >= 5) {
          priority = 'medium';
        }

        pendingActions.push({
          dossier_id: dossier.id,
          actionType: dossier.actionType,
          daysWaiting,
          priority,
          Client: Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client,
          ProduitEligible: Array.isArray(dossier.ProduitEligible) ? dossier.ProduitEligible[0] : dossier.ProduitEligible
        });
      }

      // Trier par priorité et jours d'attente
      return pendingActions.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        if (priorityDiff !== 0) return priorityDiff;
        return b.daysWaiting - a.daysWaiting;
      });
    } catch (error) {
      console.error('❌ Erreur récupération dossiers avec actions:', error);
      return [];
    }
  }

  /**
   * Récupérer les contacts/leads en attente
   */
  private static async getPendingContactsLeads(now: Date): Promise<PendingContactLead[]> {
    try {
      const { data: notifications, error } = await supabase
        .from('notification')
        .select('id, notification_type, created_at, metadata')
        .in('notification_type', ['contact_message', 'lead_to_treat'])
        .eq('is_read', false)
        .in('status', ['unread', 'active'])
        .limit(500);

      if (error) {
        console.error('❌ Erreur récupération contacts/leads:', error);
        return [];
      }

      const pendingContactsLeads: PendingContactLead[] = [];

      for (const notification of notifications || []) {
        const createdAt = new Date(notification.created_at);
        const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        
        let threshold: '24h' | '48h' | '120h' | null = null;
        if (hoursElapsed >= 120) {
          threshold = '120h';
        } else if (hoursElapsed >= 48) {
          threshold = '48h';
        } else if (hoursElapsed >= 24) {
          threshold = '24h';
        }

        if (threshold) {
          pendingContactsLeads.push({
            id: notification.id,
            notification_type: notification.notification_type as 'contact_message' | 'lead_to_treat',
            hoursOverdue: Math.floor(hoursElapsed),
            threshold,
            metadata: notification.metadata || {}
          });
        }
      }

      // Trier par seuil
      return pendingContactsLeads.sort((a, b) => {
        const thresholdOrder = { '120h': 3, '48h': 2, '24h': 1 };
        return (thresholdOrder[b.threshold] || 0) - (thresholdOrder[a.threshold] || 0);
      });
    } catch (error) {
      console.error('❌ Erreur récupération contacts/leads:', error);
      return [];
    }
  }

  /**
   * Récupérer les notifications escaladées
   */
  private static async getEscalatedNotifications(): Promise<EscalatedNotification[]> {
    try {
      const { data: notifications, error } = await supabase
        .from('notification')
        .select('id, notification_type, priority, title, message, created_at, metadata')
        .eq('user_type', 'admin')
        .eq('status', 'late')
        .not('metadata->escalation_level', 'is', null)
        .limit(100);

      if (error) {
        console.error('❌ Erreur récupération notifications escaladées:', error);
        return [];
      }

      return (notifications || []).map((n: any) => ({
        id: n.id,
        notification_type: n.notification_type,
        escalation_level: Number(n.metadata?.escalation_level || 0),
        priority: n.priority || 'medium',
        title: n.title,
        message: n.message,
        created_at: n.created_at
      })).sort((a, b) => b.escalation_level - a.escalation_level);
    } catch (error) {
      console.error('❌ Erreur récupération notifications escaladées:', error);
      return [];
    }
  }

  /**
   * Formater le rapport en HTML
   */
  static formatReportAsHTML(reportData: MorningReportData, adminName: string, adminId?: string, adminType?: string): string {
    const reportDate = new Date(reportData.reportDate);
    const formattedDate = reportDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formatTime = (time: string) => time.substring(0, 5);
    const getClientName = (rdv: RDVData) => rdv.Client?.company_name || rdv.Client?.name || 'Client non renseigné';
    const getExpertName = (rdv: RDVData) => rdv.Expert?.name || 'Expert non assigné';

    const priorityColors = {
      urgent: { bg: '#fef2f2', border: '#dc2626', text: '#991b1b', icon: '🚨' },
      high: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', icon: '⚠️' },
      medium: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', icon: '📋' },
      low: { bg: '#f9fafb', border: '#6b7280', text: '#374151', icon: 'ℹ️' }
    };

    const formatNotificationDate = (dateStr: string) => {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      } else if (diffHours > 0) {
        return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
      } else {
        return "Aujourd'hui";
      }
    };

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport matinal - ${formattedDate}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      padding: 40px 20px;
    }
    .email-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: white;
      padding: 60px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header h1 {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 10px;
      letter-spacing: -1px;
    }
    .header .date {
      font-size: 18px;
      opacity: 0.95;
      font-weight: 400;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 32px;
      background: #f9fafb;
    }
    .stat-card {
      background: white;
      padding: 24px;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .stat-number {
      font-size: 42px;
      font-weight: 700;
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
    }
    .stat-label {
      font-size: 14px;
      color: #6b7280;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section {
      padding: 40px;
      border-bottom: 1px solid #e5e7eb;
    }
    .section:last-child {
      border-bottom: none;
    }
    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 24px;
    }
    .section-icon {
      font-size: 32px;
      margin-right: 16px;
    }
    .section-title {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
    }
    .section-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin-top: 4px;
    }
    .rdv-item, .notification-item {
      background: white;
      padding: 20px 24px;
      margin-bottom: 16px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border-left: 4px solid #3b82f6;
    }
    .notification-item {
      border-left-color: #6b7280;
    }
    .notification-item.unread {
      border-left-color: #dc2626;
      background: #fef2f2;
    }
    .rdv-header, .notification-header {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }
    .rdv-details, .notification-details {
      font-size: 14px;
      color: #4b5563;
      margin: 4px 0;
    }
    .notification-meta {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 8px;
    }
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #9ca3af;
    }
    .empty-state-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    .empty-state-text {
      font-size: 16px;
      font-style: italic;
    }
    .footer {
      background: #f9fafb;
      padding: 32px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.6;
    }
    .footer-link {
      color: #f59e0b;
      text-decoration: none;
      font-weight: 600;
    }
    @media only screen and (max-width: 600px) {
      .email-container { margin: 0; border-radius: 0; }
      .header { padding: 40px 20px; }
      .section { padding: 24px 20px; }
      .stats-grid { grid-template-columns: 1fr; padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🌅 Rapport Matinal</h1>
      <div class="date">${formattedDate}</div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">${reportData.stats.totalRDVToday}</div>
        <div class="stat-label">RDV aujourd'hui</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${reportData.stats.totalUnreadNotifications}</div>
        <div class="stat-label">Notifications non lues</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${reportData.stats.totalReadNotifications}</div>
        <div class="stat-label">Notifications lues</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${reportData.stats.totalOverdueRDVs}</div>
        <div class="stat-label">RDV en retard</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${reportData.stats.totalPendingActions}</div>
        <div class="stat-label">Actions en attente</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${reportData.stats.totalPendingContactsLeads}</div>
        <div class="stat-label">Contacts/Leads</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${reportData.stats.totalEscalatedNotifications}</div>
        <div class="stat-label">Notifications escaladées</div>
      </div>
    </div>

    ${reportData.rdvToday.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📅</div>
        <div>
          <div class="section-title">RDV du jour</div>
          <div class="section-subtitle">${reportData.rdvToday.length} rendez-vous prévu${reportData.rdvToday.length > 1 ? 's' : ''}</div>
        </div>
      </div>
      ${reportData.rdvToday.map(rdv => `
        <div class="rdv-item">
          <div class="rdv-header">${rdv.title || 'RDV sans titre'}</div>
          <div class="rdv-details"><strong>Heure:</strong> ${formatTime(rdv.scheduled_time)} (${rdv.duration_minutes || 60} min)</div>
          <div class="rdv-details"><strong>Expert:</strong> ${getExpertName(rdv)}</div>
          <div class="rdv-details"><strong>Client:</strong> ${getClientName(rdv)}</div>
          <div class="rdv-details"><strong>Type:</strong> ${rdv.meeting_type || 'Non spécifié'}</div>
          ${rdv.location ? `<div class="rdv-details"><strong>Lieu:</strong> ${rdv.location}</div>` : ''}
          ${rdv.meeting_url ? `<div class="rdv-details"><strong>Lien:</strong> <a href="${rdv.meeting_url}" style="color: #3b82f6;">${rdv.meeting_url}</a></div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : `
    <div class="section">
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <div class="empty-state-text">Aucun RDV prévu aujourd'hui</div>
      </div>
    </div>
    `}

    ${reportData.unreadNotifications.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🔔</div>
        <div>
          <div class="section-title">Notifications non lues</div>
          <div class="section-subtitle">${reportData.unreadNotifications.length} notification${reportData.unreadNotifications.length > 1 ? 's' : ''} nécessitant votre attention</div>
        </div>
      </div>
      ${reportData.unreadNotifications.map(notif => {
        const priorityStyle = priorityColors[notif.priority as keyof typeof priorityColors] || priorityColors.medium;
        return `
          <div class="notification-item unread" style="border-left-color: ${priorityStyle.border};">
            <div class="notification-header">${notif.title}</div>
            <div class="notification-details">${notif.message}</div>
            <div class="notification-meta">${formatNotificationDate(notif.created_at)} • ${notif.notification_type}</div>
            ${notif.action_url ? `<a href="${SecureLinkService.generateSimpleLink(notif.action_url, adminId, adminType)}" style="color: #3b82f6; text-decoration: none; font-weight: 600; margin-top: 8px; display: inline-block;">Voir les détails →</a>` : ''}
          </div>
        `;
      }).join('')}
    </div>
    ` : ''}

    ${reportData.readNotifications.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📋</div>
        <div>
          <div class="section-title">Notifications lues récentes</div>
          <div class="section-subtitle">${reportData.readNotifications.length} notification${reportData.readNotifications.length > 1 ? 's' : ''} déjà consultée${reportData.readNotifications.length > 1 ? 's' : ''}</div>
        </div>
      </div>
      ${reportData.readNotifications.map(notif => {
        const priorityStyle = priorityColors[notif.priority as keyof typeof priorityColors] || priorityColors.medium;
        return `
          <div class="notification-item" style="border-left-color: ${priorityStyle.border};">
            <div class="notification-header">${notif.title}</div>
            <div class="notification-details">${notif.message}</div>
            <div class="notification-meta">${formatNotificationDate(notif.created_at)} • ${notif.notification_type}</div>
            ${notif.action_url ? `<a href="${SecureLinkService.generateSimpleLink(notif.action_url, adminId, adminType)}" style="color: #3b82f6; text-decoration: none; font-weight: 600; margin-top: 8px; display: inline-block;">Voir les détails →</a>` : ''}
          </div>
        `;
      }).join('')}
    </div>
    ` : ''}

    ${reportData.overdueRDVs.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🚨</div>
        <div>
          <div class="section-title">RDV en retard</div>
          <div class="section-subtitle">${reportData.overdueRDVs.length} RDV non traité${reportData.overdueRDVs.length > 1 ? 's' : ''}</div>
        </div>
      </div>
      ${Object.entries({
        '120h': reportData.overdueRDVs.filter(r => r.threshold === '120h'),
        '48h': reportData.overdueRDVs.filter(r => r.threshold === '48h'),
        '24h': reportData.overdueRDVs.filter(r => r.threshold === '24h')
      }).filter(([_, rdvs]) => rdvs.length > 0).map(([threshold, rdvs]) => `
        <div style="margin-bottom: 24px;">
          <h4 style="font-size: 16px; font-weight: 600; color: ${threshold === '120h' ? '#dc2626' : threshold === '48h' ? '#f59e0b' : '#3b82f6'}; margin-bottom: 12px;">
            ${threshold === '120h' ? '🚨 Critique' : threshold === '48h' ? '⚠️ Important' : '📋 Normal'} - ${threshold} de retard
          </h4>
          ${rdvs.map(rdv => `
            <div class="rdv-item" style="border-left-color: ${threshold === '120h' ? '#dc2626' : threshold === '48h' ? '#f59e0b' : '#3b82f6'};">
              <div class="rdv-header">${rdv.title}</div>
              <div class="rdv-details"><strong>Client:</strong> ${rdv.Client?.company_name || rdv.Client?.name || 'Non renseigné'}</div>
              <div class="rdv-details"><strong>Expert:</strong> ${rdv.Expert?.name || 'Non assigné'}</div>
              <div class="rdv-details"><strong>Date prévue:</strong> ${new Date(rdv.scheduled_date).toLocaleDateString('fr-FR')} à ${formatTime(rdv.scheduled_time)}</div>
              <div class="rdv-details"><strong>Retard:</strong> ${rdv.hoursOverdue} heure${rdv.hoursOverdue > 1 ? 's' : ''}</div>
              <a href="${SecureLinkService.generateSimpleLink(`/admin/rdv/${rdv.id}`, adminId, adminType)}" style="color: #3b82f6; text-decoration: none; font-weight: 600; margin-top: 8px; display: inline-block;">Voir le RDV →</a>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${reportData.pendingActions.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">⚡</div>
        <div>
          <div class="section-title">Dossiers nécessitant une action</div>
          <div class="section-subtitle">${reportData.pendingActions.length} dossier${reportData.pendingActions.length > 1 ? 's' : ''} avec actions en attente</div>
        </div>
      </div>
      ${Object.entries({
        critical: reportData.pendingActions.filter(a => a.priority === 'critical'),
        high: reportData.pendingActions.filter(a => a.priority === 'high'),
        medium: reportData.pendingActions.filter(a => a.priority === 'medium'),
        low: reportData.pendingActions.filter(a => a.priority === 'low')
      }).filter(([_, actions]) => actions.length > 0).map(([priority, actions]) => `
        <div style="margin-bottom: 24px;">
          <h4 style="font-size: 16px; font-weight: 600; color: ${priority === 'critical' ? '#dc2626' : priority === 'high' ? '#f59e0b' : priority === 'medium' ? '#3b82f6' : '#6b7280'}; margin-bottom: 12px;">
            ${priority === 'critical' ? '🚨 Critique' : priority === 'high' ? '⚠️ Élevée' : priority === 'medium' ? '📋 Moyenne' : 'ℹ️ Faible'} - ${actions.length} dossier${actions.length > 1 ? 's' : ''}
          </h4>
          ${actions.map(action => `
            <div class="rdv-item" style="border-left-color: ${priority === 'critical' ? '#dc2626' : priority === 'high' ? '#f59e0b' : priority === 'medium' ? '#3b82f6' : '#6b7280'};">
              <div class="rdv-header">${action.actionType}</div>
              <div class="rdv-details"><strong>Client:</strong> ${action.Client?.company_name || action.Client?.name || 'Non renseigné'}</div>
              <div class="rdv-details"><strong>Produit:</strong> ${action.ProduitEligible?.nom || 'Non renseigné'}</div>
              <div class="rdv-details"><strong>Jours d'attente:</strong> ${action.daysWaiting} jour${action.daysWaiting > 1 ? 's' : ''}</div>
              <a href="${SecureLinkService.generateSimpleLink(`/admin/dossiers/${action.dossier_id}`, adminId, adminType)}" style="color: #3b82f6; text-decoration: none; font-weight: 600; margin-top: 8px; display: inline-block;">Voir le dossier →</a>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${reportData.pendingContactsLeads.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📧</div>
        <div>
          <div class="section-title">Contacts/Leads en attente</div>
          <div class="section-subtitle">${reportData.pendingContactsLeads.length} contact${reportData.pendingContactsLeads.length > 1 ? 's' : ''}/lead${reportData.pendingContactsLeads.length > 1 ? 's' : ''} non traité${reportData.pendingContactsLeads.length > 1 ? 's' : ''}</div>
        </div>
      </div>
      ${Object.entries({
        '120h': reportData.pendingContactsLeads.filter(c => c.threshold === '120h'),
        '48h': reportData.pendingContactsLeads.filter(c => c.threshold === '48h'),
        '24h': reportData.pendingContactsLeads.filter(c => c.threshold === '24h')
      }).filter(([_, contacts]) => contacts.length > 0).map(([threshold, contacts]) => `
        <div style="margin-bottom: 24px;">
          <h4 style="font-size: 16px; font-weight: 600; color: ${threshold === '120h' ? '#dc2626' : threshold === '48h' ? '#f59e0b' : '#3b82f6'}; margin-bottom: 12px;">
            ${threshold === '120h' ? '🚨 Critique' : threshold === '48h' ? '⚠️ Important' : '📋 Normal'} - ${threshold} de retard
          </h4>
          ${contacts.map(contact => `
            <div class="notification-item" style="border-left-color: ${threshold === '120h' ? '#dc2626' : threshold === '48h' ? '#f59e0b' : '#3b82f6'};">
              <div class="notification-header">${contact.notification_type === 'contact_message' ? '📧 Message de contact' : '🎯 Lead à traiter'}</div>
              <div class="notification-details"><strong>Nom:</strong> ${contact.metadata?.name || 'Non renseigné'}</div>
              <div class="notification-details"><strong>Email:</strong> ${contact.metadata?.email || 'Non renseigné'}</div>
              <div class="notification-details"><strong>Retard:</strong> ${contact.hoursOverdue} heure${contact.hoursOverdue > 1 ? 's' : ''}</div>
              <a href="${SecureLinkService.generateSimpleLink(`/admin/contact/${(contact.metadata as any)?.contact_message_id || contact.id}`, adminId, adminType)}" style="color: #3b82f6; text-decoration: none; font-weight: 600; margin-top: 8px; display: inline-block;">Voir les détails →</a>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${reportData.escalatedNotifications.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🚨</div>
        <div>
          <div class="section-title">Notifications escaladées</div>
          <div class="section-subtitle">${reportData.escalatedNotifications.length} notification${reportData.escalatedNotifications.length > 1 ? 's' : ''} ayant atteint les seuils d'escalade</div>
        </div>
      </div>
      ${reportData.escalatedNotifications.map(notif => {
        const priorityStyle = priorityColors[notif.priority as keyof typeof priorityColors] || priorityColors.medium;
        return `
          <div class="notification-item" style="border-left-color: ${priorityStyle.border};">
            <div class="notification-header">${notif.title}</div>
            <div class="notification-details">${notif.message}</div>
            <div class="notification-meta">Niveau d'escalade: ${notif.escalation_level} • Type: ${notif.notification_type} • ${formatNotificationDate(notif.created_at)}</div>
            <a href="${SecureLinkService.generateSimpleLink(`/admin/notifications/${notif.id}`, adminId, adminType)}" style="color: #3b82f6; text-decoration: none; font-weight: 600; margin-top: 8px; display: inline-block;">Voir les détails →</a>
          </div>
        `;
      }).join('')}
    </div>
    ` : ''}

    <div class="footer">
      <div class="footer-text">
        <p>Rapport généré automatiquement par Profitum</p>
        <p style="margin-top: 12px;">
          <a href="${SecureLinkService.generateSimpleLink('/admin/dashboard-optimized', adminId, adminType)}" class="footer-link">
            Accéder au dashboard →
          </a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Envoyer le rapport matinal à un admin
   */
  static async sendMorningReport(adminEmail: string, adminName: string, adminId?: string, adminType?: string, date?: Date): Promise<boolean> {
    try {
      console.log(`📧 Génération et envoi du rapport matinal pour ${adminEmail}`);

      // Vérifier les préférences avant d'envoyer
      if (adminId) {
        const shouldSendEmail = await NotificationPreferencesChecker.shouldSendEmail(
          adminId,
          'admin',
          'morning_report'
        );

        if (!shouldSendEmail) {
          console.log(`⏭️ Rapport matinal non envoyé à ${adminEmail} - préférences utilisateur désactivées pour morning_report`);
          return false;
        }
      }

      const reportData = await this.generateMorningReport(date);
      const html = this.formatReportAsHTML(reportData, adminName, adminId, adminType);

      const text = `
Rapport matinal - ${new Date(reportData.reportDate).toLocaleDateString('fr-FR')}

RDV du jour (${reportData.stats.totalRDVToday}) :
${reportData.rdvToday.map(r => `- ${r.title || 'RDV'} : ${r.scheduled_time} avec ${r.Expert?.name || 'Expert'} et ${r.Client?.company_name || r.Client?.name || 'Client'}`).join('\n') || 'Aucun RDV'}

Notifications non lues (${reportData.stats.totalUnreadNotifications}) :
${reportData.unreadNotifications.map(n => `- ${n.title}: ${n.message}`).join('\n') || 'Aucune notification'}

Notifications lues récentes (${reportData.stats.totalReadNotifications}) :
${reportData.readNotifications.map(n => `- ${n.title}: ${n.message}`).join('\n') || 'Aucune notification'}

RDV en retard (${reportData.stats.totalOverdueRDVs}) :
${reportData.overdueRDVs.length > 0 ? Object.entries({
  '120h': reportData.overdueRDVs.filter(r => r.threshold === '120h'),
  '48h': reportData.overdueRDVs.filter(r => r.threshold === '48h'),
  '24h': reportData.overdueRDVs.filter(r => r.threshold === '24h')
}).filter(([_, rdvs]) => rdvs.length > 0).map(([threshold, rdvs]) => 
  `${threshold} de retard (${rdvs.length}) :\n${rdvs.map(r => `  - ${r.title} : ${r.Client?.company_name || r.Client?.name || 'Client'} / ${r.Expert?.name || 'Expert'} - ${r.hoursOverdue}h de retard`).join('\n')}`
).join('\n\n') : 'Aucun RDV en retard'}

Dossiers nécessitant une action (${reportData.stats.totalPendingActions}) :
${reportData.pendingActions.length > 0 ? Object.entries({
  critical: reportData.pendingActions.filter(a => a.priority === 'critical'),
  high: reportData.pendingActions.filter(a => a.priority === 'high'),
  medium: reportData.pendingActions.filter(a => a.priority === 'medium'),
  low: reportData.pendingActions.filter(a => a.priority === 'low')
}).filter(([_, actions]) => actions.length > 0).map(([priority, actions]) => 
  `${priority.toUpperCase()} (${actions.length}) :\n${actions.map(a => `  - ${a.actionType} : ${a.Client?.company_name || a.Client?.name || 'Client'} / ${a.ProduitEligible?.nom || 'Produit'} - ${a.daysWaiting} jours d'attente`).join('\n')}`
).join('\n\n') : 'Aucun dossier nécessitant une action'}

Contacts/Leads en attente (${reportData.stats.totalPendingContactsLeads}) :
${reportData.pendingContactsLeads.length > 0 ? Object.entries({
  '120h': reportData.pendingContactsLeads.filter(c => c.threshold === '120h'),
  '48h': reportData.pendingContactsLeads.filter(c => c.threshold === '48h'),
  '24h': reportData.pendingContactsLeads.filter(c => c.threshold === '24h')
}).filter(([_, contacts]) => contacts.length > 0).map(([threshold, contacts]) => 
  `${threshold} de retard (${contacts.length}) :\n${contacts.map(c => `  - ${c.notification_type === 'contact_message' ? 'Message' : 'Lead'} : ${c.metadata?.name || 'Non renseigné'} (${c.metadata?.email || 'Non renseigné'}) - ${c.hoursOverdue}h de retard`).join('\n')}`
).join('\n\n') : 'Aucun contact/lead en attente'}

Notifications escaladées (${reportData.stats.totalEscalatedNotifications}) :
${reportData.escalatedNotifications.map(n => `- ${n.title} : ${n.message} (Niveau ${n.escalation_level}, ${n.notification_type})`).join('\n') || 'Aucune notification escaladée'}
      `.trim();

      const subject = `🌅 Rapport matinal - ${new Date(reportData.reportDate).toLocaleDateString('fr-FR')}`;
      const success = await EmailService.sendDailyReportEmail(adminEmail, subject, html, text);

      if (success) {
        console.log(`✅ Rapport matinal envoyé avec succès à ${adminEmail}`);
      } else {
        console.error(`❌ Échec envoi rapport matinal à ${adminEmail}`);
      }

      return success;
    } catch (error: any) {
      console.error('❌ Erreur génération/envoi rapport matinal:', error);
      return false;
    }
  }
}

