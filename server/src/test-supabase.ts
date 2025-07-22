import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  }
});

async function testSupabaseConnection() {
  try {
    console.log('Test de connexion à Supabase...');
    
    // Test de la table Client
    const { data: clients, error: clientError } = await supabase
      .from('Client')
      .select('*')
      .limit(5);

    if (clientError) {
      console.error('Erreur lors de la requête Client:', clientError);
    } else {
      console.log('Clients trouvés:', clients);
    }

    // Test de la table Audit
    const { data: audits, error: auditError } = await supabase
      .from('Audit')
      .select('*, Client(*)')
      .limit(5);

    if (auditError) {
      console.error('Erreur lors de la requête Audit:', auditError);
    } else {
      console.log('Audits trouvés:', audits);
    }

  } catch (error) {
    console.error('Erreur lors du test de connexion:', error);
  }
}

testSupabaseConnection(); 