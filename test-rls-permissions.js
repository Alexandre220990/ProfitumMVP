#!/usr/bin/env node

/**
 * Test des permissions RLS pour ApporteurAffaires
 */

import { createClient } from '@supabase/supabase-js';

// Configuration Railway
const SUPABASE_URL = 'https://gvvlsgtubqfxdztldunj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTc2OTg0OSwiZXhwIjoyMDU3MzQ1ODQ5fQ.pN73GQUJHmd099PUcxAVGm-TFTe3KHeBemBk9IlGAcg';

console.log('🔍 TEST PERMISSIONS RLS APPORTEURAFFAIRES');
console.log('=========================================');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testRLSPermissions() {
  try {
    console.log('\n🔍 TEST 1: Requête avec select complet');
    console.log('---------------------------------------');
    
    const { data: apporteur1, error: error1 } = await supabase
      .from('ApporteurAffaires')
      .select('id, email, first_name, last_name, company_name, status, created_at')
      .eq('email', 'conseilprofitum@gmail.com')
      .single();
    
    console.log('📊 Résultat select complet:');
    console.log('   - Error:', error1 ? error1.message : 'NONE');
    console.log('   - Data:', apporteur1 ? 'FOUND' : 'NULL');
    if (apporteur1) {
      console.log('   - Status:', apporteur1.status);
      console.log('   - Status Type:', typeof apporteur1.status);
      console.log('   - Tous les champs:', Object.keys(apporteur1));
    }
    
    console.log('\n🔍 TEST 2: Requête avec select * (tous les champs)');
    console.log('--------------------------------------------------');
    
    const { data: apporteur2, error: error2 } = await supabase
      .from('ApporteurAffaires')
      .select('*')
      .eq('email', 'conseilprofitum@gmail.com')
      .single();
    
    console.log('📊 Résultat select *:');
    console.log('   - Error:', error2 ? error2.message : 'NONE');
    console.log('   - Data:', apporteur2 ? 'FOUND' : 'NULL');
    if (apporteur2) {
      console.log('   - Status:', apporteur2.status);
      console.log('   - Status Type:', typeof apporteur2.status);
      console.log('   - Tous les champs:', Object.keys(apporteur2));
    }
    
    console.log('\n🔍 TEST 3: Requête avec select status uniquement');
    console.log('--------------------------------------------------');
    
    const { data: apporteur3, error: error3 } = await supabase
      .from('ApporteurAffaires')
      .select('status')
      .eq('email', 'conseilprofitum@gmail.com')
      .single();
    
    console.log('📊 Résultat select status uniquement:');
    console.log('   - Error:', error3 ? error3.message : 'NONE');
    console.log('   - Data:', apporteur3 ? 'FOUND' : 'NULL');
    if (apporteur3) {
      console.log('   - Status:', apporteur3.status);
      console.log('   - Status Type:', typeof apporteur3.status);
    }
    
    console.log('\n🔍 TEST 4: Vérification des policies RLS');
    console.log('-----------------------------------------');
    
    // Test avec une requête admin pour voir si on peut bypasser RLS
    const { data: policies, error: policiesError } = await supabase.rpc('get_table_policies', {
      table_name: 'ApporteurAffaires'
    });
    
    if (policiesError) {
      console.log('❌ Impossible de récupérer les policies:', policiesError.message);
      console.log('ℹ️  Ceci est normal, la fonction get_table_policies n\'existe peut-être pas');
    } else {
      console.log('✅ Policies récupérées:', policies);
    }
    
    console.log('\n✅ RÉSUMÉ DES TESTS RLS');
    console.log('======================');
    
    if (apporteur1 && apporteur1.status !== undefined) {
      console.log('✅ Select complet: Status récupéré');
    } else {
      console.log('❌ Select complet: Status undefined');
    }
    
    if (apporteur2 && apporteur2.status !== undefined) {
      console.log('✅ Select *: Status récupéré');
    } else {
      console.log('❌ Select *: Status undefined');
    }
    
    if (apporteur3 && apporteur3.status !== undefined) {
      console.log('✅ Select status uniquement: Status récupéré');
    } else {
      console.log('❌ Select status uniquement: Status undefined');
    }
    
    // Conclusion
    if ((apporteur1 && apporteur1.status === undefined) && 
        (apporteur2 && apporteur2.status === undefined) && 
        (apporteur3 && apporteur3.status === undefined)) {
      console.log('\n🚨 CONCLUSION: PROBLÈME RLS CONFIRMÉ');
      console.log('   - Service Role Key ne peut pas accéder au champ status');
      console.log('   - RLS policies bloquent l\'accès au status');
      console.log('   - SOLUTION: Modifier les RLS policies ou utiliser une autre approche');
    } else {
      console.log('\n✅ CONCLUSION: PAS DE PROBLÈME RLS');
      console.log('   - Status accessible avec Service Role Key');
      console.log('   - Le problème est ailleurs');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test RLS:', error);
  }
}

testRLSPermissions();
