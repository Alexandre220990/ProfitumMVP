#!/usr/bin/env node

/**
 * Créer l'utilisateur apporteur dans la nouvelle base Railway
 */

import { createClient } from '@supabase/supabase-js';

// Configuration nouvelle base Railway
const SUPABASE_URL = 'https://gvvlsgtubqfxdztldunj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDYyNTU5NCwiZXhwIjoyMDUwMTk5NTk0fQ.1lYcYHhGJ8K1Q2X3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z0';

console.log('🔧 CRÉATION UTILISATEUR APPORTEUR DANS NOUVELLE BASE');
console.log('==================================================');
console.log('URL:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createApporteur() {
  try {
    console.log('\n🔍 ÉTAPE 1: Vérification de la table ApporteurAffaires');
    console.log('----------------------------------------------------');
    
    // Vérifier si la table existe
    const { data: apporteurs, error: tableError } = await supabase
      .from('ApporteurAffaires')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Erreur accès table ApporteurAffaires:', tableError.message);
      console.log('ℹ️  La table n\'existe peut-être pas encore');
      return;
    }
    
    console.log(`✅ Table ApporteurAffaires accessible (${apporteurs.length} apporteurs trouvés)`);
    
    console.log('\n🔍 ÉTAPE 2: Création de l\'utilisateur Supabase Auth');
    console.log('--------------------------------------------------');
    
    // 1. Créer l'utilisateur dans Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'conseilprofitum@gmail.com',
      password: 'Berangerprofitum',
      email_confirm: true
    });
    
    if (authError) {
      console.error('❌ Erreur création utilisateur Auth:', authError.message);
      return;
    }
    
    console.log('✅ Utilisateur créé dans Supabase Auth:');
    console.log(`   - ID: ${authUser.user.id}`);
    console.log(`   - Email: ${authUser.user.email}`);
    
    console.log('\n🔍 ÉTAPE 3: Création de l\'apporteur dans ApporteurAffaires');
    console.log('----------------------------------------------------------');
    
    // 2. Créer l'apporteur dans la table ApporteurAffaires
    const { data: apporteur, error: apporteurError } = await supabase
      .from('ApporteurAffaires')
      .insert({
        auth_id: authUser.user.id,
        email: 'conseilprofitum@gmail.com',
        first_name: 'Conseil',
        last_name: 'Profitum',
        company_name: 'Profitum Conseil',
        company_type: 'Conseil financier',
        phone: '+33123456789',
        siren: '123456789',
        commission_rate: 5.0,
        target_monthly: 10000,
        status: 'active',
        approved_at: new Date().toISOString(),
        approved_by: authUser.user.id,
        motivation_letter: 'Apporteur d\'affaires principal pour les tests',
        sector: 'Finance',
        affiliation_code: 'PROFITUM001'
      })
      .select()
      .single();
    
    if (apporteurError) {
      console.error('❌ Erreur création apporteur:', apporteurError.message);
      return;
    }
    
    console.log('✅ Apporteur créé dans ApporteurAffaires:');
    console.log(`   - ID: ${apporteur.id}`);
    console.log(`   - Email: ${apporteur.email}`);
    console.log(`   - Status: ${apporteur.status}`);
    console.log(`   - Nom: ${apporteur.first_name} ${apporteur.last_name}`);
    console.log(`   - Société: ${apporteur.company_name}`);
    
    console.log('\n✅ RÉSUMÉ');
    console.log('==========');
    console.log('✅ Utilisateur Supabase Auth créé');
    console.log('✅ Apporteur créé dans ApporteurAffaires');
    console.log('✅ Status: active');
    console.log('✅ Prêt pour l\'authentification');
    
    console.log('\n🚀 TEST DE L\'AUTHENTIFICATION');
    console.log('==============================');
    console.log('Vous pouvez maintenant tester:');
    console.log('curl -X POST "https://profitummvp-production.up.railway.app/api/auth/apporteur/login" \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"email": "conseilprofitum@gmail.com", "password": "Berangerprofitum"}\'');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
  }
}

createApporteur();
