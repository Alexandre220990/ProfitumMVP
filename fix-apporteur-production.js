#!/usr/bin/env node

/**
 * Script pour diagnostiquer et corriger le problème d'authentification apporteur en production
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Configuration Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseApporteur() {
  console.log('🔍 DIAGNOSTIC COMPLET - APPORTEUR D\'AFFAIRES');
  console.log('='.repeat(60));
  
  const email = 'conseilprofitum@gmail.com';
  
  // 1. Vérifier la connexion Supabase
  console.log('\n1️⃣ Vérification de la connexion Supabase...');
  console.log('   - URL:', process.env.SUPABASE_URL);
  console.log('   - Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'DÉFINI' : 'MANQUANT');
  
  // 2. Rechercher l'apporteur dans la table
  console.log('\n2️⃣ Recherche dans la table ApporteurAffaires...');
  const { data: apporteur, error: apporteurError } = await supabase
    .from('ApporteurAffaires')
    .select('*')
    .eq('email', email)
    .single();
    
  if (apporteurError) {
    console.log('❌ Erreur lors de la recherche:', apporteurError.message);
    return;
  }
  
  if (!apporteur) {
    console.log('❌ Apporteur non trouvé dans la table ApporteurAffaires');
    return;
  }
  
  console.log('✅ Apporteur trouvé:');
  console.log('   - ID:', apporteur.id);
  console.log('   - Email:', apporteur.email);
  console.log('   - Nom:', apporteur.first_name, apporteur.last_name);
  console.log('   - Status:', apporteur.status);
  console.log('   - Type de status:', typeof apporteur.status);
  console.log('   - Company:', apporteur.company_name);
  console.log('   - Créé le:', apporteur.created_at);
  console.log('   - Approuvé le:', apporteur.approved_at);
  
  // 3. Vérifier l'authentification Supabase Auth
  console.log('\n3️⃣ Test d\'authentification Supabase Auth...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email,
    password: 'Berangerprofitum'
  });
  
  if (authError) {
    console.log('❌ Erreur d\'authentification:', authError.message);
  } else {
    console.log('✅ Authentification réussie:');
    console.log('   - User ID:', authData.user.id);
    console.log('   - Email:', authData.user.email);
    console.log('   - Auth ID:', authData.user.id);
  }
  
  // 4. Vérifier la correspondance entre auth_id et id
  console.log('\n4️⃣ Vérification de la correspondance auth_id...');
  if (apporteur.auth_id) {
    console.log('   - Auth ID dans ApporteurAffaires:', apporteur.auth_id);
    if (authData?.user) {
      console.log('   - Auth ID de Supabase Auth:', authData.user.id);
      console.log('   - Correspondance:', apporteur.auth_id === authData.user.id ? '✅ CORRECT' : '❌ DIFFÉRENT');
    }
  } else {
    console.log('   - ❌ Auth ID manquant dans ApporteurAffaires');
  }
  
  // 5. Vérifier et corriger le statut si nécessaire
  console.log('\n5️⃣ Vérification du statut...');
  if (apporteur.status !== 'active') {
    console.log('❌ Statut incorrect:', apporteur.status);
    console.log('🔧 Correction du statut vers "active"...');
    
    const { data: updateData, error: updateError } = await supabase
      .from('ApporteurAffaires')
      .update({ 
        status: 'active',
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', apporteur.id)
      .select();
      
    if (updateError) {
      console.log('❌ Erreur lors de la mise à jour:', updateError.message);
    } else {
      console.log('✅ Statut mis à jour avec succès');
      console.log('   - Nouveau statut:', updateData[0].status);
      console.log('   - Date d\'approbation:', updateData[0].approved_at);
    }
  } else {
    console.log('✅ Statut correct:', apporteur.status);
  }
  
  // 6. Vérifier la requête exacte du code de production
  console.log('\n6️⃣ Test de la requête exacte du code de production...');
  const { data: testApporteur, error: testError } = await supabase
    .from('ApporteurAffaires')
    .select('id, email, first_name, last_name, company_name, status')
    .eq('email', email)
    .single();
    
  console.log('📊 Résultat de la requête:');
  console.log('   - Error:', testError ? testError.message : 'NONE');
  console.log('   - Data:', testApporteur ? 'FOUND' : 'NULL');
  if (testApporteur) {
    console.log('   - Statut:', testApporteur.status);
    console.log('   - Type:', typeof testApporteur.status);
    console.log('   - Vérification active:', testApporteur.status === 'active');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 DIAGNOSTIC TERMINÉ');
}

// Exécuter le diagnostic
diagnoseApporteur().catch(console.error);
