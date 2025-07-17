// Script pour tester directement la création de client
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTc2OTg0OSwiZXhwIjoyMDU3MzQ1ODQ5fQ.2hahkZasfMfdFhQvP7rvPHzO1DBCl0FfsRVkxVZfdgk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testClientCreation() {
  console.log('🧪 Test direct de création de client...\n');

  const now = new Date().toISOString();

  const testClientData = {
    email: 'test@profitum.fr',
    password: 'profitum',
    username: 'Test',
    company_name: 'profitum',
    phone_number: '0658072445',
    address: '134 av foch',
    city: 'St Maur des Fosses',
    postal_code: '94100',
    siren: '987654376',
    type: 'client',
    name: 'Test',
    statut: 'actif',
    derniereConnexion: now,
    dateCreation: now,
    updated_at: now,
    created_at: now,
    revenuAnnuel: 1000000,
    secteurActivite: 'Services',
    nombreEmployes: 10,
    ancienneteEntreprise: 5,
    typeProjet: 'Développement',
    dateSimulation: now,
    simulationId: null,
    chiffreAffaires: 1000000,
    metadata: {
      source: 'direct_test',
      test_date: now
    }
  };

  try {
    console.log('1️⃣ Création de l\'utilisateur Supabase Auth...');
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testClientData.email,
      password: testClientData.password,
      email_confirm: true,
      user_metadata: {
        username: testClientData.username,
        type: 'client',
        company_name: testClientData.company_name,
        siren: testClientData.siren,
        phone_number: testClientData.phone_number
      }
    });

    if (authError) {
      console.error('❌ Erreur création utilisateur Auth:', authError);
      return;
    }

    const authUserId = authData.user.id;
    console.log('✅ Utilisateur Auth créé:', authUserId);

    console.log('\n2️⃣ Hash du mot de passe...');
    const hashedPassword = await bcrypt.hash(testClientData.password, 10);
    console.log('✅ Mot de passe hashé');

    console.log('\n3️⃣ Création du client dans la table Client...');
    
    const clientInsertData = {
      auth_id: authUserId,
      email: testClientData.email,
      password: hashedPassword,
      name: testClientData.name,
      company_name: testClientData.company_name,
      phone_number: testClientData.phone_number,
      address: testClientData.address,
      city: testClientData.city,
      postal_code: testClientData.postal_code,
      siren: testClientData.siren,
      type: testClientData.type,
      statut: testClientData.statut,
      derniereConnexion: testClientData.derniereConnexion,
      dateCreation: testClientData.dateCreation,
      updated_at: testClientData.updated_at,
      created_at: testClientData.created_at,
      revenuAnnuel: testClientData.revenuAnnuel,
      secteurActivite: testClientData.secteurActivite,
      nombreEmployes: testClientData.nombreEmployes,
      ancienneteEntreprise: testClientData.ancienneteEntreprise,
      typeProjet: testClientData.typeProjet,
      dateSimulation: testClientData.dateSimulation,
      simulationId: testClientData.simulationId,
      chiffreAffaires: testClientData.chiffreAffaires,
      metadata: testClientData.metadata
    };

    console.log('📤 Données à insérer:', JSON.stringify({
      ...clientInsertData,
      password: '[HASHED]'
    }, null, 2));

    const { data: clientDataResult, error: clientError } = await supabase
      .from('Client')
      .insert(clientInsertData)
      .select('id')
      .single();

    if (clientError) {
      console.error('❌ Erreur création client:', clientError);
      console.error('Code:', clientError.code);
      console.error('Message:', clientError.message);
      console.error('Details:', clientError.details);
      console.error('Hint:', clientError.hint);
      
      // Nettoyer l'utilisateur Auth
      await supabase.auth.admin.deleteUser(authUserId);
      return;
    }

    console.log('✅ Client créé avec succès:', clientDataResult.id);

    // Test de connexion
    console.log('\n4️⃣ Test de connexion...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testClientData.email,
      password: testClientData.password
    });

    if (loginError) {
      console.error('❌ Erreur de connexion:', loginError);
    } else {
      console.log('✅ Connexion réussie !');
      console.log('   Token:', loginData.session.access_token.substring(0, 20) + '...');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testClientCreation(); 