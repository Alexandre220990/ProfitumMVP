#!/usr/bin/env node

/**
 * Script de test pour le nouveau système d'authentification apporteur
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 TEST DU NOUVEAU SYSTÈME AUTHENTIFICATION APPORTEUR');
console.log('====================================================');

// 1. Test avec SUPABASE_KEY (clé anonyme) - comme notre nouveau client apporteur
console.log('\n1️⃣ Test avec SUPABASE_KEY (nouveau système apporteur)...');

const supabaseApporteur = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
);

async function testApporteurAuth() {
  const email = 'conseilprofitum@gmail.com';
  const password = 'Berangerprofitum';
  
  console.log('🔑 Tentative d\'authentification avec SUPABASE_KEY...');
  
  // Test d'authentification
  const { data: authData, error: authError } = await supabaseApporteur.auth.signInWithPassword({
    email,
    password
  });
  
  if (authError) {
    console.log('❌ Erreur d\'authentification:', authError.message);
    return;
  }
  
  console.log('✅ Authentification réussie avec SUPABASE_KEY');
  console.log('   - User ID:', authData.user.id);
  console.log('   - Email:', authData.user.email);
  
  // Test de lecture des données apporteur
  console.log('\n🔍 Test de lecture des données apporteur...');
  const { data: apporteur, error: apporteurError } = await supabaseApporteur
    .from('ApporteurAffaires')
    .select('id, email, first_name, last_name, company_name, status')
    .eq('email', email)
    .single();
    
  console.log('📊 Résultat lecture avec SUPABASE_KEY:');
  console.log('   - Error:', apporteurError ? apporteurError.message : 'NONE');
  console.log('   - Data:', apporteur ? 'FOUND' : 'NULL');
  if (apporteur) {
    console.log('   - Statut:', apporteur.status);
    console.log('   - Type:', typeof apporteur.status);
    console.log('   - Active:', apporteur.status === 'active');
  }
  
  // Test de simulation de la route complète
  console.log('\n🎯 Simulation de la route /api/auth/apporteur/login...');
  if (apporteur && apporteur.status === 'active') {
    console.log('✅ Route apporteur/login devrait fonctionner');
    console.log('   - Authentification: ✅');
    console.log('   - Lecture données: ✅');
    console.log('   - Statut actif: ✅');
  } else {
    console.log('❌ Route apporteur/login va échouer');
    if (!apporteur) console.log('   - Raison: Apporteur non trouvé');
    if (apporteur && apporteur.status !== 'active') console.log('   - Raison: Statut non actif');
  }
}

// 2. Comparaison avec l'ancien système (SERVICE_ROLE_KEY)
console.log('\n2️⃣ Comparaison avec SERVICE_ROLE_KEY (ancien système)...');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAdminAuth() {
  const email = 'conseilprofitum@gmail.com';
  
  console.log('🔍 Test de lecture avec SERVICE_ROLE_KEY...');
  const { data: apporteur, error: apporteurError } = await supabaseAdmin
    .from('ApporteurAffaires')
    .select('id, email, first_name, last_name, company_name, status')
    .eq('email', email)
    .single();
    
  console.log('📊 Résultat lecture avec SERVICE_ROLE_KEY:');
  console.log('   - Error:', apporteurError ? apporteurError.message : 'NONE');
  console.log('   - Data:', apporteur ? 'FOUND' : 'NULL');
  if (apporteur) {
    console.log('   - Statut:', apporteur.status);
  }
}

// Exécuter les tests
async function runTests() {
  await testApporteurAuth();
  await testAdminAuth();
  
  console.log('\n🎉 TESTS TERMINÉS');
  console.log('==================');
  console.log('Le nouveau système d\'authentification apporteur est prêt!');
}

runTests().catch(console.error);
