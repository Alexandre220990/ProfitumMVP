import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Service de notification automatique pour les RDV terminés
 * 
 * Vérifie toutes les 30 minutes si des RDV confirmés sont arrivés à échéance
 * et envoie une notification aux participants pour demander si le RDV a eu lieu
 */

export class RDVCompletionService {
  private static instance: RDVCompletionService;
  private cronJob: cron.ScheduledTask | null = null;

  private constructor() {}

  public static getInstance(): RDVCompletionService {
    if (!RDVCompletionService.instance) {
      RDVCompletionService.instance = new RDVCompletionService();
    }
    return RDVCompletionService.instance;
  }

  /**
   * Démarrer le service de vérification automatique
   * S'exécute toutes les 30 minutes
   */
  public start() {
    if (this.cronJob) {
      console.log('⚠️ Service RDV Completion déjà démarré');
      return;
    }

    // Exécuter toutes les 30 minutes
    this.cronJob = cron.schedule('*/30 * * * *', async () => {
      await this.checkCompletedRDVs();
    });

    console.log('✅ Service RDV Completion démarré (vérification toutes les 30min)');

    // Exécuter immédiatement une première fois
    this.checkCompletedRDVs();
  }

  /**
   * Arrêter le service
   */
  public stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('🛑 Service RDV Completion arrêté');
    }
  }

  /**
   * Vérifier les RDV qui devraient être terminés
   */
  private async checkCompletedRDVs() {
    try {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

      console.log(`🔍 Vérification RDV terminés à ${currentDate} ${currentTime}`);

      // Récupérer les RDV confirmés dont l'heure de fin est passée
      const { data: rdvs, error } = await supabase
        .from('RDV')
        .select('*, Client(id, email, name, company_name), Expert(id, email, name), ApporteurAffaires(id, email, name)')
        .eq('status', 'confirmed')
        .lte('scheduled_date', currentDate);

      if (error) {
        console.error('❌ Erreur récupération RDV:', error);
        return;
      }

      if (!rdvs || rdvs.length === 0) {
        console.log('✅ Aucun RDV confirmé à vérifier');
        return;
      }

      // Filtrer les RDV dont l'heure de fin est dépassée
      const completedRDVs = rdvs.filter(rdv => {
        const rdvEndTime = this.calculateEndTime(rdv.scheduled_time, rdv.duration_minutes);
        
        // Si date passée, toujours considérer comme terminé
        if (rdv.scheduled_date < currentDate) return true;
        
        // Si même date, vérifier l'heure
        if (rdv.scheduled_date === currentDate) {
          return rdvEndTime <= currentTime;
        }
        
        return false;
      });

      console.log(`📊 ${completedRDVs.length} RDV à marquer comme potentiellement terminés`);

      // Envoyer notifications pour chaque RDV
      for (const rdv of completedRDVs) {
        await this.sendCompletionNotification(rdv);
      }

    } catch (error) {
      console.error('❌ Erreur vérification RDV terminés:', error);
    }
  }

  /**
   * Calculer l'heure de fin d'un RDV
   */
  private calculateEndTime(startTime: string, duration: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  }

  /**
   * Envoyer notification de demande de confirmation
   */
  private async sendCompletionNotification(rdv: any) {
    try {
      // Vérifier si notification déjà envoyée
      const { data: existingNotif } = await supabase
        .from('Notification')
        .select('id')
        .eq('type', 'rdv_completion_request')
        .eq('metadata->>rdv_id', rdv.id)
        .single();

      if (existingNotif) {
        // Notification déjà envoyée
        return;
      }

      // Récupérer les participants
      const participants = [
        { id: rdv.client_id, email: rdv.Client?.email, name: rdv.Client?.name || rdv.Client?.company_name },
        { id: rdv.expert_id, email: rdv.Expert?.email, name: rdv.Expert?.name },
        { id: rdv.apporteur_id, email: rdv.ApporteurAffaires?.email, name: rdv.ApporteurAffaires?.name }
      ].filter(p => p.id);

      // Créer notifications
      for (const participant of participants) {
        const notificationData = {
          user_id: participant.id,
          type: 'rdv_completion_request',
          title: 'RDV à confirmer',
          message: `Le RDV "${rdv.title}" prévu le ${rdv.scheduled_date} à ${rdv.scheduled_time} est terminé. A-t-il eu lieu ?`,
          metadata: {
            rdv_id: rdv.id,
            scheduled_date: rdv.scheduled_date,
            scheduled_time: rdv.scheduled_time,
            action_url: `/api/rdv/${rdv.id}/mark-completed`
          }
        };

        await supabase
          .from('Notification')
          .insert(notificationData);

        console.log(`📧 Notification envoyée à ${participant.name} (${participant.email})`);
      }

      // Envoyer emails (optionnel)
      try {
        const emailService = require('./EmailService');
        
        for (const participant of participants) {
          if (participant.email) {
            await emailService.default.sendEmail(
              participant.email,
              'RDV à confirmer - Profitum',
              `
                <h2>Confirmation de rendez-vous</h2>
                <p>Bonjour ${participant.name},</p>
                <p>Le rendez-vous suivant devrait être terminé :</p>
                <ul>
                  <li><strong>Titre :</strong> ${rdv.title}</li>
                  <li><strong>Date :</strong> ${new Date(rdv.scheduled_date).toLocaleDateString('fr-FR')}</li>
                  <li><strong>Heure :</strong> ${rdv.scheduled_time}</li>
                  <li><strong>Durée :</strong> ${rdv.duration_minutes} minutes</li>
                </ul>
                <p><strong>Ce rendez-vous a-t-il eu lieu ?</strong></p>
                <p>Merci de vous connecter à votre espace Profitum pour confirmer.</p>
                <p>Cordialement,<br>L'équipe Profitum</p>
              `
            );
          }
        }
      } catch (emailError) {
        console.error('⚠️ Erreur envoi emails (non bloquant):', emailError);
      }

      console.log(`✅ Notifications envoyées pour RDV ${rdv.id} - "${rdv.title}"`);

    } catch (error) {
      console.error(`❌ Erreur envoi notification pour RDV ${rdv.id}:`, error);
    }
  }
}

// Export singleton
export default RDVCompletionService.getInstance();

