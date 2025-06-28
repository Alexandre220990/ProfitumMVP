import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import dotenv from 'dotenv';
import path from 'path';

// Charger les variables d'environnement avec le chemin absolu
const envPath = path.resolve(__dirname, '../../.env');
console.log('🔍 Chemin du fichier .env:', envPath);
dotenv.config({ path: envPath });

// Debug des variables d'environnement
console.log('🔍 Variables d\'environnement :', {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '...' + process.env.SUPABASE_SERVICE_ROLE_KEY.slice(-4) : 'non définie',
  NODE_ENV: process.env.NODE_ENV
});

// Vérification des variables d'environnement
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variables d\'environnement Supabase manquantes');
}

// Afficher la configuration pour debug
console.log('Configuration Supabase :');
console.log(`- URL: ${supabaseUrl}`);
console.log(`- Key: ${supabaseKey.substring(0, 20)}...`);

// Options Supabase avec configuration explicite
const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  }
});

// Test de connectivité à Supabase avec retry et debug des headers
const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔍 Test de connexion à Supabase (tentative ${i + 1}/${retries})...`);
      
      // Debug des headers de la requête
      const request = supabase
        .from('Client')
        .select('*')
        .limit(1);
      
      console.log('🔍 Headers de la requête:', {
        'apikey': supabaseKey.substring(0, 20) + '...',
        'Authorization': `Bearer ${supabaseKey.substring(0, 20)}...`
      });

      const { data, error } = await request.maybeSingle();

      if (error) {
        console.error('❌ Erreur de connexion à Supabase :', error);
        if (i < retries - 1) {
          console.log('🔄 Nouvelle tentative dans 2 secondes...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
      } else {
        console.log('✅ Test de connexion à Supabase réussi');
        return;
      }
    } catch (err) {
      console.error('❌ Erreur inattendue lors du test de connexion Supabase :', err);
      if (i < retries - 1) {
        console.log('🔄 Nouvelle tentative dans 2 secondes...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
    }
  }
};

export { supabase };

console.log('✅ Supabase client initialisé avec succès');

// Exécuter le test
testConnection();
