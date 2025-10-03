#!/usr/bin/env node

/**
 * ============================================================================
 * DEBUG STATUT UNDEFINED - DIAGNOSTIC APPROFONDI
 * ============================================================================
 * 
 * Ce script reproduit exactement la requête de la route /api/auth/apporteur/login
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

async function debugUndefinedStatus() {
  console.log('🔍 DEBUG STATUT UNDEFINED - DIAGNOSTIC APPROFONDI');
  console.log('=================================================');
  console.log('');

  const testEmail = 'conseilprofitum@gmail.com';

  try {
    // 1. Reproduire exactement la requête de la route
    console.log('📡 1. REPRODUCTION EXACTE DE LA REQUÊTE API...');
    console.log('===============================================');
    console.log(`Email testé: ${testEmail}`);
    console.log('');

    // Requête exacte de la route /api/auth/apporteur/login
    const { data: apporteur, error: apporteurError } = await supabase
      .from('ApporteurAffaires')
      .select('*')
      .eq('email', testEmail)
      .single();

    console.log('🔍 Résultat de la requête Supabase:');
    console.log(`   - Error: ${apporteurError ? 'OUI' : 'NON'}`);
    if (apporteurError) {
      console.log(`   - Message d'erreur: ${apporteurError.message}`);
      console.log(`   - Code d'erreur: ${apporteurError.code}`);
      console.log(`   - Détails: ${JSON.stringify(apporteurError, null, 2)}`);
    }
    console.log(`   - Data: ${apporteur ? 'TROUVÉ' : 'NULL'}`);
    if (apporteur) {
      console.log(`   - Statut: "${apporteur.status}"`);
      console.log(`   - Type de statut: ${typeof apporteur.status}`);
      console.log(`   - Statut === null: ${apporteur.status === null}`);
      console.log(`   - Statut === undefined: ${apporteur.status === undefined}`);
      console.log(`   - Statut === 'active': ${apporteur.status === 'active'}`);
    }
    console.log('');

    // 2. Test avec différentes variantes de requête
    console.log('🧪 2. TESTS AVEC DIFFÉRENTES VARIANTES...');
    console.log('==========================================');
    
    // Test 1: Requête sans .single()
    console.log('Test 1: Requête sans .single()...');
    const { data: apporteursArray, error: arrayError } = await supabase
      .from('ApporteurAffaires')
      .select('*')
      .eq('email', testEmail);

    if (arrayError) {
      console.log(`   ❌ Erreur: ${arrayError.message}`);
    } else {
      console.log(`   ✅ Résultat: ${apporteursArray.length} apporteurs trouvés`);
      if (apporteursArray.length > 0) {
        console.log(`   - Premier statut: "${apporteursArray[0].status}"`);
      }
    }
    console.log('');

    // Test 2: Requête avec select spécifique
    console.log('Test 2: Requête avec select spécifique...');
    const { data: specificData, error: specificError } = await supabase
      .from('ApporteurAffaires')
      .select('id, email, status, first_name, last_name')
      .eq('email', testEmail)
      .single();

    if (specificError) {
      console.log(`   ❌ Erreur: ${specificError.message}`);
    } else {
      console.log(`   ✅ Résultat trouvé:`);
      console.log(`   - ID: ${specificData.id}`);
      console.log(`   - Email: ${specificData.email}`);
      console.log(`   - Statut: "${specificData.status}"`);
      console.log(`   - Nom: ${specificData.first_name} ${specificData.last_name}`);
    }
    console.log('');

    // Test 3: Vérifier tous les apporteurs
    console.log('Test 3: Vérification de tous les apporteurs...');
    const { data: allApporteurs, error: allError } = await supabase
      .from('ApporteurAffaires')
      .select('id, email, status, first_name, last_name')
      .order('created_at', { ascending: false });

    if (allError) {
      console.log(`   ❌ Erreur: ${allError.message}`);
    } else {
      console.log(`   ✅ ${allApporteurs.length} apporteurs trouvés:`);
      allApporteurs.forEach((a, index) => {
        console.log(`   ${index + 1}. ${a.email} - Statut: "${a.status}" (${typeof a.status})`);
      });
    }
    console.log('');

    // 3. Test de la logique conditionnelle
    console.log('🔧 3. TEST DE LA LOGIQUE CONDITIONNELLE...');
    console.log('==========================================');
    
    if (apporteurError || !apporteur) {
      console.log('❌ Condition: apporteurError || !apporteur = TRUE');
      console.log('   → La route retournera 403 avec "pas enregistré"');
    } else {
      console.log('✅ Condition: apporteurError || !apporteur = FALSE');
      console.log('   → On passe à la vérification du statut');
      
      if (apporteur.status !== 'active') {
        console.log('❌ Condition: apporteur.status !== "active" = TRUE');
        console.log(`   → Statut actuel: "${apporteur.status}" (${typeof apporteur.status})`);
        console.log('   → La route retournera 403 avec "pas encore activé"');
      } else {
        console.log('✅ Condition: apporteur.status !== "active" = FALSE');
        console.log('   → La route devrait retourner 200 avec succès');
      }
    }
    console.log('');

    // 4. Diagnostic final
    console.log('🎯 4. DIAGNOSTIC FINAL...');
    console.log('=========================');
    
    if (apporteurError) {
      console.log('❌ PROBLÈME: Erreur Supabase');
      console.log(`   - ${apporteurError.message}`);
      console.log('   - Solution: Vérifier la connexion à la base');
    } else if (!apporteur) {
      console.log('❌ PROBLÈME: Apporteur non trouvé');
      console.log('   - Solution: Vérifier que l\'email existe dans ApporteurAffaires');
    } else if (apporteur.status === undefined) {
      console.log('❌ PROBLÈME: Statut undefined');
      console.log('   - Solution: Vérifier la structure de la table');
    } else if (apporteur.status === null) {
      console.log('❌ PROBLÈME: Statut null');
      console.log('   - Solution: Mettre à jour le statut vers "active"');
    } else if (apporteur.status !== 'active') {
      console.log(`❌ PROBLÈME: Statut incorrect "${apporteur.status}"`);
      console.log('   - Solution: Mettre à jour le statut vers "active"');
    } else {
      console.log('✅ TOUT EST CORRECT');
      console.log('   - L\'authentification devrait fonctionner');
    }

  } catch (error) {
    console.error('💥 Erreur inattendue:', error);
  }
}

// Exécuter le debug
debugUndefinedStatus()
  .then(() => {
    console.log('');
    console.log('🏁 Debug terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
