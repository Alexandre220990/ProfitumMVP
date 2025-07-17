const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Vérification de la base de données...\n');

  try {
    // 1. Vérifier la connexion
    console.log('1️⃣ Test de connexion Supabase:');
    const { data, error } = await supabase.from('Client').select('count').limit(1);
    if (error) {
      console.log('❌ Erreur de connexion:', error.message);
      return;
    }
    console.log('✅ Connexion Supabase réussie');

    // 2. Lister toutes les tables
    console.log('\n2️⃣ Tables disponibles:');
    const tables = [
      'Client', 'Expert', 'Admin', 'ProduitEligible', 'ClientProduitEligible',
      'audit_logs', 'access_logs', 'security_incidents'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: accessible`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }

    // 3. Vérifier les tables de documentation
    console.log('\n3️⃣ Tables de documentation:');
    const docTables = ['documentation', 'documentation_categories', 'documentation_items'];
    
    for (const table of docTables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: accessible (${data.length} entrées)`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }

    // 4. Vérifier les utilisateurs admin
    console.log('\n4️⃣ Utilisateurs admin:');
    try {
      const { data: admins, error } = await supabase
        .from('Admin')
        .select('*')
        .eq('email', 'grandjean.alexandre5@gmail.com');
      
      if (error) {
        console.log('❌ Erreur Admin:', error.message);
      } else if (admins && admins.length > 0) {
        console.log('✅ Admin trouvé:', admins[0].email);
      } else {
        console.log('⚠️ Admin non trouvé dans la table Admin');
      }
    } catch (err) {
      console.log('❌ Erreur vérification admin:', err.message);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

checkDatabase(); 