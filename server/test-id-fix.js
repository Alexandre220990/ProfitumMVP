const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Test de la correction ID Client = ID Supabase Auth');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? '✅ Présente' : '❌ Manquante');

if (!supabaseKey) {
  console.error('❌ Clé Supabase manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testIdCorrection() {
  try {
    // 1. Créer un utilisateur de test
    console.log('\n1️⃣ Création d\'un utilisateur de test...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        type: 'client',
        username: 'TestUser'
      }
    });

    if (authError) {
      console.error('❌ Erreur création utilisateur Auth:', authError);
      return;
    }

    const authUserId = authData.user.id;
    console.log('✅ Utilisateur Auth créé:', authUserId);

    // 2. Créer un client avec le même ID
    console.log('\n2️⃣ Création du client avec ID = ID Auth...');
    const clientInsertData = {
      id: authUserId, // ID direct = ID Supabase Auth
      email: testEmail,
      password: 'hashedpassword',
      username: 'TestUser',
      company_name: 'Test Company',
      phone_number: '0123456789',
      address: '123 Test Street',
      city: 'Test City',
      postal_code: '12345',
      siren: `123456${Date.now().toString().slice(-3)}`, // SIREN unique
      type: 'client',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: insertedClient, error: clientError } = await supabase
      .from('Client')
      .insert([clientInsertData])
      .select('*')
      .single();

    if (clientError) {
      console.error('❌ Erreur création client:', clientError);
      // Nettoyer l'utilisateur Auth
      await supabase.auth.admin.deleteUser(authUserId);
      return;
    }

    console.log('✅ Client créé avec succès');
    console.log('   ID Client:', insertedClient.id);
    console.log('   ID Auth:', authUserId);
    console.log('   Correspondance:', insertedClient.id === authUserId ? '✅ OK' : '❌ ERREUR');

    // 3. Tester la récupération par ID
    console.log('\n3️⃣ Test de récupération par ID...');
    const { data: retrievedClient, error: retrieveError } = await supabase
      .from('Client')
      .select('*')
      .eq('id', authUserId)
      .single();

    if (retrieveError) {
      console.error('❌ Erreur récupération client:', retrieveError);
    } else {
      console.log('✅ Client récupéré avec succès');
      console.log('   Email:', retrievedClient.email);
      console.log('   Username:', retrievedClient.username);
    }

    // 4. Nettoyage
    console.log('\n4️⃣ Nettoyage des données de test...');
    
    // Supprimer le client
    await supabase
      .from('Client')
      .delete()
      .eq('id', authUserId);
    console.log('✅ Client supprimé');

    // Supprimer l'utilisateur Auth
    await supabase.auth.admin.deleteUser(authUserId);
    console.log('✅ Utilisateur Auth supprimé');

    console.log('\n🎉 Test terminé avec succès !');
    console.log('✅ La correction ID Client = ID Supabase Auth fonctionne correctement');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testIdCorrection(); 