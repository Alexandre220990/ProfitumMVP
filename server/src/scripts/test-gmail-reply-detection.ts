/**
 * Script de test : Détection de réponses Gmail et arrêt des séquences
 * 
 * Ce script permet de tester le workflow complet :
 * 1. Vérification des réponses Gmail
 * 2. Arrêt automatique des séquences
 * 3. Création des notifications admin
 */

import { GmailService } from '../services/GmailService';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testGmailReplyDetection() {
  console.log('🧪 TEST DÉTECTION RÉPONSES GMAIL\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Vérifier la configuration
  console.log('📋 ÉTAPE 1 : Vérification de la configuration');
  console.log('─────────────────────────────────────────');
  
  const hasClientId = !!process.env.GMAIL_CLIENT_ID;
  const hasClientSecret = !!process.env.GMAIL_CLIENT_SECRET;
  const hasRefreshToken = !!process.env.GMAIL_REFRESH_TOKEN;

  console.log(`GMAIL_CLIENT_ID: ${hasClientId ? '✅ Configuré' : '❌ Manquant'}`);
  console.log(`GMAIL_CLIENT_SECRET: ${hasClientSecret ? '✅ Configuré' : '❌ Manquant'}`);
  console.log(`GMAIL_REFRESH_TOKEN: ${hasRefreshToken ? '✅ Configuré' : '❌ Manquant'}`);

  if (!hasClientId || !hasClientSecret || !hasRefreshToken) {
    console.error('\n❌ Configuration Gmail incomplète. Vérifiez votre fichier .env');
    process.exit(1);
  }

  console.log('\n✅ Configuration Gmail complète\n');

  // Compter les prospects avant le test
  console.log('📊 ÉTAPE 2 : État avant le test');
  console.log('─────────────────────────────────────────');
  
  const { data: prospectsBefore, count: totalProspects } = await supabase
    .from('prospects')
    .select('*', { count: 'exact' });

  const prospectsWithReplies = prospectsBefore?.filter((p: any) => 
    p.emailing_status === 'replied'
  ).length || 0;

  const { data: scheduledEmailsBefore, count: totalScheduled } = await supabase
    .from('prospect_email_scheduled')
    .select('*', { count: 'exact' })
    .eq('status', 'pending');

  const { data: adminNotifsBefore, count: totalNotifs } = await supabase
    .from('AdminNotification')
    .select('*', { count: 'exact' })
    .eq('type', 'prospect_reply');

  console.log(`Total prospects: ${totalProspects}`);
  console.log(`Prospects avec réponses: ${prospectsWithReplies}`);
  console.log(`Emails programmés (pending): ${totalScheduled}`);
  console.log(`Notifications admin (prospect_reply): ${totalNotifs}`);

  // Lancer la vérification Gmail
  console.log('\n🔍 ÉTAPE 3 : Vérification des réponses Gmail');
  console.log('─────────────────────────────────────────');
  
  try {
    const sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 derniers jours
    console.log(`Recherche depuis: ${sinceDate.toISOString()}`);
    console.log('En cours...\n');

    const result = await GmailService.fetchNewReplies(sinceDate);

    console.log('Résultats:');
    console.log(`  📧 Emails traités: ${result.processed}`);
    console.log(`  ✅ Réponses détectées: ${result.updated}`);
    
    if (result.errors.length > 0) {
      console.log(`  ❌ Erreurs: ${result.errors.length}`);
      result.errors.forEach((error, index) => {
        console.log(`    ${index + 1}. ${error}`);
      });
    } else {
      console.log(`  ✅ Aucune erreur`);
    }

  } catch (error: any) {
    console.error('\n❌ Erreur lors de la vérification Gmail:', error.message);
    console.error('Détails:', error);
  }

  // Vérifier l'état après
  console.log('\n📊 ÉTAPE 4 : État après le test');
  console.log('─────────────────────────────────────────');

  const { data: prospectsAfter } = await supabase
    .from('prospects')
    .select('*');

  const prospectsWithRepliesAfter = prospectsAfter?.filter((p: any) => 
    p.emailing_status === 'replied'
  ).length || 0;

  const { data: scheduledEmailsAfter, count: totalScheduledAfter } = await supabase
    .from('prospect_email_scheduled')
    .select('*', { count: 'exact' })
    .eq('status', 'pending');

  const { data: cancelledEmails, count: totalCancelled } = await supabase
    .from('prospect_email_scheduled')
    .select('*', { count: 'exact' })
    .eq('status', 'cancelled')
    .contains('metadata', { cancelled_reason: 'prospect_replied' });

  const { data: adminNotifsAfter, count: totalNotifsAfter } = await supabase
    .from('AdminNotification')
    .select('*', { count: 'exact' })
    .eq('type', 'prospect_reply');

  console.log(`Total prospects: ${prospectsAfter?.length}`);
  console.log(`Prospects avec réponses: ${prospectsWithRepliesAfter} (${prospectsWithRepliesAfter > prospectsWithReplies ? '+' + (prospectsWithRepliesAfter - prospectsWithReplies) : '0'})`);
  console.log(`Emails programmés (pending): ${totalScheduledAfter} (${totalScheduled! - totalScheduledAfter! > 0 ? '-' + (totalScheduled! - totalScheduledAfter!) : '0'})`);
  console.log(`Emails annulés (replied): ${totalCancelled}`);
  console.log(`Notifications admin (prospect_reply): ${totalNotifsAfter} (${totalNotifsAfter! > totalNotifs! ? '+' + (totalNotifsAfter! - totalNotifs!) : '0'})`);

  // Résumé
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📝 RÉSUMÉ DU TEST\n');
  
  const newReplies = prospectsWithRepliesAfter - prospectsWithReplies;
  const cancelledCount = (totalScheduled || 0) - (totalScheduledAfter || 0);
  const newNotifs = (totalNotifsAfter || 0) - (totalNotifs || 0);

  if (newReplies > 0) {
    console.log(`✅ ${newReplies} nouvelle(s) réponse(s) détectée(s)`);
    console.log(`✅ ${cancelledCount} email(s) programmé(s) annulé(s)`);
    console.log(`✅ ${newNotifs} notification(s) admin créée(s)`);
    console.log('\n🎉 Le workflow de détection fonctionne correctement !');
  } else {
    console.log('ℹ️  Aucune nouvelle réponse détectée (normal si aucun prospect n\'a répondu)');
    console.log('\n📌 Pour tester complètement :');
    console.log('   1. Envoyez un email à un prospect depuis profitum.app@gmail.com');
    console.log('   2. Répondez à cet email depuis le compte du prospect');
    console.log('   3. Relancez ce script après quelques minutes');
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

// Exécuter le test
testGmailReplyDetection()
  .then(() => {
    console.log('✅ Test terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur durant le test:', error);
    process.exit(1);
  });

