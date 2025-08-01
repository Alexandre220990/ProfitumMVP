import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export enum UploadEventType {
  UPLOAD_STARTED = 'upload_started',
  UPLOAD_SUCCESS = 'upload_success',
  UPLOAD_FAILED = 'upload_failed',
  VALIDATION_REQUESTED = 'validation_requested',
  VALIDATION_APPROVED = 'validation_approved',
  VALIDATION_REJECTED = 'validation_rejected',
  DOWNLOAD_REQUESTED = 'download_requested',
  DOWNLOAD_SUCCESS = 'download_success',
  DOWNLOAD_FAILED = 'download_failed',
  FILE_DELETED = 'file_deleted',
  ACCESS_DENIED = 'access_denied',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity'
}

export enum UploadSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface UploadEvent {
  id: string;
  event_type: UploadEventType;
  severity: UploadSeverity;
  user_id: string;
  user_type: 'client' | 'expert' | 'admin';
  client_id?: string;
  dossier_id?: string;
  document_id?: string;
  file_path?: string;
  bucket_name?: string;
  file_size?: number;
  mime_type?: string;
  ip_address?: string;
  user_agent?: string;
  error_message?: string;
  metadata?: any;
  created_at: string;
}

export interface UploadMetrics {
  total_uploads: number;
  successful_uploads: number;
  failed_uploads: number;
  total_size_uploaded: number;
  average_file_size: number;
  uploads_by_product: { [key: string]: number };
  uploads_by_status: { [key: string]: number };
  uploads_by_hour: { [key: string]: number };
  top_uploaders: { user_id: string; count: number; total_size: number }[];
  recent_errors: UploadEvent[];
}

export class UploadMonitoringService {
  private supabase;

  constructor() {
    this.supabase = supabase;
  }

