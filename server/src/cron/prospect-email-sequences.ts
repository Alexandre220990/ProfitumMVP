/**
 * Cron job pour envoyer les emails programmés des séquences de mailing
 * Exécution : Toutes les 15 minutes
 */

import cron from 'node-cron';
import { ProspectEmailService } from '../services/ProspectEmailService';

/**
 * Envoyer les emails programmés qui sont dus
 */
async function sendScheduledSequenceEmails() {
  try {
    console.log('⏰ [CRON] Démarrage envoi emails programmés des séquences');
    
    const result = await ProspectEmailService.sendScheduledEmailsDue();
    
    if (result.sent > 0 || result.failed > 0) {
      console.log(`📧 [CRON] Emails séquences: ${result.sent} envoyé(s), ${result.failed} échec(s)`);
    }
    
    if (result.errors.length > 0) {
      console.error('❌ [CRON] Erreurs envoi emails séquences:', result.errors);
    }
  } catch (error) {
    console.error('❌ [CRON] Erreur envoi emails programmés séquences:', error);
  }
}

/**
 * Démarrer le cron job
 * Exécution : Toutes les 15 minutes
 */
export function startProspectEmailSequencesCron() {
  // Cron expression: */15 * * * * = Toutes les 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    await sendScheduledSequenceEmails();
  }, {
    timezone: 'Europe/Paris'
  });

  console.log('✅ Cron job emails séquences activé (toutes les 15 minutes)');

  // Vérifier si on doit exécuter immédiatement (rattrapage au démarrage)
  // Si le serveur redémarre, on vérifie s'il y a des emails en retard
  const now = new Date();
  const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  
  // Exécuter immédiatement au démarrage avec un délai pour laisser le serveur finir de démarrer
  setTimeout(async () => {
    console.log('🔄 [CRON] Vérification immédiate des emails programmés au démarrage');
    await sendScheduledSequenceEmails();
  }, 10000); // 10 secondes de délai
}

/**
 * Exécution manuelle (pour tests)
 */
export async function sendScheduledSequenceEmailsNow() {
  console.log('🧪 Exécution manuelle sendScheduledSequenceEmails');
  await sendScheduledSequenceEmails();
}

