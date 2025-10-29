/**
 * Script pour vérifier les politiques RLS sur les tables
 */

require('dotenv').config({ path: './server/.env' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLS() {
  try {
    console.log('🔍 VÉRIFICATION DES POLITIQUES RLS\n');
    
    // Requête pour voir les politiques RLS
    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('*')
      .in('tablename', ['Expert', 'Client', 'ApporteurAffaires']);
    
    if (error) {
      console.log('⚠️ Impossible de lire pg_policies directement\n');
      console.log('Vérifions via le comportement...\n');
    } else {
      console.log('📋 Politiques RLS trouvées:');
      console.log(JSON.stringify(policies, null, 2));
    }
    
    // Test comportemental : comparer Client vs Expert
    console.log('=' .repeat(80));
    console.log('\n🧪 TEST COMPORTEMENTAL : Client vs Expert vs ApporteurAffaires\n');
    
    // Test avec Client
    console.log('1️⃣ TEST CLIENT (alainbonin@profitum.fr)');
    const clientAuth = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    const { data: clientAuthData } = await clientAuth.auth.signInWithPassword({
      email: 'alainbonin@profitum.fr',
      password: 'Test1234!'
    });
    
    if (clientAuthData?.user) {
      console.log('✅ Auth réussie:', clientAuthData.user.id);
      
      const { data: clientProfile } = await clientAuth
        .from('Client')
        .select('*')
        .eq('email', 'alainbonin@profitum.fr')
        .maybeSingle();
      
      console.log('Recherche Client:', clientProfile ? '✅ TROUVÉ' : '❌ PAS TROUVÉ');
      await clientAuth.auth.signOut();
    }
    
    console.log('\n2️⃣ TEST EXPERT (expert@profitum.fr)');
    const expertAuth = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    const { data: expertAuthData } = await expertAuth.auth.signInWithPassword({
      email: 'expert@profitum.fr',
      password: 'Expertprofitum'
    });
    
    if (expertAuthData?.user) {
      console.log('✅ Auth réussie:', expertAuthData.user.id);
      
      const { data: expertProfile, error: expertError } = await expertAuth
        .from('Expert')
        .select('*')
        .eq('email', 'expert@profitum.fr')
        .maybeSingle();
      
      console.log('Recherche Expert:', expertProfile ? '✅ TROUVÉ' : '❌ PAS TROUVÉ');
      if (expertError) {
        console.log('Erreur:', expertError.message);
        console.log('Code:', expertError.code);
        console.log('Details:', expertError.details);
        console.log('Hint:', expertError.hint);
      }
      await expertAuth.auth.signOut();
    }
    
    console.log('\n3️⃣ SANS SESSION (Service Role uniquement)');
    const noSessionClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    const { data: expertNoSession } = await noSessionClient
      .from('Expert')
      .select('*')
      .eq('email', 'expert@profitum.fr')
      .maybeSingle();
    
    console.log('Recherche Expert (sans session):', expertNoSession ? '✅ TROUVÉ' : '❌ PAS TROUVÉ');
    
    console.log('\n' + '=' .repeat(80));
    console.log('\n📊 DIAGNOSTIC:\n');
    console.log('Si Expert est trouvé SANS session mais PAS TROUVÉ AVEC session,');
    console.log('alors il y a un problème de politiques RLS sur la table Expert.\n');
    console.log('🔧 SOLUTION: Désactiver RLS sur la table Expert OU ajouter les bonnes politiques');
    console.log('\nCommande SQL pour désactiver RLS:');
    console.log('ALTER TABLE "Expert" DISABLE ROW LEVEL SECURITY;');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkRLS();

