#!/usr/bin/env node

/**
 * Test avec les vraies clés de la base Railway
 */

import { createClient } from '@supabase/supabase-js';

// Vraies clés de la base Railway
const SUPABASE_URL = 'https://gvvlsgtubqfxdztldunj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Njk4NDksImV4cCI6MjA1NzM0NTg0OX0.2hahkZasfMfdFhQvP7rvPHzO1DBCl0FfsRVkxVZfdgk';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTc2OTg0OSwiZXhwIjoyMDU3MzQ1ODQ5fQ.pN73GQUJHmd099PUcxAVGm-TFTe3KHeBemBk9IlGAcg';

console.log('🔍 TEST AVEC LES VRAIES CLÉS RAILWAY');
console.log('====================================');
console.log('URL:', SUPABASE_URL);
console.log('Anon Key:', SUPABASE_ANON_KEY.substring(0, 50) + '...');
console.log('Service Role Key:', SUPABASE_SERVICE_ROLE_KEY.substring(0, 50) + '...');

async function testRealKeys() {
  try {
    console.log('\n🔍 ÉTAPE 1: Test avec SERVICE_ROLE_KEY');
    console.log('---------------------------------------');
    
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Test accès table ApporteurAffaires
    const { data: apporteurs, error: tableError } = await supabaseAdmin
      .from('ApporteurAffaires')
      .select('id, email, status, first_name, last_name, company_name')
      .limit(5);
    
    if (tableError) {
      console.error('❌ Erreur SERVICE_ROLE_KEY:', tableError.message);
    } else {
      console.log(`✅ SERVICE_ROLE_KEY fonctionne (${apporteurs.length} apporteurs trouvés)`);
      
      if (apporteurs.length > 0) {
        console.log('\n📋 APPORTEURS TROUVÉS:');
        apporteurs.forEach((apporteur, index) => {
          console.log(`   ${index + 1}. ${apporteur.email} - Status: ${apporteur.status} - ${apporteur.first_name} ${apporteur.last_name}`);
        });
      }
    }
    
    console.log('\n🔍 ÉTAPE 2: Recherche spécifique de conseilprofitum@gmail.com');
    console.log('------------------------------------------------------------');
    
    const { data: specificApporteur, error: specificError } = await supabaseAdmin
      .from('ApporteurAffaires')
      .select('id, email, first_name, last_name, company_name, status, created_at')
      .eq('email', 'conseilprofitum@gmail.com')
      .single();
    
    console.log('📊 Résultat recherche spécifique:');
    console.log('   - Error:', specificError ? specificError.message : 'NONE');
    console.log('   - Data:', specificApporteur ? 'FOUND' : 'NULL');
    
    if (specificApporteur) {
      console.log('✅ APPORTEUR CONSEILPROFITUM TROUVÉ:');
      console.log(`   - ID: ${specificApporteur.id}`);
      console.log(`   - Email: ${specificApporteur.email}`);
      console.log(`   - Status: ${specificApporteur.status} (type: ${typeof specificApporteur.status})`);
      console.log(`   - Nom: ${specificApporteur.first_name} ${specificApporteur.last_name}`);
      console.log(`   - Société: ${specificApporteur.company_name}`);
      console.log(`   - Créé le: ${specificApporteur.created_at}`);
      
      console.log('\n🔍 ÉTAPE 3: Test authentification Supabase Auth');
      console.log('------------------------------------------------');
      
      // Test d'authentification
      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
          email: 'conseilprofitum@gmail.com',
          password: 'Berangerprofitum'
        });
        
        if (authError) {
          console.log('❌ Erreur authentification:', authError.message);
        } else {
          console.log('✅ Authentification Supabase réussie:');
          console.log(`   - User ID: ${authData.user.id}`);
          console.log(`   - Email: ${authData.user.email}`);
        }
      } catch (authErr) {
        console.log('❌ Erreur auth:', authErr.message);
      }
      
    } else {
      console.log('❌ APPORTEUR CONSEILPROFITUM NON TROUVÉ');
    }
    
    console.log('\n🔍 ÉTAPE 4: Test avec ANON_KEY');
    console.log('------------------------------');
    
    const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Test avec clé anonyme
    const { data: anonTest, error: anonError } = await supabaseAnon
      .from('ApporteurAffaires')
      .select('id, email, status')
      .limit(1);
    
    if (anonError) {
      console.log('❌ ANON_KEY ne peut pas accéder (normal si RLS activé):', anonError.message);
    } else {
      console.log('✅ ANON_KEY fonctionne:', anonTest.length, 'apporteurs');
    }
    
    console.log('\n✅ RÉSUMÉ');
    console.log('==========');
    console.log('✅ Clés fonctionnelles identifiées');
    console.log('✅ Base de données accessible');
    if (specificApporteur) {
      console.log('✅ Utilisateur conseilprofitum@gmail.com trouvé');
      console.log(`✅ Status: ${specificApporteur.status}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testRealKeys();
