const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkClientTable() {
  try {
    console.log('🔍 Vérification de la structure de la table Client...');
    
    // Récupérer un client pour voir la structure
    const { data: clients, error } = await supabase
      .from('Client')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erreur lors de la récupération des clients:', error);
      return;
    }
    
    if (!clients || clients.length === 0) {
      console.log('⚠️ Aucun client trouvé dans la base');
      return;
    }
    
    const client = clients[0];
    console.log('✅ Table Client accessible');
    console.log('📋 Structure d\'un client:');
    
    // Afficher toutes les colonnes
    for (const [key, value] of Object.entries(client)) {
      const type = typeof value;
      const displayValue = value === null ? 'null' : 
                          typeof value === 'object' ? JSON.stringify(value).substring(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '') :
                          String(value);
      console.log(`  - ${key}: ${type} = ${displayValue}`);
    }
    
    // Vérifier spécifiquement les colonnes utilisées dans la requête
    const requiredColumns = [
      'id', 'email', 'company_name', 'phone_number', 'statut', 
      'created_at', 'derniereConnexion', 'siren', 'description', 'city'
    ];
    
    console.log('\n🔍 Vérification des colonnes requises:');
    for (const column of requiredColumns) {
      const exists = column in client;
      console.log(`  - ${column}: ${exists ? '✅' : '❌'} ${exists ? 'existe' : 'MANQUANT'}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

checkClientTable(); 