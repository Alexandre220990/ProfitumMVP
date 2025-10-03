#!/usr/bin/env node

/**
 * ============================================================================
 * TEST REQUÊTE SUPABASE DIRECTE
 * ============================================================================
 * 
 * Ce script teste exactement la requête Supabase utilisée dans la route
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

async function testSupabaseQuery() {
  console.log('🧪 TEST REQUÊTE SUPABASE DIRECTE');
  console.log('=================================');
  console.log('');

  const testEmail = 'conseilprofitum@gmail.com';

  try {
    // Test 1: Requête exacte de la route
    console.log('📡 1. Test requête exacte de la route...');
    console.log('=========================================');
    console.log(`Email testé: ${testEmail}`);
    console.log('');

    const { data: apporteur, error: apporteurError } = await supabase
      .from('ApporteurAffaires')
      .select('id, email, first_name, last_name, company_name, status, created_at, updated_at')
      .eq('email', testEmail)
      .single();

    console.log('🔍 Résultat requête Supabase:');
    console.log(`   - Error: ${apporteurError ? 'OUI' : 'NON'}`);
    if (apporteurError) {
      console.log(`   - Message: ${apporteurError.message}`);
      console.log(`   - Code: ${apporteurError.code}`);
      console.log(`   - Détails: ${JSON.stringify(apporteurError, null, 2)}`);
    }
    console.log(`   - Data: ${apporteur ? 'TROUVÉ' : 'NULL'}`);
    
    if (apporteur) {
      console.log('📊 Données complètes:');
      console.log(JSON.stringify(apporteur, null, 2));
      console.log('');
      console.log('🔍 Analyse du statut:');
      console.log(`   - Statut: "${apporteur.status}"`);
      console.log(`   - Type: ${typeof apporteur.status}`);
      console.log(`   - === 'active': ${apporteur.status === 'active'}`);
      console.log(`   - === null: ${apporteur.status === null}`);
      console.log(`   - === undefined: ${apporteur.status === undefined}`);
    }
    console.log('');

    // Test 2: Requête avec select *
    console.log('📡 2. Test avec select *...');
    console.log('============================');
    
    const { data: apporteurAll, error: apporteurAllError } = await supabase
      .from('ApporteurAffaires')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (apporteurAllError) {
      console.log(`   ❌ Erreur: ${apporteurAllError.message}`);
    } else {
      console.log('✅ Requête réussie avec select *');
      console.log(`   - Statut: "${apporteurAll.status}"`);
      console.log(`   - Type: ${typeof apporteurAll.status}`);
    }
    console.log('');

    // Test 3: Requête avec select spécifique status
    console.log('📡 3. Test avec select spécifique status...');
    console.log('===========================================');
    
    const { data: apporteurStatus, error: apporteurStatusError } = await supabase
      .from('ApporteurAffaires')
      .select('status')
      .eq('email', testEmail)
      .single();

    if (apporteurStatusError) {
      console.log(`   ❌ Erreur: ${apporteurStatusError.message}`);
    } else {
      console.log('✅ Requête réussie avec select status');
      console.log(`   - Statut: "${apporteurStatus.status}"`);
      console.log(`   - Type: ${typeof apporteurStatus.status}`);
    }
    console.log('');

    // Test 4: Vérifier la connexion Supabase
    console.log('📡 4. Test connexion Supabase...');
    console.log('=================================');
    
    const { data: testData, error: testError } = await supabase
      .from('ApporteurAffaires')
      .select('count')
      .limit(1);

    if (testError) {
      console.log(`   ❌ Erreur connexion: ${testError.message}`);
    } else {
      console.log('✅ Connexion Supabase OK');
    }
    console.log('');

    // Analyse finale
    console.log('🎯 ANALYSE FINALE:');
    console.log('==================');
    
    if (apporteurError) {
      console.log('❌ PROBLÈME: Erreur Supabase');
      console.log(`   - ${apporteurError.message}`);
    } else if (!apporteur) {
      console.log('❌ PROBLÈME: Aucune donnée retournée');
    } else if (apporteur.status === undefined) {
      console.log('❌ PROBLÈME: Champ status undefined');
      console.log('   - Possible problème de mapping Supabase');
    } else if (apporteur.status === null) {
      console.log('❌ PROBLÈME: Champ status null');
      console.log('   - Valeur NULL en base malgré les scripts SQL');
    } else if (apporteur.status !== 'active') {
      console.log(`❌ PROBLÈME: Statut incorrect "${apporteur.status}"`);
    } else {
      console.log('✅ TOUT EST CORRECT');
      console.log('   - La requête Supabase fonctionne');
      console.log('   - Le problème vient d\'ailleurs');
    }

  } catch (error) {
    console.error('💥 Erreur inattendue:', error);
  }
}

// Exécuter le test
testSupabaseQuery()
  .then(() => {
    console.log('');
    console.log('🏁 Test terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
