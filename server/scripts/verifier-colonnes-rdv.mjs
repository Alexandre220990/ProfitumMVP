/**
 * Vérifier les colonnes de la table RDV directement
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifierColonnes() {
  console.log('\n🔍 VÉRIFICATION COLONNES TABLE RDV\n');
  
  try {
    // Essayer de sélectionner chaque colonne individuellement
    const colonnesTest = [
      { name: 'id', description: 'ID (existant)' },
      { name: 'scheduled_date', description: 'Date (existant)' },
      { name: 'scheduled_time', description: 'Heure (existant)' },
      { name: 'meeting_type', description: 'Type RDV (existant)' },
      { name: 'client_id', description: 'Client (existant)' },
      { name: 'expert_id', description: 'Expert (existant)' },
      { name: 'apporteur_id', description: 'Apporteur (existant)' },
      { name: 'status', description: 'Statut (existant)' },
      { name: 'title', description: 'NOUVEAU - Titre' },
      { name: 'category', description: 'NOUVEAU - Catégorie' },
      { name: 'source', description: 'NOUVEAU - Source' },
      { name: 'priority', description: 'NOUVEAU - Priorité' },
      { name: 'metadata', description: 'NOUVEAU - Métadonnées' },
      { name: 'created_by', description: 'NOUVEAU - Créateur' },
      { name: 'meeting_url', description: 'NOUVEAU - URL réunion' },
      { name: 'timezone', description: 'NOUVEAU - Fuseau horaire' },
      { name: 'internal_notes', description: 'NOUVEAU - Notes internes' },
      { name: 'reminder_sent', description: 'NOUVEAU - Rappel envoyé' },
      { name: 'confirmation_sent', description: 'NOUVEAU - Confirmation' },
      { name: 'original_date', description: 'NOUVEAU - Date originale' },
      { name: 'original_time', description: 'NOUVEAU - Heure originale' }
    ];
    
    console.log('📊 Test des colonnes :\n');
    
    let existantes = 0;
    let manquantes = 0;
    const colonnesManquantes = [];
    
    for (const col of colonnesTest) {
      try {
        const { error } = await supabase
          .from('RDV')
          .select(col.name)
          .limit(1);
        
        if (error) {
          console.log(`❌ ${col.name.padEnd(20)} - ${col.description}`);
          manquantes++;
          if (col.description.startsWith('NOUVEAU')) {
            colonnesManquantes.push(col.name);
          }
        } else {
          console.log(`✅ ${col.name.padEnd(20)} - ${col.description}`);
          existantes++;
        }
      } catch (err) {
        console.log(`❌ ${col.name.padEnd(20)} - Erreur: ${err.message}`);
        manquantes++;
      }
    }
    
    console.log('\n═'.repeat(60));
    console.log(`\n📊 RÉSULTAT : ${existantes} colonnes existantes, ${manquantes} manquantes\n`);
    
    if (colonnesManquantes.length > 0) {
      console.log('⚠️  COLONNES MANQUANTES À AJOUTER :\n');
      colonnesManquantes.forEach((col, i) => {
        console.log(`   ${i + 1}. ${col}`);
      });
      
      console.log('\n🔧 SOLUTION :\n');
      console.log('Le script de correction doit être exécuté dans Supabase Dashboard.');
      console.log('Vérifiez qu\'il n\'y a pas eu d\'erreur lors de l\'exécution.\n');
      console.log('📋 Fichier : server/migrations/20250110_correction_rdv.sql');
      console.log('🔗 Dashboard : https://supabase.com/dashboard/project/gvvlsgtubqfxdztldunj/sql/new');
      
      process.exit(1);
    } else {
      console.log('✅ TOUTES LES COLONNES NÉCESSAIRES SONT PRÉSENTES !');
      console.log('\n🎉 Migration complète ! Vous pouvez maintenant :');
      console.log('   1. Redémarrer le serveur : cd server && npm run dev');
      console.log('   2. Tester l\'API RDV');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

verifierColonnes();
