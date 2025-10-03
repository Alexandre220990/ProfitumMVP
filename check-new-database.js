#!/usr/bin/env node

/**
 * Vérifier la nouvelle base de données Railway
 */

import { createClient } from '@supabase/supabase-js';

// Nouvelle configuration Railway
const SUPABASE_URL = 'https://gvvlsgtubqfxdztldunj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDYyNTU5NCwiZXhwIjoyMDUwMTk5NTk0fQ.1lYcYHhGJ8K1Q2X3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z0';

console.log('🔍 VÉRIFICATION NOUVELLE BASE DE DONNÉES RAILWAY');
console.log('================================================');
console.log('URL:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkNewDatabase() {
  try {
    console.log('\n🔍 ÉTAPE 1: Vérification de la table ApporteurAffaires');
    console.log('----------------------------------------------------');
    
    // Vérifier si la table existe
    const { data: apporteurs, error: tableError } = await supabase
      .from('ApporteurAffaires')
      .select('id, email, status, first_name, last_name, company_name')
      .limit(10);
    
    if (tableError) {
      console.error('❌ Erreur accès table ApporteurAffaires:', tableError.message);
      return;
    }
    
    console.log(`✅ Table ApporteurAffaires accessible (${apporteurs.length} apporteurs trouvés)`);
    
    if (apporteurs.length > 0) {
      console.log('\n📋 TOUS LES APPORTEURS:');
      apporteurs.forEach((apporteur, index) => {
        console.log(`   ${index + 1}. ${apporteur.email} - Status: ${apporteur.status} - ${apporteur.first_name} ${apporteur.last_name}`);
      });
    }
    
    console.log('\n🔍 ÉTAPE 2: Recherche spécifique de conseilprofitum@gmail.com');
    console.log('------------------------------------------------------------');
    
    const { data: specificApporteur, error: specificError } = await supabase
      .from('ApporteurAffaires')
      .select('id, email, first_name, last_name, company_name, status, created_at')
      .eq('email', 'conseilprofitum@gmail.com')
      .single();
    
    console.log('📊 Résultat recherche spécifique:');
    console.log('   - Error:', specificError ? specificError.message : 'NONE');
    console.log('   - Data:', specificApporteur ? 'FOUND' : 'NULL');
    
    if (specificApporteur) {
      console.log('✅ APPORTEUR TROUVÉ:');
      console.log(`   - ID: ${specificApporteur.id}`);
      console.log(`   - Email: ${specificApporteur.email}`);
      console.log(`   - Status: ${specificApporteur.status} (type: ${typeof specificApporteur.status})`);
      console.log(`   - Nom: ${specificApporteur.first_name} ${specificApporteur.last_name}`);
      console.log(`   - Société: ${specificApporteur.company_name}`);
    } else {
      console.log('❌ APPORTEUR NON TROUVÉ dans la nouvelle base de données');
    }
    
    console.log('\n🔍 ÉTAPE 3: Vérification des utilisateurs Supabase Auth');
    console.log('-------------------------------------------------------');
    
    // Note: On ne peut pas lister les utilisateurs avec la clé service_role
    // Mais on peut tester l'authentification
    console.log('ℹ️  Impossible de lister les utilisateurs Supabase Auth avec service_role_key');
    console.log('ℹ️  Il faut tester l\'authentification directement');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

checkNewDatabase();
