#!/usr/bin/env node

/**
 * ============================================================================
 * VÉRIFICATION STATUTS APPORTEURS D'AFFAIRES
 * ============================================================================
 * 
 * Ce script vérifie tous les statuts possibles pour les Apporteurs d'Affaires
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkApporteurStatuses() {
  console.log('🔍 VÉRIFICATION STATUTS APPORTEURS D\'AFFAIRES');
  console.log('==============================================');
  console.log('');

  try {
    // 1. Vérifier la contrainte de la table
    console.log('📋 1. Vérification des contraintes de la table...');
    
    // Récupérer toutes les informations sur la table
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_constraints', { table_name: 'ApporteurAffaires' });

    if (tableError) {
      console.log('⚠️ Impossible de récupérer les contraintes via RPC');
      console.log('   Erreur:', tableError.message);
    } else {
      console.log('✅ Contraintes récupérées:', tableInfo);
    }
    console.log('');

    // 2. Vérifier tous les statuts utilisés dans la base
    console.log('📊 2. Statuts actuellement utilisés dans la base...');
    const { data: allApporteurs, error: apporteursError } = await supabase
      .from('ApporteurAffaires')
      .select('id, email, first_name, last_name, status, created_at')
      .order('created_at', { ascending: false });

    if (apporteursError) {
      console.error('❌ Erreur récupération apporteurs:', apporteursError);
      return;
    }

    console.log(`✅ ${allApporteurs.length} apporteurs trouvés dans la base`);
    console.log('');

    // 3. Analyser les statuts
    const statusCounts = {};
    allApporteurs.forEach(apporteur => {
      const status = apporteur.status || 'NULL';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('📈 Répartition des statuts:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - "${status}": ${count} apporteurs`);
    });
    console.log('');

    // 4. Afficher tous les apporteurs avec leurs statuts
    console.log('📋 3. Détail de tous les apporteurs:');
    console.log('=====================================');
    allApporteurs.forEach((apporteur, index) => {
      console.log(`${index + 1}. ${apporteur.first_name} ${apporteur.last_name}`);
      console.log(`   - Email: ${apporteur.email}`);
      console.log(`   - Statut: "${apporteur.status}"`);
      console.log(`   - Créé le: ${apporteur.created_at}`);
      console.log('');
    });

    // 5. Test d'insertion avec différents statuts pour voir les erreurs
    console.log('🧪 4. Test des statuts valides...');
    console.log('==================================');
    
    const testStatuses = [
      'active',
      'inactive', 
      'candidature',
      'pending_approval',
      'approved',
      'rejected',
      'suspended',
      'test_status' // Statut qui devrait échouer
    ];

    for (const testStatus of testStatuses) {
      try {
        // Tentative d'insertion avec un email temporaire
        const testEmail = `test_status_${Date.now()}@test.com`;
        
        const { data, error } = await supabase
          .from('ApporteurAffaires')
          .insert({
            email: testEmail,
            first_name: 'Test',
            last_name: 'Status',
            company_name: 'Test Company',
            company_type: 'independant',
            commission_rate: 5,
            status: testStatus,
            auth_id: '00000000-0000-0000-0000-000000000000'
          })
          .select()
          .single();

        if (error) {
          console.log(`❌ "${testStatus}": ${error.message}`);
        } else {
          console.log(`✅ "${testStatus}": Statut valide`);
          // Nettoyer l'entrée de test
          await supabase
            .from('ApporteurAffaires')
            .delete()
            .eq('id', data.id);
        }
      } catch (err) {
        console.log(`💥 "${testStatus}": Erreur inattendue - ${err.message}`);
      }
    }

  } catch (error) {
    console.error('💥 Erreur inattendue:', error);
  }
}

// Exécuter la vérification
checkApporteurStatuses()
  .then(() => {
    console.log('');
    console.log('🏁 Vérification terminée !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
