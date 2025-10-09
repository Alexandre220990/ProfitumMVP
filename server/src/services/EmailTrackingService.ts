/**
 * Service de tracking des emails
 * Suivi des ouvertures, clics et événements email
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// TYPES
// ============================================================================

export interface EmailTrackingData {
  email_id: string;
  recipient: string;
  subject: string;
  template_name: string;
  sent_at: Date;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  metadata?: Record<string, any>;
}

export interface EmailEvent {
  email_id: string;
  event_type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'failed';
  timestamp: Date;
  user_agent?: string;
  ip_address?: string;
  link_url?: string;
  metadata?: Record<string, any>;
}

export interface EmailMetrics {
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_failed: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
}

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

export class EmailTrackingService {
  
  /**
   * Créer un tracking pour un email envoyé
   */
  static async createTracking(data: {
    recipient: string;
    subject: string;
    template_name: string;
    metadata?: Record<string, any>;
  }): Promise<string> {
    const emailId = uuidv4();

    const { error } = await supabase
      .from('EmailTracking')
      .insert({
        email_id: emailId,
        recipient: data.recipient,
        subject: data.subject,
        template_name: data.template_name,
        sent_at: new Date().toISOString(),
        status: 'sent',
        metadata: data.metadata || {}
      });

    if (error) {
      console.error('❌ Erreur création tracking:', error);
      throw error;
    }

    console.log(`✅ Tracking créé pour email ${emailId}`);
    return emailId;
  }

  /**
   * Enregistrer un événement email
   */
  static async trackEvent(event: {
    email_id: string;
    event_type: EmailEvent['event_type'];
    user_agent?: string;
    ip_address?: string;
    link_url?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    // Créer l'événement
    const { error: eventError } = await supabase
      .from('EmailEvent')
      .insert({
        email_id: event.email_id,
        event_type: event.event_type,
        timestamp: new Date().toISOString(),
        user_agent: event.user_agent,
        ip_address: event.ip_address,
        link_url: event.link_url,
        metadata: event.metadata || {}
      });

    if (eventError) {
      console.error('❌ Erreur enregistrement événement:', eventError);
      return;
    }

    // Mettre à jour le statut de l'email
    await this.updateEmailStatus(event.email_id, event.event_type);

    console.log(`✅ Événement ${event.event_type} enregistré pour ${event.email_id}`);
  }

  /**
   * Mettre à jour le statut d'un email
   */
  private static async updateEmailStatus(
    emailId: string, 
    eventType: EmailEvent['event_type']
  ): Promise<void> {
    const statusMap: Record<EmailEvent['event_type'], EmailTrackingData['status']> = {
      sent: 'sent',
      delivered: 'delivered',
      opened: 'opened',
      clicked: 'clicked',
      bounced: 'bounced',
      complained: 'bounced',
      failed: 'failed'
    };

    const newStatus = statusMap[eventType];

    const { error } = await supabase
      .from('EmailTracking')
      .update({
        status: newStatus,
        [`${eventType}_at`]: new Date().toISOString()
      })
      .eq('email_id', emailId);

    if (error) {
      console.error('❌ Erreur mise à jour statut:', error);
    }
  }

  /**
   * Générer URL de tracking pour ouverture (pixel invisible)
   */
  static generateOpenTrackingUrl(emailId: string): string {
    const baseUrl = process.env.API_URL || 'https://profitummvp-production.up.railway.app';
    return `${baseUrl}/api/email-tracking/open/${emailId}`;
  }

  /**
   * Générer URL de tracking pour clic
   */
  static generateClickTrackingUrl(emailId: string, targetUrl: string): string {
    const baseUrl = process.env.API_URL || 'https://profitummvp-production.up.railway.app';
    const encodedUrl = encodeURIComponent(targetUrl);
    return `${baseUrl}/api/email-tracking/click/${emailId}?url=${encodedUrl}`;
  }

  /**
   * Injecter le pixel de tracking dans le HTML de l'email
   */
  static injectTrackingPixel(html: string, emailId: string): string {
    const trackingPixel = `<img src="${this.generateOpenTrackingUrl(emailId)}" width="1" height="1" style="display:none;" alt="" />`;
    
    // Injecter juste avant la balise </body>
    if (html.includes('</body>')) {
      return html.replace('</body>', `${trackingPixel}</body>`);
    }
    
    // Sinon, ajouter à la fin
    return html + trackingPixel;
  }

  /**
   * Wrapper les liens avec tracking
   */
  static wrapLinksWithTracking(html: string, emailId: string): string {
    // Regex pour trouver tous les liens href
    const linkRegex = /href=["']([^"']+)["']/gi;
    
    return html.replace(linkRegex, (match, url) => {
      // Ne pas tracker les liens de désabonnement ou tracking existants
      if (url.includes('unsubscribe') || url.includes('/email-tracking/')) {
        return match;
      }
      
      const trackedUrl = this.generateClickTrackingUrl(emailId, url);
      return `href="${trackedUrl}"`;
    });
  }

  /**
   * Obtenir les métriques d'un email
   */
  static async getEmailMetrics(emailId: string): Promise<{
    tracking: EmailTrackingData | null;
    events: EmailEvent[];
  }> {
    // Récupérer le tracking
    const { data: tracking } = await supabase
      .from('EmailTracking')
      .select('*')
      .eq('email_id', emailId)
      .single();

    // Récupérer les événements
    const { data: events } = await supabase
      .from('EmailEvent')
      .select('*')
      .eq('email_id', emailId)
      .order('timestamp', { ascending: true });

    return {
      tracking: tracking || null,
      events: events || []
    };
  }

  /**
   * Obtenir les métriques globales
   */
  static async getGlobalMetrics(filters?: {
    template_name?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<EmailMetrics> {
    let query = supabase
      .from('EmailTracking')
      .select('*');

    if (filters?.template_name) {
      query = query.eq('template_name', filters.template_name);
    }

    if (filters?.start_date) {
      query = query.gte('sent_at', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('sent_at', filters.end_date);
    }

    const { data: trackings } = await query;

    if (!trackings || trackings.length === 0) {
      return {
        total_sent: 0,
        total_delivered: 0,
        total_opened: 0,
        total_clicked: 0,
        total_bounced: 0,
        total_failed: 0,
        open_rate: 0,
        click_rate: 0,
        bounce_rate: 0
      };
    }

    const total_sent = trackings.length;
    const total_delivered = trackings.filter(t => ['delivered', 'opened', 'clicked'].includes(t.status)).length;
    const total_opened = trackings.filter(t => ['opened', 'clicked'].includes(t.status)).length;
    const total_clicked = trackings.filter(t => t.status === 'clicked').length;
    const total_bounced = trackings.filter(t => t.status === 'bounced').length;
    const total_failed = trackings.filter(t => t.status === 'failed').length;

    return {
      total_sent,
      total_delivered,
      total_opened,
      total_clicked,
      total_bounced,
      total_failed,
      open_rate: total_delivered > 0 ? (total_opened / total_delivered) * 100 : 0,
      click_rate: total_opened > 0 ? (total_clicked / total_opened) * 100 : 0,
      bounce_rate: total_sent > 0 ? (total_bounced / total_sent) * 100 : 0
    };
  }

  /**
   * Obtenir les métriques par template
   */
  static async getMetricsByTemplate(): Promise<Record<string, EmailMetrics>> {
    const { data: trackings } = await supabase
      .from('EmailTracking')
      .select('template_name');

    if (!trackings) return {};

    const templates = [...new Set(trackings.map(t => t.template_name))];
    const metrics: Record<string, EmailMetrics> = {};

    for (const template of templates) {
      metrics[template] = await this.getGlobalMetrics({ template_name: template });
    }

    return metrics;
  }

  /**
   * Nettoyer les anciens trackings (> 90 jours)
   */
  static async cleanOldTrackings(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { data: oldTrackings } = await supabase
      .from('EmailTracking')
      .select('email_id')
      .lt('sent_at', cutoffDate.toISOString());

    if (!oldTrackings || oldTrackings.length === 0) {
      return 0;
    }

    const emailIds = oldTrackings.map(t => t.email_id);

    // Supprimer les événements
    await supabase
      .from('EmailEvent')
      .delete()
      .in('email_id', emailIds);

    // Supprimer les trackings
    const { error } = await supabase
      .from('EmailTracking')
      .delete()
      .in('email_id', emailIds);

    if (error) {
      console.error('❌ Erreur nettoyage trackings:', error);
      return 0;
    }

    console.log(`✅ ${oldTrackings.length} trackings supprimés (> ${daysToKeep} jours)`);
    return oldTrackings.length;
  }
}

