/**
 * Job automatique pour traiter les emails programmés experts → clients
 * Exécuté toutes les 15 minutes
 */

import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { ExpertClientEmailService } from '../services/ExpertClientEmailService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

let isRunning = false;

/**
 * Traiter les emails programmés
 */
async function processScheduledEmails() {
  if (isRunning) {
    console.log('⏭️  Traitement emails experts déjà en cours, skip...');
    return;
  }

  try {
    isRunning = true;
    console.log('📧 [CRON] Traitement des emails programmés experts → clients...');
    
    const now = new Date();
    
    // Récupérer les emails programmés dont la date est passée
    const { data: scheduledEmails, error } = await supabase
      .from('expert_client_email_scheduled')
      .select(`
        *,
        expert_client_email_sequences (
          id,
          status
        )
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(50); // Limiter pour éviter la surcharge

    if (error) {
      throw error;
    }

    if (!scheduledEmails || scheduledEmails.length === 0) {
      console.log('   ℹ️  Aucun email à traiter');
      return;
    }

    console.log(`   📬 ${scheduledEmails.length} email(s) à traiter`);

    let sent = 0;
    let failed = 0;

    for (const scheduled of scheduledEmails) {
      try {
        // Vérifier que la séquence est toujours active
        const sequence = scheduled.expert_client_email_sequences;
        if (sequence && Array.isArray(sequence) && sequence.length > 0) {
          const seq = sequence[0];
          if (seq.status !== 'active' && seq.status !== 'scheduled') {
            console.log(`   ⏭️  Séquence ${seq.id} n'est plus active (${seq.status}), skip email ${scheduled.id}`);
            // Marquer comme annulé
            await supabase
              .from('expert_client_email_scheduled')
              .update({
                status: 'cancelled',
                updated_at: new Date().toISOString(),
                metadata: {
                  ...(scheduled.metadata || {}),
                  cancelled_reason: 'sequence_not_active',
                  cancelled_at: new Date().toISOString()
                }
              })
              .eq('id', scheduled.id);
            continue;
          }
        }

        // Récupérer le message de l'expert depuis metadata
        const expertMessage = scheduled.metadata?.expert_message || '';

        if (!expertMessage) {
          console.error(`   ❌ Email ${scheduled.id} sans message expert, skip`);
          failed++;
          continue;
        }

        // Envoyer l'email
        const result = await ExpertClientEmailService.sendExpertClientEmail({
          expert_id: scheduled.expert_id,
          client_id: scheduled.client_id,
          client_produit_id: scheduled.client_produit_id || undefined,
          subject: scheduled.subject,
          expert_message: expertMessage,
          use_ai_enrichment: false, // Pas d'enrichissement IA pour les emails programmés
          scheduled_email_id: scheduled.id
        });

        if (result.success) {
          sent++;
          console.log(`   ✅ Email ${scheduled.id} envoyé`);
        } else {
          failed++;
          console.error(`   ❌ Erreur envoi email ${scheduled.id}:`, result.error);
          
          // Marquer comme failed
          await supabase
            .from('expert_client_email_scheduled')
            .update({
              status: 'failed',
              error_message: result.error,
              updated_at: new Date().toISOString()
            })
            .eq('id', scheduled.id);
        }
      } catch (error: any) {
        failed++;
        console.error(`   ❌ Erreur traitement email ${scheduled.id}:`, error);
        
        // Marquer comme failed
        await supabase
          .from('expert_client_email_scheduled')
          .update({
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', scheduled.id);
      }
    }

    console.log(`✅ [CRON] Traitement terminé: ${sent} envoyé(s), ${failed} échec(s)`);

    // Vérifier si toutes les séquences sont terminées
    if (scheduledEmails.length > 0) {
      const sequenceIds = [...new Set(scheduledEmails
        .map(s => s.sequence_id)
        .filter(Boolean))];

      for (const sequenceId of sequenceIds) {
        // Vérifier s'il reste des emails programmés pour cette séquence
        const { data: remainingEmails } = await supabase
          .from('expert_client_email_scheduled')
          .select('id')
          .eq('sequence_id', sequenceId)
          .eq('status', 'scheduled')
          .limit(1);

        if (!remainingEmails || remainingEmails.length === 0) {
          // Tous les emails sont envoyés, marquer la séquence comme terminée
          await supabase
            .from('expert_client_email_sequences')
            .update({
              status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', sequenceId);
          
          console.log(`   ✅ Séquence ${sequenceId} terminée`);
        }
      }
    }
  } catch (error: any) {
    console.error('❌ [CRON] Erreur lors du traitement des emails:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Démarrer le job automatique
 */
export function startExpertEmailSchedulerJob() {
  // Vérifier toutes les 15 minutes
  // Format: minute heure jour mois jour-semaine
  // '*/15 * * * *' = toutes les 15 minutes
  const cronExpression = process.env.EXPERT_EMAIL_SCHEDULER_CRON || '*/15 * * * *';
  
  console.log(`📅 [CRON] Job emails experts programmé: ${cronExpression}`);
  console.log('   (Exécution toutes les 15 minutes)');
  
  // Exécuter immédiatement au démarrage (optionnel)
  if (process.env.EXPERT_EMAIL_SCHEDULER_ON_STARTUP === 'true') {
    console.log('🚀 [CRON] Exécution immédiate au démarrage...');
    processScheduledEmails();
  }
  
  // Programmer l'exécution récurrente
  cron.schedule(cronExpression, processScheduledEmails, {
    timezone: 'Europe/Paris'
  });
  
  console.log('✅ [CRON] Job emails experts démarré');
}

/**
 * Arrêter le job automatique
 */
export function stopExpertEmailSchedulerJob() {
  console.log('⏹️  [CRON] Arrêt du job emails experts demandé');
}
