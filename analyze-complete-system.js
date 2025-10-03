#!/usr/bin/env node

/**
 * ANALYSE COMPLÈTE DU SYSTÈME
 * Base de données + Frontend + API
 */

import { createClient } from '@supabase/supabase-js';

// Configuration Railway
const SUPABASE_URL = 'https://gvvlsgtubqfxdztldunj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTc2OTg0OSwiZXhwIjoyMDU3MzQ1ODQ5fQ.pN73GQUJHmd099PUcxAVGm-TFTe3KHeBemBk9IlGAcg';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Njk4NDksImV4cCI6MjA1NzM0NTg0OX0.2hahkZasfMfdFhQvP7rvPHzO1DBCl0FfsRVkxVZfdgk';

console.log('🔍 ANALYSE COMPLÈTE DU SYSTÈME');
console.log('===============================');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function analyzeCompleteSystem() {
  try {
    console.log('\n📊 ÉTAPE 1: ANALYSE BASE DE DONNÉES');
    console.log('====================================');
    
    // 1. Vérifier la table ApporteurAffaires
    console.log('\n🔍 1.1 Structure de la table ApporteurAffaires');
    const { data: apporteurs, error: tableError } = await supabase
      .from('ApporteurAffaires')
      .select('*')
      .limit(3);
    
    if (tableError) {
      console.error('❌ Erreur table ApporteurAffaires:', tableError.message);
      return;
    }
    
    console.log(`✅ Table ApporteurAffaires accessible (${apporteurs.length} apporteurs)`);
    
    if (apporteurs.length > 0) {
      console.log('\n📋 Structure des données:');
      const sampleApporteur = apporteurs[0];
      Object.keys(sampleApporteur).forEach(key => {
        const value = sampleApporteur[key];
        const type = typeof value;
        console.log(`   - ${key}: ${type} = ${value}`);
      });
    }
    
    // 2. Recherche spécifique de conseilprofitum@gmail.com
    console.log('\n🔍 1.2 Recherche spécifique de conseilprofitum@gmail.com');
    const { data: specificApporteur, error: specificError } = await supabase
      .from('ApporteurAffaires')
      .select('*')
      .eq('email', 'conseilprofitum@gmail.com')
      .single();
    
    console.log('📊 Résultat recherche spécifique:');
    console.log('   - Error:', specificError ? specificError.message : 'NONE');
    console.log('   - Data:', specificApporteur ? 'FOUND' : 'NULL');
    
    if (specificApporteur) {
      console.log('\n✅ APPORTEUR CONSEILPROFITUM TROUVÉ:');
      console.log(`   - ID: ${specificApporteur.id}`);
      console.log(`   - Email: ${specificApporteur.email}`);
      console.log(`   - Status: "${specificApporteur.status}" (type: ${typeof specificApporteur.status})`);
      console.log(`   - Status === 'active': ${specificApporteur.status === 'active'}`);
      console.log(`   - Auth ID: ${specificApporteur.auth_id}`);
      console.log(`   - Nom: ${specificApporteur.first_name} ${specificApporteur.last_name}`);
      console.log(`   - Société: ${specificApporteur.company_name}`);
      console.log(`   - Créé le: ${specificApporteur.created_at}`);
      console.log(`   - Approuvé le: ${specificApporteur.approved_at}`);
      console.log(`   - Approuvé par: ${specificApporteur.approved_by}`);
    } else {
      console.log('❌ APPORTEUR CONSEILPROFITUM NON TROUVÉ');
    }
    
    // 3. Test authentification Supabase Auth
    console.log('\n🔍 1.3 Test authentification Supabase Auth');
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'conseilprofitum@gmail.com',
        password: 'Berangerprofitum'
      });
      
      if (authError) {
        console.log('❌ Erreur authentification Supabase:', authError.message);
      } else {
        console.log('✅ Authentification Supabase réussie:');
        console.log(`   - User ID: ${authData.user.id}`);
        console.log(`   - Email: ${authData.user.email}`);
        console.log(`   - Email Verified: ${authData.user.email_confirmed_at ? 'YES' : 'NO'}`);
        console.log(`   - Created: ${authData.user.created_at}`);
        
        // Vérifier si auth_id correspond
        if (specificApporteur && authData.user.id === specificApporteur.auth_id) {
          console.log('✅ Auth ID correspond parfaitement');
        } else {
          console.log('❌ Auth ID ne correspond pas');
          console.log(`   - Auth User ID: ${authData.user.id}`);
          console.log(`   - Apporteur Auth ID: ${specificApporteur?.auth_id}`);
        }
      }
    } catch (authErr) {
      console.log('❌ Erreur auth:', authErr.message);
    }
    
    console.log('\n📊 ÉTAPE 2: ANALYSE FRONTEND');
    console.log('============================');
    console.log('ℹ️  Le frontend utilise probablement:');
    console.log('   - Route: /api/auth/apporteur/login');
    console.log('   - Méthode: POST');
    console.log('   - Body: { email, password }');
    console.log('   - Réponse attendue: { success: true, data: { token, user } }');
    
    console.log('\n📊 ÉTAPE 3: ANALYSE API BACKEND');
    console.log('================================');
    console.log('ℹ️  Le backend doit:');
    console.log('   1. Recevoir POST /api/auth/apporteur/login');
    console.log('   2. Authentifier avec Supabase Auth');
    console.log('   3. Chercher dans table ApporteurAffaires');
    console.log('   4. Vérifier status === "active"');
    console.log('   5. Générer token JWT');
    console.log('   6. Retourner { success: true, data: { token, user } }');
    
    console.log('\n✅ RÉSUMÉ DE L\'ANALYSE');
    console.log('======================');
    if (specificApporteur) {
      console.log('✅ Base de données: OK');
      console.log('✅ Utilisateur trouvé: OK');
      console.log(`✅ Status: "${specificApporteur.status}"`);
      console.log(`✅ Status actif: ${specificApporteur.status === 'active' ? 'OUI' : 'NON'}`);
    } else {
      console.log('❌ Base de données: PROBLÈME');
      console.log('❌ Utilisateur non trouvé');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

analyzeCompleteSystem();
