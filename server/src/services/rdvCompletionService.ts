import { createClient } from '@supabase/supabase-js';
import * as cron from 'node-cron';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Service de notification automatique pour les RDV terminés
 * 
 * Vérifie toutes les 30 minutes si des RDV (scheduled ou confirmed) sont arrivés à échéance
 * - Met automatiquement à jour le statut à "completed" si l'heure de fin est passée
 * - Envoie une notification aux participants pour demander si le RDV a eu lieu
 */

export class RDVCompletionService {
  private static instance: RDVCompletionService;
  private cronJob: ReturnType<typeof cron.schedule> | null = null;

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
   * Forcer une vérification immédiate des RDV terminés
   * Utile pour les appels manuels depuis l'admin
   */
  public async forceCheck() {
    console.log('🔄 Vérification forcée des RDV terminés demandée');
    await this.checkCompletedRDVs();
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

      // Récupérer les RDV scheduled ou confirmed dont l'heure de fin est passée
      const { data: rdvs, error } = await supabase
        .from('RDV')
        .select('*, Client(id, email, name, company_name), Expert(id, email, name), ApporteurAffaires(id, email, first_name, last_name, company_name)')
        .in('status', ['scheduled', 'confirmed'])
        .lte('scheduled_date', currentDate);

      if (error) {
        console.error('❌ Erreur récupération RDV:', error);
        return;
      }

      if (!rdvs || rdvs.length === 0) {
        console.log('✅ Aucun RDV scheduled/confirmed à vérifier');
        return;
      }

      // Filtrer les RDV dont l'heure de fin est dépassée
      const completedRDVs = rdvs.filter(rdv => this.isRDVCompleted(rdv, currentDate, currentTime));

      console.log(`📊 ${completedRDVs.length} RDV à marquer comme terminés`);

      // Mettre à jour le statut à "completed" pour chaque RDV terminé
      for (const rdv of completedRDVs) {
        if (rdv.status !== 'completed') {
          console.log(`📝 Mise à jour automatique statut RDV ${rdv.id} de "${rdv.status}" à "completed"`);
          
          const { error: updateError } = await supabase
            .from('RDV')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', rdv.id);

          if (updateError) {
            console.error(`❌ Erreur mise à jour statut RDV ${rdv.id}:`, updateError);
            continue;
          }

          console.log(`✅ Statut RDV ${rdv.id} mis à jour à "completed"`);

          // Synchroniser les notifications d'événement après changement de statut
          try {
            const { EventNotificationSync } = await import('./event-notification-sync');
            await EventNotificationSync.syncEventNotifications({
              ...rdv,
              status: 'completed'
            });
          } catch (syncError) {
            console.warn(`⚠️ Erreur synchronisation notifications pour RDV ${rdv.id}:`, syncError);
          }
        }

        // Envoyer notification de demande de confirmation (seulement pour les RDV confirmés)
        if (rdv.status === 'confirmed') {
          await this.sendCompletionNotification(rdv);
        }
      }

    } catch (error) {
      console.error('❌ Erreur vérification RDV terminés:', error);
    }
  }

  /**
   * Calculer l'heure de fin d'un RDV
   * Retourne l'heure de fin au format HH:mm
   * Note: Si l'heure dépasse minuit, on retourne l'heure du jour suivant (ex: 25:30 devient 01:30)
   */
  private calculateEndTime(startTime: string, duration: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (duration || 60);
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  }

  /**
   * Vérifier si un RDV est terminé en comparant la date/heure de fin avec maintenant
   */
  private isRDVCompleted(rdv: any, currentDate: string, currentTime: string): boolean {
    if (!rdv.scheduled_time || !rdv.duration_minutes) {
      // Si pas d'heure ou durée, vérifier seulement la date
      return rdv.scheduled_date < currentDate;
    }

    try {
      // Créer la date/heure de début du RDV
      const startDateTime = new Date(`${rdv.scheduled_date}T${rdv.scheduled_time}`);
      
      // Calculer la date/heure de fin en ajoutant la durée
      const endDateTime = new Date(startDateTime.getTime() + (rdv.duration_minutes || 60) * 60000);
      
      // Comparer avec maintenant
      const now = new Date();
      
      return now >= endDateTime;
    } catch (error) {
      console.error(`❌ Erreur calcul date/heure fin RDV ${rdv.id}:`, error);
      // En cas d'erreur, fallback sur la comparaison de date simple
      return rdv.scheduled_date < currentDate;
    }
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
        { 
          id: rdv.apporteur_id, 
          email: rdv.ApporteurAffaires?.email, 
          name: rdv.ApporteurAffaires?.first_name 
            ? `${rdv.ApporteurAffaires.first_name} ${rdv.ApporteurAffaires.last_name}`.trim()
            : rdv.ApporteurAffaires?.company_name || 'Apporteur'
        }
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

