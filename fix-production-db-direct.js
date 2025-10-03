#!/usr/bin/env node

/**
 * ============================================================================
 * CORRECTION DIRECTE BASE DE PRODUCTION
 * ============================================================================
 * 
 * Ce script corrige directement la base de production avec les vraies credentials
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

async function fixProductionDBDirect() {
  console.log('🔧 CORRECTION DIRECTE BASE DE PRODUCTION');
  console.log('==========================================');
  console.log('');

  try {
    // 1. Vérifier l'état actuel
    console.log('📊 1. Vérification état actuel...');
    const { data: currentApporteur, error: currentError } = await supabase
      .from('ApporteurAffaires')
      .select('*')
      .eq('email', 'conseilprofitum@gmail.com')
      .single();

    if (currentError) {
      console.error('❌ Erreur récupération:', currentError);
      return;
    }

    if (!currentApporteur) {
      console.log('❌ Apporteur non trouvé');
      return;
    }

    console.log('✅ Apporteur trouvé:');
    console.log(`   - ID: ${currentApporteur.id}`);
    console.log(`   - Email: ${currentApporteur.email}`);
    console.log(`   - Nom: ${currentApporteur.first_name} ${currentApporteur.last_name}`);
    console.log(`   - STATUT ACTUEL: "${currentApporteur.status}"`);
    console.log(`   - Type: ${typeof currentApporteur.status}`);
    console.log(`   - Créé le: ${currentApporteur.created_at}`);
    console.log(`   - Mis à jour le: ${currentApporteur.updated_at}`);
    console.log('');

    // 2. Forcer la correction vers "active"
    console.log('🔧 2. Correction forcée vers "active"...');
    
    const { data: updatedApporteur, error: updateError } = await supabase
      .from('ApporteurAffaires')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('email', 'conseilprofitum@gmail.com')
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour:', updateError);
      return;
    }

    console.log('✅ Mise à jour réussie:');
    console.log(`   - Nouveau statut: "${updatedApporteur.status}"`);
    console.log(`   - Mis à jour le: ${updatedApporteur.updated_at}`);
    console.log('');

    // 3. Vérification finale avec requête exacte de l'API
    console.log('🧪 3. Test avec requête exacte de l\'API...');
    
    // Reproduire exactement la requête de la route /api/auth/apporteur/login
    const { data: testApporteur, error: testError } = await supabase
      .from('ApporteurAffaires')
      .select('*')
      .eq('email', 'conseilprofitum@gmail.com')
      .single();

    if (testError) {
      console.log('❌ Erreur test:', testError.message);
    } else {
      console.log('✅ Test réussi:');
      console.log(`   - Statut: "${testApporteur.status}"`);
      console.log(`   - Type: ${typeof testApporteur.status}`);
      console.log(`   - === 'active': ${testApporteur.status === 'active'}`);
    }
    console.log('');

    // 4. Test de la logique conditionnelle
    console.log('🔍 4. Test logique conditionnelle...');
    console.log('=====================================');
    
    if (testError || !testApporteur) {
      console.log('❌ Condition: testError || !testApporteur = TRUE');
      console.log('   → API retournera 403 "pas enregistré"');
    } else {
      console.log('✅ Condition: testError || !testApporteur = FALSE');
      
      if (testApporteur.status !== 'active') {
        console.log('❌ Condition: status !== "active" = TRUE');
        console.log(`   → API retournera 403 "pas encore activé"`);
        console.log(`   → Statut actuel: "${testApporteur.status}"`);
      } else {
        console.log('✅ Condition: status !== "active" = FALSE');
        console.log('   → API devrait retourner 200 SUCCESS');
      }
    }
    console.log('');

    // 5. Résumé final
    console.log('🎯 5. RÉSUMÉ FINAL...');
    console.log('=====================');
    
    if (testApporteur && testApporteur.status === 'active') {
      console.log('🎉 CORRECTION RÉUSSIE !');
      console.log('========================');
      console.log('✅ Base de production corrigée');
      console.log('✅ Statut: "active"');
      console.log('✅ Logique: OK');
      console.log('');
      console.log('🧪 TEST RECOMMANDÉ:');
      console.log('===================');
      console.log('Maintenant, testez la connexion sur:');
      console.log('https://www.profitum.app/connexion-apporteur');
      console.log('');
      console.log('Si ça ne marche toujours pas, le problème vient du cache serveur.');
    } else {
      console.log('❌ CORRECTION ÉCHOUÉE');
      console.log('=====================');
      console.log('Il y a un problème plus profond.');
    }

  } catch (error) {
    console.error('💥 Erreur inattendue:', error);
  }
}

// Exécuter la correction
fixProductionDBDirect()
  .then(() => {
    console.log('');
    console.log('🏁 Correction terminée !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
