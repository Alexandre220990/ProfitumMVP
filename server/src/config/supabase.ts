import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseAnonKey) {
  throw new Error('Configuration Supabase manquante: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY et SUPABASE_KEY sont requis');
}

// Configuration HTTPS
const httpsAgent = new https.Agent({
  rejectUnauthorized: true,
  keepAlive: true,
  timeout: 60000
});

// Client Supabase avec clé service role pour les opérations admin
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-admin',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    fetch: (input, init) => {
      const fetchOptions = {
        ...init,
        headers: {
          ...init?.headers,
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      };
      // @ts-ignore
      fetchOptions.agent = httpsAgent;
      return fetch(input, fetchOptions);
    }
  }
});

// Client Supabase avec clé anonyme pour les opérations client
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-client',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    fetch: (input, init) => {
      const fetchOptions = {
        ...init,
        headers: {
          ...init?.headers,
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      };
      // @ts-ignore
      fetchOptions.agent = httpsAgent;
      return fetch(input, fetchOptions);
    }
  }
});

// Tester la connexion
const testConnection = async () => {
  try {
    console.log('Tentative de connexion à Supabase...');
    const { data, error } = await supabaseAdmin.from('Client').select('count').single();
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Connexion à Supabase réussie');
  } catch (err) {
    console.error('❌ Erreur de connexion à Supabase:', err);
    throw err;
  }
};

// Exécuter le test de connexion au démarrage
testConnection();

export { supabaseAdmin, supabaseClient };
export default supabaseAdmin; 