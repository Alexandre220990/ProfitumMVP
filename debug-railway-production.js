#!/usr/bin/env node

/**
 * Script pour diagnostiquer le problème en production Railway
 * Ce script simule exactement ce qui se passe en production
 */

import { createClient } from '@supabase/supabase-js';

// Simulation des variables d'environnement Railway
// (Dans un vrai déploiement, ces valeurs viendraient des variables d'environnement Railway)
const SUPABASE_URL = 'https://gvvlsgtubqfxdztldunj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTc2OTg0OSwiZXhwIjoyMDU3MzQ1ODQ5fQ.pN73GQUJHmd099PUcxAVGm-TFTe3KHeBemBk9IlGAcg';

console.log('🔍 DIAGNOSTIC RAILWAY PRODUCTION');
console.log('=================================');

// Créer le client Supabase comme en production
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function simulateProductionAuth() {
  console.log('🔍 Simulation de la route /api/auth/apporteur/login...');
  
  const email = 'conseilprofitum@gmail.com';
  const password = 'Berangerprofitum';
  
  console.log('🔑 Tentative de connexion APPORTEUR:', { email });
  
  // 1. Authentification Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError || !authData?.user) {
    console.error("❌ Erreur d'authentification APPORTEUR:", authError);
    return;
  }

  const userEmail = authData.user.email;
  
  console.log("🔍 Connexion APPORTEUR - Recherche EXCLUSIVE dans ApporteurAffaires");
  
  // 2. Recherche dans ApporteurAffaires (exactement comme le code)
  console.log("🔍 Recherche apporteur avec email:", userEmail);
  const { data: apporteur, error: apporteurError } = await supabase
    .from('ApporteurAffaires')
    .select('id, email, first_name, last_name, company_name, status')
    .eq('email', userEmail)
    .single();
    
  console.log("📊 Résultat requête Supabase:");
  console.log("   - Error:", apporteurError ? apporteurError.message : 'NONE');
  console.log("   - Data:", apporteur ? 'FOUND' : 'NULL');
  if (apporteur) {
    console.log("   - Statut:", apporteur.status);
    console.log("   - Type:", typeof apporteur.status);
  }
    
  if (apporteurError || !apporteur) {
    console.log("❌ Apporteur non trouvé:", apporteurError?.message);
    return;
  }
  
  // 3. Vérification du statut
  console.log("🔍 Vérification statut:", apporteur.status, "=== 'active' ?", apporteur.status === 'active');
  
  if (apporteur.status !== 'active') {
    console.log("❌ Apporteur non actif:", apporteur.status);
    return;
  }
  
  console.log("✅ Apporteur authentifié avec succès:", { email: userEmail, status: apporteur.status });
  
  // 4. Génération du token (simulation)
  console.log("🔑 Token JWT généré avec succès");
  
  console.log('\n🎯 RÉSULTAT: Authentification réussie en simulation');
}

// Test avec différentes configurations
async function testDifferentConfigs() {
  console.log('\n🔍 Test avec différentes configurations...');
  
  // Test 1: Avec service role key
  console.log('\n1️⃣ Test avec SERVICE_ROLE_KEY:');
  await simulateProductionAuth();
  
  // Test 2: Avec anon key (comme pourrait être configuré en production)
  console.log('\n2️⃣ Test avec ANON_KEY:');
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Njk4NDksImV4cCI6MjA1NzM0NTg0OX0.2hahkZasfMfdFhQvP7rvPHzO1DBCl0FfsRVkxVZfdgk';
  const supabaseAnon = createClient(SUPABASE_URL, anonKey);
  
  try {
    const { data: apporteur, error } = await supabaseAnon
      .from('ApporteurAffaires')
      .select('id, email, status')
      .eq('email', 'conseilprofitum@gmail.com')
      .single();
      
    console.log("📊 Résultat avec ANON_KEY:");
    console.log("   - Error:", error ? error.message : 'NONE');
    console.log("   - Data:", apporteur ? 'FOUND' : 'NULL');
    if (apporteur) {
      console.log("   - Statut:", apporteur.status);
    }
  } catch (err) {
    console.log("❌ Erreur avec ANON_KEY:", err.message);
  }
}

// Exécuter les tests
testDifferentConfigs().catch(console.error);
