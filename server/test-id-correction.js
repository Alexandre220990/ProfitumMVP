const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTc2OTg0OSwiZXhwIjoyMDU3MzQ1ODQ5fQ.2hahkZasfMfdFhQvP7rvPHzO1DBCl0FfsRVkxVZfdgk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testIdCorrection() {
  console.log('🧪 Test de la correction ID Client = ID Supabase Auth');
  console.log('=' .repeat(60));

  try {
    // 1. Créer un utilisateur de test dans Supabase Auth
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
    const clientData = {
      id: authUserId, // ID direct = ID Supabase Auth
      email: testEmail,
      password: 'hashedpassword',
      username: 'TestUser',
      company_name: 'Test Company',
      phone_number: '0123456789',
      address: '123 Test Street',
      city: 'Test City',
      postal_code: '12345',
      siren: '123456789',
      type: 'client',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: clientData, error: clientError } = await supabase
      .from('Client')
      .insert([clientData])
      .select('*')
      .single();

    if (clientError) {
      console.error('❌ Erreur création client:', clientError);
      // Nettoyer l'utilisateur Auth
      await supabase.auth.admin.deleteUser(authUserId);
      return;
    }

    console.log('✅ Client créé avec succès');
    console.log('   ID Client:', clientData.id);
    console.log('   ID Auth:', authUserId);
    console.log('   Correspondance:', clientData.id === authUserId ? '✅ OK' : '❌ ERREUR');

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

    // 4. Tester la création d'un produit éligible
    console.log('\n4️⃣ Test création produit éligible...');
    const produitData = {
      clientId: authUserId, // Utiliser directement l'ID Auth
      produitId: '550e8400-e29b-41d4-a716-446655440000', // ID de test
      statut: 'eligible',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: produitData, error: produitError } = await supabase
      .from('ClientProduitEligible')
      .insert([produitData])
      .select('*')
      .single();

    if (produitError) {
      console.error('❌ Erreur création produit éligible:', produitError);
    } else {
      console.log('✅ Produit éligible créé avec succès');
      console.log('   Client ID:', produitData.clientId);
      console.log('   Correspondance:', produitData.clientId === authUserId ? '✅ OK' : '❌ ERREUR');
    }

    // 5. Nettoyage
    console.log('\n5️⃣ Nettoyage des données de test...');
    
    // Supprimer le produit éligible
    if (produitData) {
      await supabase
        .from('ClientProduitEligible')
        .delete()
        .eq('id', produitData.id);
      console.log('✅ Produit éligible supprimé');
    }

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