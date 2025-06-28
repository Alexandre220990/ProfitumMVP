const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase avec service key
const supabaseUrl = 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTc2OTg0OSwiZXhwIjoyMDU3MzQ1ODQ5fQ.pN73GQUJHmd099PUcxAVGm-TFTe3KHeBemBk9IlGAcg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function compareUserTables() {
  try {
    console.log('🔍 Comparaison des tables authenticated_users et Client\n');

    // 1. Récupérer tous les utilisateurs authentifiés
    console.log('1️⃣ Récupération des utilisateurs authentifiés...');
    const { data: authUsers, error: authError } = await supabase
      .from('authenticated_users')
      .select('*');

    if (authError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs authentifiés:', authError.message);
      return;
    }

    console.log(`   ✅ ${authUsers.length} utilisateurs authentifiés trouvés`);

    // 2. Récupérer tous les clients
    console.log('\n2️⃣ Récupération des clients...');
    const { data: clients, error: clientError } = await supabase
      .from('Client')
      .select('*');

    if (clientError) {
      console.error('❌ Erreur lors de la récupération des clients:', clientError.message);
      return;
    }

    console.log(`   ✅ ${clients.length} clients trouvés`);

    // 3. Analyser les correspondances
    console.log('\n3️⃣ Analyse des correspondances...\n');

    console.log('📊 UTILISATEURS AUTHENTIFIÉS:');
    console.log('─'.repeat(80));
    authUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Type: ${user.user_type}`);
      console.log(`   Créé le: ${user.created_at}`);
      console.log(`   Profile ID: ${user.profile_id}`);
      console.log('');
    });

    console.log('📊 CLIENTS:');
    console.log('─'.repeat(80));
    clients.forEach((client, index) => {
      console.log(`${index + 1}. ID Client: ${client.id}`);
      console.log(`   Email: ${client.email}`);
      console.log(`   Auth ID: ${client.auth_id}`);
      console.log(`   Type: ${client.type}`);
      console.log(`   Nom: ${client.name}`);
      console.log(`   Entreprise: ${client.company_name}`);
      console.log(`   Créé le: ${client.created_at}`);
      console.log('');
    });

    // 4. Vérifier les correspondances auth_id
    console.log('🔗 CORRESPONDANCES AUTH_ID:');
    console.log('─'.repeat(80));
    
    let matches = 0;
    let mismatches = 0;

    clients.forEach(client => {
      if (client.auth_id) {
        const matchingAuthUser = authUsers.find(auth => auth.id === client.auth_id);
        if (matchingAuthUser) {
          matches++;
          console.log(`✅ Client "${client.name}" (${client.email})`);
          console.log(`   → Correspond à l'utilisateur auth: ${matchingAuthUser.email}`);
          console.log(`   → Auth ID: ${client.auth_id}`);
          console.log('');
        } else {
          mismatches++;
          console.log(`❌ Client "${client.name}" (${client.email})`);
          console.log(`   → Auth ID ${client.auth_id} ne correspond à aucun utilisateur authentifié`);
          console.log('');
        }
      } else {
        console.log(`⚠️ Client "${client.name}" (${client.email})`);
        console.log(`   → Pas d'auth_id défini`);
        console.log('');
      }
    });

    console.log('📈 RÉSUMÉ:');
    console.log('─'.repeat(80));
    console.log(`Total utilisateurs authentifiés: ${authUsers.length}`);
    console.log(`Total clients: ${clients.length}`);
    console.log(`Correspondances trouvées: ${matches}`);
    console.log(`Correspondances manquantes: ${mismatches}`);
    console.log(`Clients sans auth_id: ${clients.filter(c => !c.auth_id).length}`);

    // 5. Suggestions de correction
    if (mismatches > 0 || clients.some(c => !c.auth_id)) {
      console.log('\n🔧 SUGGESTIONS DE CORRECTION:');
      console.log('─'.repeat(80));
      
      // Clients sans auth_id
      const clientsWithoutAuthId = clients.filter(c => !c.auth_id);
      if (clientsWithoutAuthId.length > 0) {
        console.log('\nClients sans auth_id - correspondance par email:');
        clientsWithoutAuthId.forEach(client => {
          const matchingAuthUser = authUsers.find(auth => auth.email === client.email);
          if (matchingAuthUser) {
            console.log(`UPDATE "Client" SET auth_id = '${matchingAuthUser.id}' WHERE id = '${client.id}';`);
          } else {
            console.log(`⚠️ Aucun utilisateur auth trouvé pour ${client.email}`);
          }
        });
      }

      // Auth IDs qui ne correspondent pas
      const invalidAuthIds = clients.filter(client => 
        client.auth_id && !authUsers.find(auth => auth.id === client.auth_id)
      );
      
      if (invalidAuthIds.length > 0) {
        console.log('\nAuth IDs invalides - correction par email:');
        invalidAuthIds.forEach(client => {
          const matchingAuthUser = authUsers.find(auth => auth.email === client.email);
          if (matchingAuthUser) {
            console.log(`UPDATE "Client" SET auth_id = '${matchingAuthUser.id}' WHERE id = '${client.id}';`);
          } else {
            console.log(`⚠️ Aucun utilisateur auth trouvé pour ${client.email}`);
          }
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors de la comparaison:', error.message);
  }
}

compareUserTables(); 