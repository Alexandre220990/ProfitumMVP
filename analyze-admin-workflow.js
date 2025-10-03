#!/usr/bin/env node

/**
 * ============================================================================
 * ANALYSE WORKFLOW ADMIN - VALIDATION APPORTEUR
 * ============================================================================
 * 
 * Ce script analyse le processus de validation admin pour les apporteurs
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

async function analyzeAdminWorkflow() {
  console.log('🔍 ANALYSE WORKFLOW ADMIN - VALIDATION APPORTEUR');
  console.log('=================================================');
  console.log('');

  try {
    // 1. Analyser la structure de la table
    console.log('📋 1. ANALYSE DE LA STRUCTURE DE LA TABLE');
    console.log('==========================================');
    
    const { data: apporteurs, error: apporteursError } = await supabase
      .from('ApporteurAffaires')
      .select('*')
      .limit(1);

    if (apporteursError) {
      console.error('❌ Erreur récupération structure:', apporteursError);
      return;
    }

    if (apporteurs && apporteurs.length > 0) {
      console.log('✅ Structure de la table ApporteurAffaires:');
      const sample = apporteurs[0];
      Object.keys(sample).forEach(key => {
        const value = sample[key];
        const type = typeof value;
        const isNull = value === null ? ' (NULL)' : '';
        console.log(`   - ${key}: ${type}${isNull}`);
      });
    }
    console.log('');

    // 2. Analyser tous les statuts possibles
    console.log('📊 2. ANALYSE DES STATUTS');
    console.log('=========================');
    
    const { data: allApporteurs, error: allError } = await supabase
      .from('ApporteurAffaires')
      .select('id, email, first_name, last_name, status, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Erreur récupération apporteurs:', allError);
      return;
    }

    console.log(`✅ ${allApporteurs.length} apporteurs trouvés`);
    console.log('');

    // Analyser les statuts
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

    // 3. Analyser votre apporteur spécifique
    console.log('🎯 3. ANALYSE DE VOTRE APPORTEUR');
    console.log('=================================');
    
    const yourApporteur = allApporteurs.find(a => a.email === 'conseilprofitum@gmail.com');
    
    if (yourApporteur) {
      console.log('✅ Votre apporteur trouvé:');
      console.log(`   - ID: ${yourApporteur.id}`);
      console.log(`   - Email: ${yourApporteur.email}`);
      console.log(`   - Nom: ${yourApporteur.first_name} ${yourApporteur.last_name}`);
      console.log(`   - Statut: "${yourApporteur.status}"`);
      console.log(`   - Créé le: ${yourApporteur.created_at}`);
      console.log(`   - Mis à jour le: ${yourApporteur.updated_at}`);
      console.log('');
      
      // Analyser le statut
      if (yourApporteur.status === 'active') {
        console.log('✅ STATUT CORRECT: "active"');
        console.log('   → L\'apporteur devrait pouvoir se connecter');
      } else {
        console.log(`❌ STATUT PROBLÉMATIQUE: "${yourApporteur.status}"`);
        console.log('   → L\'apporteur ne peut pas se connecter');
        console.log('   → Le statut devrait être "active"');
      }
    } else {
      console.log('❌ Votre apporteur non trouvé');
    }
    console.log('');

    // 4. Analyser le processus de validation
    console.log('🔧 4. ANALYSE DU PROCESSUS DE VALIDATION');
    console.log('=========================================');
    
    console.log('📋 Workflow attendu:');
    console.log('   1. Apporteur s\'inscrit → statut "candidature"');
    console.log('   2. Admin valide → statut "active"');
    console.log('   3. Apporteur peut se connecter');
    console.log('');
    
    console.log('🔍 Vérifications nécessaires:');
    console.log('   - Le statut initial est-il "candidature" ?');
    console.log('   - Le processus de validation admin change-t-il le statut ?');
    console.log('   - La logique d\'authentification vérifie-t-elle le bon statut ?');
    console.log('');

    // 5. Proposer des tests
    console.log('🧪 5. TESTS PROPOSÉS');
    console.log('=====================');
    console.log('Pour diagnostiquer le problème:');
    console.log('');
    console.log('A) Test de changement de statut:');
    console.log('   - Changer le statut vers "candidature"');
    console.log('   - Tester la connexion (devrait échouer)');
    console.log('   - Changer le statut vers "active"');
    console.log('   - Tester la connexion (devrait réussir)');
    console.log('');
    console.log('B) Test de la logique d\'authentification:');
    console.log('   - Vérifier que la route /api/auth/apporteur/login');
    console.log('   - Vérifie bien le statut "active"');
    console.log('');
    console.log('C) Test du processus admin:');
    console.log('   - Créer un nouvel apporteur');
    console.log('   - Vérifier le statut initial');
    console.log('   - Valider via l\'admin');
    console.log('   - Vérifier le changement de statut');

  } catch (error) {
    console.error('💥 Erreur inattendue:', error);
  }
}

// Exécuter l'analyse
analyzeAdminWorkflow()
  .then(() => {
    console.log('');
    console.log('🏁 Analyse terminée !');
    console.log('');
    console.log('📋 PROCHAINES ÉTAPES:');
    console.log('======================');
    console.log('1. Exécutez les requêtes SQL que j\'ai proposées');
    console.log('2. Collez-moi les résultats');
    console.log('3. Nous analyserons ensemble le problème');
    console.log('4. Nous corrigerons de manière ciblée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
