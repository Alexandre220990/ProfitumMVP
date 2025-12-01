/**
 * Script pour vérifier les réponses Gmail automatiquement
 * À exécuter via cron job ou N8N
 */

import { GmailService } from '../services/GmailService';

async function main() {
  try {
    console.log('🔍 Vérification des réponses Gmail...');
    
    // Vérifier les réponses des dernières 24h
    const sinceDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const result = await GmailService.fetchNewReplies(sinceDate);
    
    console.log(`✅ Traitement terminé:`);
    console.log(`   - ${result.processed} email(s) traité(s)`);
    console.log(`   - ${result.updated} réponse(s) détectée(s) et mise(s) à jour`);
    
    if (result.errors.length > 0) {
      console.error(`   - ${result.errors.length} erreur(s):`);
      result.errors.forEach((error, index) => {
        console.error(`     ${index + 1}. ${error}`);
      });
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erreur lors de la vérification:', error);
    process.exit(1);
  }
}

main();

