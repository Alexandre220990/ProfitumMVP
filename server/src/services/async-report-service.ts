/**
 * Service de génération asynchrone des rapports
 * Permet de générer les rapports en arrière-plan via un système de queue
 * Implémenté selon la recommandation 5.2 de l'analyse système notifications
 */

import { createClient } from '@supabase/supabase-js';
import { MorningReportService } from './morning-report-service';
import { DailyActivityReportServiceV2 } from './daily-activity-report-service-v2';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type ReportType = 'morning' | 'daily_v2';

export interface ReportJob {
  id: string;
  type: ReportType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  params: {
    date?: string;
    adminId?: string;
    adminType?: string;
  };
  result?: any;
  error?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export class AsyncReportService {
  private static readonly QUEUE_TABLE = 'report_jobs';
  private static processing = false;

  /**
   * Ajouter un rapport à la queue
   */
  static async enqueueReport(
    type: ReportType,
    params: { date?: Date; adminId?: string; adminType?: string } = {}
  ): Promise<string> {
    const job: Omit<ReportJob, 'id' | 'created_at'> = {
      type,
      status: 'pending',
      params: {
        date: params.date?.toISOString().split('T')[0],
        adminId: params.adminId,
        adminType: params.adminType
      }
    };

    const { data, error } = await supabase
      .from(this.QUEUE_TABLE)
      .insert(job)
      .select('id')
      .single();

    if (error) {
      console.error('❌ Erreur création job rapport:', error);
      throw new Error(`Impossible de créer le job: ${error.message}`);
    }

    console.log(`📋 Job rapport ${type} créé avec l'ID: ${data.id}`);
    
    // Démarrer le traitement si pas déjà en cours
    this.processQueue().catch(err => {
      console.error('❌ Erreur traitement queue:', err);
    });

    return data.id;
  }

  /**
   * Traiter la queue des rapports
   */
  static async processQueue(): Promise<void> {
    if (this.processing) {
      return; // Déjà en cours de traitement
    }

    this.processing = true;

    try {
      // Récupérer le prochain job en attente
      const { data: job, error } = await supabase
        .from(this.QUEUE_TABLE)
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (error || !job) {
        // Aucun job en attente
        return;
      }

      console.log(`🔄 Traitement du job ${job.id} (type: ${job.type})`);

      // Marquer comme en traitement
      await supabase
        .from(this.QUEUE_TABLE)
        .update({
          status: 'processing',
          started_at: new Date().toISOString()
        })
        .eq('id', job.id);

      try {
        // Générer le rapport selon le type
        let result: any;
        const reportDate = job.params.date ? new Date(job.params.date) : new Date();

        switch (job.type) {
          case 'morning':
            result = await MorningReportService.generateMorningReport(reportDate, false);
            break;
          case 'daily_v2':
            result = await DailyActivityReportServiceV2.generateDailyReport(
              reportDate,
              job.params.adminId,
              job.params.adminType,
              false
            );
            break;
          default:
            throw new Error(`Type de rapport inconnu: ${job.type}`);
        }

        // Marquer comme terminé avec succès
        await supabase
          .from(this.QUEUE_TABLE)
          .update({
            status: 'completed',
            result: result,
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);

        console.log(`✅ Job ${job.id} terminé avec succès`);

        // Traiter le prochain job
        setImmediate(() => this.processQueue());

      } catch (error: any) {
        // Marquer comme échoué
        await supabase
          .from(this.QUEUE_TABLE)
          .update({
            status: 'failed',
            error: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);

        console.error(`❌ Job ${job.id} échoué:`, error.message);

        // Traiter le prochain job même en cas d'erreur
        setImmediate(() => this.processQueue());
      }

    } finally {
      this.processing = false;
    }
  }

  /**
   * Récupérer le statut d'un job
   */
  static async getJobStatus(jobId: string): Promise<ReportJob | null> {
    const { data, error } = await supabase
      .from(this.QUEUE_TABLE)
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as ReportJob;
  }

  /**
   * Récupérer le résultat d'un job terminé
   */
  static async getJobResult(jobId: string): Promise<any | null> {
    const job = await this.getJobStatus(jobId);
    
    if (!job || job.status !== 'completed') {
      return null;
    }

    return job.result;
  }

  /**
   * Nettoyer les anciens jobs (plus de 7 jours)
   */
  static async cleanupOldJobs(): Promise<void> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { error } = await supabase
      .from(this.QUEUE_TABLE)
      .delete()
      .lt('created_at', sevenDaysAgo.toISOString());

    if (error) {
      console.error('❌ Erreur nettoyage anciens jobs:', error);
    } else {
      console.log('🧹 Anciens jobs nettoyés');
    }
  }
}

// Démarrer le traitement périodique de la queue (toutes les 30 secondes)
setInterval(() => {
  AsyncReportService.processQueue().catch(err => {
    console.error('❌ Erreur traitement queue périodique:', err);
  });
}, 30000);

// Nettoyer les anciens jobs toutes les heures
setInterval(() => {
  AsyncReportService.cleanupOldJobs().catch(err => {
    console.error('❌ Erreur nettoyage jobs:', err);
  });
}, 60 * 60 * 1000);
