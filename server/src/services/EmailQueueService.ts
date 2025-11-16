/**
 * Service de queue email avec Redis/Bull
 * Gestion envois différés, retry automatique, priorités
 */

import Queue, { Job, JobOptions } from 'bull';
import { createClient } from '@supabase/supabase-js';
import { RDVEmailService } from './RDVEmailService';
import { EmailTrackingService } from './EmailTrackingService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// TYPES
// ============================================================================

export interface EmailJob {
  type: 'rdv_confirmation' | 'rdv_notification' | 'rdv_alternative' | 'custom';
  recipient: string;
  subject: string;
  template_name: string;
  template_data: any;
  priority?: number;
  scheduled_for?: Date;
  metadata?: Record<string, any>;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

// ============================================================================
// CONFIGURATION QUEUE
// ============================================================================

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false
};

// Créer la queue
const emailQueue = new Queue('email-queue', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000 // 2s, puis 4s, puis 8s
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

// Gérer les erreurs Redis silencieusement (non bloquant)
emailQueue.on('error', (error) => {
  // Ignorer les erreurs de connexion Redis (service optionnel)
  if (error?.message?.includes('ECONNREFUSED') || error?.message?.includes('connect')) {
    // Redis non disponible, les emails seront envoyés directement
    return;
  }
  console.error('❌ Erreur queue email Redis (non bloquant):', error?.message || error);
});

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

export class EmailQueueService {
  
  /**
   * Ajouter un email à la queue
   */
  static async addToQueue(
    job: EmailJob,
    options?: JobOptions
  ): Promise<Job> {
    const jobOptions: JobOptions = {
      priority: job.priority || 5,
      delay: job.scheduled_for 
        ? Math.max(0, job.scheduled_for.getTime() - Date.now())
        : 0,
      ...options
    };

    const queueJob = await emailQueue.add(job, jobOptions);

    console.log(`📨 Email ajouté à la queue: ${queueJob.id} (priorité: ${jobOptions.priority})`);

    // Enregistrer dans EmailQueue (BDD)
    await supabase
      .from('EmailQueue')
      .insert({
        id: queueJob.id,
        recipient: job.recipient,
        subject: job.subject,
        template_name: job.template_name,
        template_data: job.template_data,
        priority: job.priority || 5,
        status: 'pending',
        scheduled_for: job.scheduled_for?.toISOString(),
        metadata: job.metadata || {}
      });

    return queueJob;
  }

  /**
   * Ajouter plusieurs emails à la queue (bulk)
   */
  static async addBulkToQueue(jobs: EmailJob[]): Promise<Job[]> {
    const queueJobs = await Promise.all(
      jobs.map(job => this.addToQueue(job))
    );

    console.log(`📨 ${jobs.length} emails ajoutés à la queue en bulk`);
    return queueJobs;
  }

  /**
   * Processeur de queue - Traiter les jobs
   */
  static async processQueue(): Promise<void> {
    emailQueue.process(async (job: Job<EmailJob>) => {
      console.log(`🔄 Traitement email job ${job.id}`);

      try {
        // Mettre à jour statut en BDD
        await supabase
          .from('EmailQueue')
          .update({
            status: 'processing',
            last_attempt_at: new Date().toISOString(),
            attempts: job.attemptsMade + 1
          })
          .eq('id', job.id);

        // Créer tracking
        const emailId = await EmailTrackingService.createTracking({
          recipient: job.data.recipient,
          subject: job.data.subject,
          template_name: job.data.template_name,
          metadata: job.data.metadata
        });

        // Envoyer l'email selon le type
        let success = false;
        
        switch (job.data.type) {
          case 'rdv_confirmation':
            success = await RDVEmailService.sendRDVConfirmationToClient({
              ...job.data.template_data,
              rdv_id: emailId // Utiliser emailId pour tracking
            });
            break;

          case 'rdv_notification':
            success = await RDVEmailService.sendRDVNotificationToExpert({
              ...job.data.template_data,
              meeting_id: emailId
            });
            break;

          case 'rdv_alternative':
            success = await RDVEmailService.sendAlternativeDateProposal({
              ...job.data.template_data,
              meeting_id: emailId
            });
            break;

          case 'custom':
            // Email personnalisé (à implémenter selon besoins)
            console.log('📧 Email custom - à implémenter');
            success = true;
            break;
        }

        if (!success) {
          throw new Error('Échec envoi email');
        }

        // Marquer comme envoyé dans tracking
        await EmailTrackingService.trackEvent({
          email_id: emailId,
          event_type: 'delivered',
          metadata: { job_id: job.id }
        });

        // Mettre à jour statut en BDD
        await supabase
          .from('EmailQueue')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', job.id);

        console.log(`✅ Email job ${job.id} traité avec succès`);
        return { success: true, emailId };

      } catch (error) {
        console.error(`❌ Erreur traitement job ${job.id}:`, error);

        // Mettre à jour erreur en BDD
        await supabase
          .from('EmailQueue')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : String(error)
          })
          .eq('id', job.id);

        throw error;
      }
    });

    console.log('✅ Processeur de queue email démarré');
  }

  /**
   * Obtenir les statistiques de la queue
   */
  static async getQueueStats(): Promise<QueueStats> {
    const [waiting, active, completed, failed, delayed, isPaused] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getActiveCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount(),
      emailQueue.getDelayedCount(),
      emailQueue.isPaused()
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused: isPaused
    };
  }

  /**
   * Nettoyer les jobs terminés
   */
  static async cleanQueue(age: number = 24 * 60 * 60 * 1000): Promise<void> {
    await emailQueue.clean(age, 'completed');
    await emailQueue.clean(age, 'failed');
    console.log(`✅ Queue nettoyée (jobs > ${age}ms supprimés)`);
  }

  /**
   * Mettre en pause la queue
   */
  static async pauseQueue(): Promise<void> {
    await emailQueue.pause();
    console.log('⏸️ Queue mise en pause');
  }

  /**
   * Reprendre la queue
   */
  static async resumeQueue(): Promise<void> {
    await emailQueue.resume();
    console.log('▶️ Queue reprise');
  }

  /**
   * Vider complètement la queue
   */
  static async emptyQueue(): Promise<void> {
    await emailQueue.empty();
    console.log('🗑️ Queue vidée');
  }

  /**
   * Obtenir les jobs en attente
   */
  static async getWaitingJobs(start: number = 0, end: number = 10): Promise<Job[]> {
    return await emailQueue.getWaiting(start, end);
  }

  /**
   * Obtenir les jobs actifs
   */
  static async getActiveJobs(): Promise<Job[]> {
    return await emailQueue.getActive();
  }

  /**
   * Obtenir les jobs échoués
   */
  static async getFailedJobs(start: number = 0, end: number = 10): Promise<Job[]> {
    return await emailQueue.getFailed(start, end);
  }

  /**
   * Réessayer un job échoué
   */
  static async retryFailedJob(jobId: string): Promise<void> {
    const job = await emailQueue.getJob(jobId);
    if (job) {
      await job.retry();
      console.log(`🔄 Job ${jobId} réessayé`);
    }
  }

  /**
   * Réessayer tous les jobs échoués
   */
  static async retryAllFailedJobs(): Promise<number> {
    const failed = await this.getFailedJobs(0, 1000);
    let retried = 0;

    for (const job of failed) {
      try {
        await job.retry();
        retried++;
      } catch (error) {
        console.error(`❌ Impossible de réessayer job ${job.id}:`, error);
      }
    }

    console.log(`🔄 ${retried}/${failed.length} jobs échoués réessayés`);
    return retried;
  }

  /**
   * Fermer proprement la queue
   */
  static async closeQueue(): Promise<void> {
    await emailQueue.close();
    console.log('🔒 Queue fermée');
  }
}

// ============================================================================
// ÉVÉNEMENTS QUEUE
// ============================================================================

// Job terminé avec succès
emailQueue.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} terminé:`, result);
});

// Job échoué
emailQueue.on('failed', (job, error) => {
  console.error(`❌ Job ${job.id} échoué:`, error.message);
});

// Job actif
emailQueue.on('active', (job) => {
  console.log(`🔄 Job ${job.id} en cours...`);
});

// Job en attente
emailQueue.on('waiting', (jobId) => {
  console.log(`⏳ Job ${jobId} en attente`);
});

// Queue stalled (job bloqué)
emailQueue.on('stalled', (job) => {
  console.warn(`⚠️ Job ${job.id} bloqué, réessai...`);
});

// Erreur globale
emailQueue.on('error', (error) => {
  console.error('❌ Erreur queue:', error);
});

// Démarrer le processeur au chargement du module
EmailQueueService.processQueue().catch(error => {
  console.error('❌ Erreur démarrage processeur queue:', error);
});

export { emailQueue };

