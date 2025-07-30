import { supabaseClient } from '../config/supabase';

const supabase = supabaseClient;

async function debugClientIssue() {
  console.log('🔍 DEBUG: Analyse du problème de client');
  console.log('=' .repeat(50));

  const testClientId = '550e8400-e29b-41d4-a716-446655440000';
  const testEmail = 'test-migration@example.com';

  try {
    // 1. Vérifier l'authentification
    console.log('1️⃣ Test d\'authentification...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'test-password-123'
    });

    if (authError) {
      console.error('❌ Erreur authentification:', authError);
      return;
    }

    console.log('✅ Authentification réussie:', {
      user_id: authData.user?.id,
      email: authData.user?.email
    });

    // 2. Vérifier si le client existe par ID
    console.log('\n2️⃣ Vérification du client par ID...');
    const { data: clientById, error: errorById } = await supabase
      .from('Client')
      .select('*')
      .eq('id', testClientId)
      .single();

    if (errorById) {
      console.error('❌ Client non trouvé par ID:', errorById);
    } else {
      console.log('✅ Client trouvé par ID:', {
        id: clientById.id,
        email: clientById.email,
        name: clientById.name
      });
    }

    // 3. Vérifier si le client existe par email
    console.log('\n3️⃣ Vérification du client par email...');
    const { data: clientByEmail, error: errorByEmail } = await supabase
      .from('Client')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (errorByEmail) {
      console.error('❌ Client non trouvé par email:', errorByEmail);
    } else {
      console.log('✅ Client trouvé par email:', {
        id: clientByEmail.id,
        email: clientByEmail.email,
        name: clientByEmail.name
      });
    }

    // 4. Lister tous les clients pour debug
    console.log('\n4️⃣ Liste de tous les clients...');
    const { data: allClients, error: errorAll } = await supabase
      .from('Client')
      .select('id, email, name')
      .limit(10);

    if (errorAll) {
      console.error('❌ Erreur récupération clients:', errorAll);
    } else {
      console.log('📋 Clients dans la base:');
      allClients.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.email} (${client.id})`);
      });
    }

    // 5. Créer le client s'il n'existe pas
    console.log('\n5️⃣ Création du client de test...');
    const { data: newClient, error: createError } = await supabase
      .from('Client')
      .insert({
        id: testClientId,
        email: testEmail,
        name: 'Test Client Test Migration',
        company_name: 'Test Company',
        phone_number: '0123456789',
        password: 'test-password-hash',
        username: 'test-migration',
        address: '123 Test Street',
        city: 'Test City',
        postal_code: '75000',
        type: 'entreprise',
        statut: 'actif',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Erreur création client:', createError);
    } else {
      console.log('✅ Client créé avec succès:', {
        id: newClient.id,
        email: newClient.email,
        name: newClient.name
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  } finally {
    // Déconnexion
    await supabase.auth.signOut();
  }
}

// Exécuter le debug
debugClientIssue(); 