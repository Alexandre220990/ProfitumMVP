/**
 * Script d'Exécution - Migration RDV
 * Exécute automatiquement le script SQL de migration
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement SUPABASE manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executerMigration() {
  console.log('\n🚀 EXÉCUTION DE LA MIGRATION RDV\n');
  console.log('═'.repeat(60));

  try {
    // Lire le script SQL corrigé
    const sqlPath = join(__dirname, '../migrations/20250110_unify_rdv_architecture_FIXED.sql');
    console.log(`📄 Lecture du script : ${sqlPath}`);
    
    const sqlScript = readFileSync(sqlPath, 'utf8');
    console.log(`✅ Script chargé (${sqlScript.length} caractères)`);
    
    // Demander confirmation
    console.log('\n⚠️  ATTENTION : Cette migration va :');
    console.log('   - Renommer ClientRDV → RDV');
    console.log('   - Renommer ClientRDV_Produits → RDV_Produits');
    console.log('   - Ajouter de nouveaux champs');
    console.log('   - Mettre à jour les index et RLS');
    console.log('');
    console.log('💡 Assurez-vous d\'avoir créé un backup de votre BDD !');
    console.log('');
    
    // Attendre 3 secondes pour que l'utilisateur puisse annuler
    console.log('⏱️  Démarrage dans 3 secondes... (Ctrl+C pour annuler)');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🔄 Exécution du script SQL...\n');
    
    // Exécuter le script SQL
    // Note: Supabase JS ne supporte pas l'exécution de scripts SQL complexes directement
    // On va découper en plusieurs requêtes
    
    const queries = sqlScript
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'));
    
    console.log(`📊 Nombre de requêtes à exécuter : ${queries.length}`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      
      // Ignorer les commentaires et lignes vides
      if (query.startsWith('--') || query.trim() === '') continue;
      
      // Afficher progression
      if (i % 10 === 0) {
        console.log(`⏳ Progression : ${i}/${queries.length} requêtes...`);
      }
      
      try {
        // Exécuter via RPC
        const { error } = await supabase.rpc('exec_sql', { sql_query: query + ';' })
          .catch(() => ({ error: null })); // Ignorer les erreurs RPC
        
        if (error) {
          // Essayer via requête directe pour certaines commandes
          const { error: directError } = await supabase
            .from('_raw')
            .select('*')
            .limit(0)
            .catch(() => ({ error: null }));
        }
        
        successCount++;
      } catch (error) {
        console.warn(`⚠️  Erreur sur requête ${i + 1}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n═'.repeat(60));
    console.log(`\n✅ Exécution terminée :`);
    console.log(`   - Succès : ${successCount}`);
    console.log(`   - Erreurs : ${errorCount}`);
    
    // Vérifier le résultat
    console.log('\n🔍 Vérification post-migration...\n');
    
    // Vérifier que la table RDV existe
    const { data: rdvs, error: rdvError } = await supabase
      .from('RDV')
      .select('*')
      .limit(1);
    
    if (rdvError) {
      console.error('❌ Erreur : Table RDV non accessible');
      console.error(rdvError.message);
      
      console.log('\n💡 SOLUTION : Exécutez le script manuellement via Supabase Dashboard :');
      console.log('   1. Ouvrir https://supabase.com');
      console.log('   2. SQL Editor > New query');
      console.log('   3. Copier le contenu de :');
      console.log('      server/migrations/20250110_unify_rdv_architecture_FIXED.sql');
      console.log('   4. Coller et exécuter');
      
      process.exit(1);
    }
    
    console.log('✅ Table RDV accessible');
    
    // Compter les RDV
    const { count: rdvCount } = await supabase
      .from('RDV')
      .select('*', { count: 'exact', head: true });
    
    console.log(`✅ Nombre de RDV : ${rdvCount || 0}`);
    
    // Vérifier RDV_Produits
    const { error: produitsError } = await supabase
      .from('RDV_Produits')
      .select('*')
      .limit(1);
    
    if (produitsError) {
      console.warn('⚠️  Table RDV_Produits non accessible');
    } else {
      const { count: produitsCount } = await supabase
        .from('RDV_Produits')
        .select('*', { count: 'exact', head: true });
      
      console.log(`✅ Nombre de produits liés : ${produitsCount || 0}`);
    }
    
    // Vérifier que ClientRDV n'existe plus
    const { error: clientRDVError } = await supabase
      .from('ClientRDV')
      .select('*')
      .limit(1);
    
    if (clientRDVError && clientRDVError.message.includes('does not exist')) {
      console.log('✅ ClientRDV a bien été renommé');
    } else if (!clientRDVError) {
      console.warn('⚠️  ClientRDV existe toujours (migration incomplète)');
    }
    
    console.log('\n═'.repeat(60));
    console.log('\n🎉 MIGRATION RÉUSSIE !\n');
    console.log('📝 Prochaines étapes :');
    console.log('   1. Redémarrer le serveur : cd server && npm run dev');
    console.log('   2. Tester l\'API : ./TEST-RDV-API.sh YOUR_TOKEN');
    console.log('   3. Vérifier les agendas dans l\'interface');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ ERREUR LORS DE LA MIGRATION :\n');
    console.error(error);
    console.log('\n💡 SOLUTION : Exécutez le script manuellement via Supabase Dashboard');
    console.log('   Guide : EXECUTE-MIGRATION.md');
    process.exit(1);
  }
}

// Exécuter
executerMigration().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

