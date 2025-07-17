import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

// Forcer le chargement du .env à la racine du projet
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Script pour tester la connexion Supabase
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase avec la clé de service (plus de permissions)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Utiliser la clé de service

console.log('🔍 Test de connexion Supabase...');
console.log('Chemin .env chargé:', path.resolve(__dirname, '.env'));
console.log('URL:', supabaseUrl);
console.log('Key (Service Role):', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NON TROUVÉE');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('SUPABASE_URL:', supabaseUrl ? 'OK' : 'MANQUANT');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'OK' : 'MANQUANT');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  try {
    console.log('\n1️⃣ Test de connexion basique...');
    
    // Test simple de connexion
    const { data, error } = await supabase
      .from('Client')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Erreur de connexion Supabase:', error);
      return;
    }

    console.log('✅ Connexion Supabase réussie');
    console.log('Nombre de clients:', data?.[0]?.count || 'N/A');

    console.log('\n2️⃣ Test de la table Client...');
    
    // Test de la structure de la table Client
    const { data: clientStructure, error: structureError } = await supabase
      .from('Client')
      .select('*')
      .limit(1);

    if (structureError) {
      console.error('❌ Erreur accès table Client:', structureError);
      return;
    }

    console.log('✅ Table Client accessible');
    console.log('Colonnes disponibles:', Object.keys(clientStructure?.[0] || {}));

    console.log('\n3️⃣ Test de création d\'un utilisateur Auth...');
    
    // Test de création d'un utilisateur Auth (avec la même clé de service)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'test-connection@example.com',
      password: 'test123',
      email_confirm: true
    });

    if (authError) {
      console.error('❌ Erreur création utilisateur Auth:', authError);
      return;
    }

    console.log('✅ Création utilisateur Auth réussie');
    console.log('User ID:', authData.user.id);

    // Nettoyer l'utilisateur de test
    await supabase.auth.admin.deleteUser(authData.user.id);
    console.log('🧹 Utilisateur de test supprimé');

    console.log('\n🎉 Tous les tests Supabase sont OK !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testSupabaseConnection(); 