  /**
   * Enregistrer un événement d'upload
   */
  async logUploadEvent(event: Omit<UploadEvent, 'id' | 'created_at'>): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('UploadEvents')
        .insert({
          event_type: event.event_type,
          severity: event.severity,
          user_id: event.user_id,
          user_type: event.user_type,
          client_id: event.client_id,
          dossier_id: event.dossier_id,
          document_id: event.document_id,
          file_path: event.file_path,
          bucket_name: event.bucket_name,
          file_size: event.file_size,
          mime_type: event.mime_type,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
          error_message: event.error_message,
          metadata: event.metadata
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Erreur log upload event:', error);
        return '';
      }

      return data.id;
    } catch (error) {
      console.error('❌ Erreur log upload event:', error);
      return '';
    }
  }

  /**
   * Logger le début d'un upload
   */
  async logUploadStarted(params: {
    user_id: string;
    user_type: 'client' | 'expert' | 'admin';
    client_id?: string;
    dossier_id?: string;
    file_size: number;
    mime_type: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<string> {
    return this.logUploadEvent({
      event_type: UploadEventType.UPLOAD_STARTED,
      severity: UploadSeverity.INFO,
      ...params
    });
  }

  /**
   * Logger un upload réussi
   */
  async logUploadSuccess(params: {
    user_id: string;
    user_type: 'client' | 'expert' | 'admin';
    client_id?: string;
    dossier_id?: string;
    document_id: string;
    file_path: string;
    bucket_name: string;
    file_size: number;
    mime_type: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<string> {
    return this.logUploadEvent({
      event_type: UploadEventType.UPLOAD_SUCCESS,
      severity: UploadSeverity.INFO,
      ...params
    });
  }

  /**
   * Logger un upload échoué
   */
  async logUploadFailed(params: {
    user_id: string;
    user_type: 'client' | 'expert' | 'admin';
    client_id?: string;
    dossier_id?: string;
    file_size?: number;
    mime_type?: string;
    error_message: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<string> {
    return this.logUploadEvent({
      event_type: UploadEventType.UPLOAD_FAILED,
      severity: UploadSeverity.ERROR,
      ...params
    });
  }

  /**
   * Logger une validation de document
   */
  async logValidation(params: {
    user_id: string;
    user_type: 'client' | 'expert' | 'admin';
    document_id: string;
    action: 'approved' | 'rejected' | 'requires_revision';
    comment?: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<string> {
    const eventType = params.action === 'approved' 
      ? UploadEventType.VALIDATION_APPROVED 
      : params.action === 'rejected' 
        ? UploadEventType.VALIDATION_REJECTED 
        : UploadEventType.VALIDATION_REQUESTED;

    return this.logUploadEvent({
      event_type: eventType,
      severity: UploadSeverity.INFO,
      user_id: params.user_id,
      user_type: params.user_type,
      document_id: params.document_id,
      error_message: params.comment,
      ip_address: params.ip_address,
      user_agent: params.user_agent
    });
  }

  /**
   * Logger un accès refusé
   */
  async logAccessDenied(params: {
    user_id: string;
    user_type: 'client' | 'expert' | 'admin';
    document_id?: string;
    file_path?: string;
    reason: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<string> {
    return this.logUploadEvent({
      event_type: UploadEventType.ACCESS_DENIED,
      severity: UploadSeverity.WARNING,
      user_id: params.user_id,
      user_type: params.user_type,
      document_id: params.document_id,
      file_path: params.file_path,
      error_message: params.reason,
      ip_address: params.ip_address,
      user_agent: params.user_agent
    });
  }

  /**
   * Logger une activité suspecte
   */
  async logSuspiciousActivity(params: {
    user_id: string;
    user_type: 'client' | 'expert' | 'admin';
    activity_type: string;
    description: string;
    ip_address?: string;
    user_agent?: string;
    metadata?: any;
  }): Promise<string> {
    return this.logUploadEvent({
      event_type: UploadEventType.SUSPICIOUS_ACTIVITY,
      severity: UploadSeverity.CRITICAL,
      user_id: params.user_id,
      user_type: params.user_type,
      error_message: `${params.activity_type}: ${params.description}`,
      ip_address: params.ip_address,
      user_agent: params.user_agent,
      metadata: params.metadata
    });
  }

  /**
   * Obtenir les métriques d'upload
   */
  async getUploadMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<UploadMetrics> {
    try {
      const now = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case '1h':
          startDate.setHours(now.getHours() - 1);
          break;
        case '24h':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
      }

      // Récupérer tous les événements dans la période
      const { data: events, error } = await this.supabase
        .from('UploadEvents')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur récupération métriques:', error);
        throw error;
      }

      const uploadEvents = events || [];
      const successfulUploads = uploadEvents.filter(e => e.event_type === UploadEventType.UPLOAD_SUCCESS);
      const failedUploads = uploadEvents.filter(e => e.event_type === UploadEventType.UPLOAD_FAILED);

      // Calculer les métriques
      const totalSize = successfulUploads.reduce((sum, e) => sum + (e.file_size || 0), 0);
      const averageFileSize = successfulUploads.length > 0 ? totalSize / successfulUploads.length : 0;

      // Uploads par produit (basé sur le dossier_id)
      const uploadsByProduct: { [key: string]: number } = {};
      successfulUploads.forEach(e => {
        const product = this.extractProductFromDossier(e.dossier_id);
        uploadsByProduct[product] = (uploadsByProduct[product] || 0) + 1;
      });

      // Uploads par statut
      const uploadsByStatus: { [key: string]: number } = {};
      uploadEvents.forEach(e => {
        uploadsByStatus[e.event_type] = (uploadsByStatus[e.event_type] || 0) + 1;
      });

      // Uploads par heure
      const uploadsByHour: { [key: string]: number } = {};
      successfulUploads.forEach(e => {
        const hour = new Date(e.created_at).getHours();
        uploadsByHour[hour.toString()] = (uploadsByHour[hour.toString()] || 0) + 1;
      });

      // Top uploaders
      const uploaderStats: { [key: string]: { count: number; total_size: number } } = {};
      successfulUploads.forEach(e => {
        if (!uploaderStats[e.user_id]) {
          uploaderStats[e.user_id] = { count: 0, total_size: 0 };
        }
        uploaderStats[e.user_id].count++;
        uploaderStats[e.user_id].total_size += e.file_size || 0;
      });

      const topUploaders = Object.entries(uploaderStats)
        .map(([user_id, stats]) => ({ user_id, ...stats }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Erreurs récentes
      const recentErrors = uploadEvents
        .filter(e => e.severity === UploadSeverity.ERROR || e.severity === UploadSeverity.CRITICAL)
        .slice(0, 10);

      return {
        total_uploads: uploadEvents.length,
        successful_uploads: successfulUploads.length,
        failed_uploads: failedUploads.length,
        total_size_uploaded: totalSize,
        average_file_size: averageFileSize,
        uploads_by_product: uploadsByProduct,
        uploads_by_status: uploadsByStatus,
        uploads_by_hour: uploadsByHour,
        top_uploaders: topUploaders,
        recent_errors: recentErrors
      };
    } catch (error) {
      console.error('❌ Erreur calcul métriques:', error);
      throw error;
    }
  }

  /**
   * Obtenir les alertes de sécurité
   */
  async getSecurityAlerts(limit: number = 50): Promise<UploadEvent[]> {
    try {
      const { data, error } = await this.supabase
        .from('UploadEvents')
        .select('*')
        .in('severity', [UploadSeverity.WARNING, UploadSeverity.ERROR, UploadSeverity.CRITICAL])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Erreur récupération alertes:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erreur récupération alertes:', error);
      throw error;
    }
  }

  /**
   * Vérifier les activités suspectes
   */
  async checkSuspiciousActivity(userId: string, timeWindow: number = 3600000): Promise<boolean> {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - timeWindow);

      const { data, error } = await this.supabase
        .from('UploadEvents')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startTime.toISOString())
        .lte('created_at', now.toISOString());

      if (error) {
        console.error('❌ Erreur vérification activité suspecte:', error);
        return false;
      }

      const events = data || [];
      
      // Détecter les activités suspectes
      const uploadCount = events.filter(e => e.event_type === UploadEventType.UPLOAD_SUCCESS).length;
      const failedCount = events.filter(e => e.event_type === UploadEventType.UPLOAD_FAILED).length;
      const accessDeniedCount = events.filter(e => e.event_type === UploadEventType.ACCESS_DENIED).length;

      // Seuils de détection
      const isSuspicious = 
        uploadCount > 50 || // Plus de 50 uploads en 1h
        failedCount > 10 || // Plus de 10 échecs en 1h
        accessDeniedCount > 5; // Plus de 5 accès refusés en 1h

      if (isSuspicious) {
        await this.logSuspiciousActivity({
          user_id: userId,
          user_type: 'client', // À adapter selon le contexte
          activity_type: 'high_activity',
          description: `Uploads: ${uploadCount}, Échecs: ${failedCount}, Accès refusés: ${accessDeniedCount}`,
          metadata: { uploadCount, failedCount, accessDeniedCount }
        });
      }

      return isSuspicious;
    } catch (error) {
      console.error('❌ Erreur vérification activité suspecte:', error);
      return false;
    }
  }

  /**
   * Nettoyer les anciens logs
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await this.supabase
        .from('UploadEvents')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        console.error('❌ Erreur nettoyage logs:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('❌ Erreur nettoyage logs:', error);
      return 0;
    }
  }

  /**
   * Extraire le produit à partir du dossier_id
   */
  private extractProductFromDossier(dossierId?: string): string {
    if (!dossierId) return 'Unknown';
    
    // Logique pour extraire le produit du dossier_id
    // À adapter selon votre structure de données
    if (dossierId.includes('ticpe')) return 'TICPE';
    if (dossierId.includes('urssaf')) return 'URSSAF';
    if (dossierId.includes('foncier')) return 'FONCIER';
    
    return 'Unknown';
  }
} 