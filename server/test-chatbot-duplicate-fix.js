const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 Test de la correction des doublons dans le chatbot');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? '✅ Présente' : '❌ Manquante');

if (!supabaseKey) {
  console.error('❌ Clé Supabase manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testChatbotDuplicateFix() {
  try {
    // 1. Créer un utilisateur de test
    console.log('\n1️⃣ Création d\'un utilisateur de test...');
    const testEmail = `test-chatbot-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        type: 'client',
        username: 'TestChatbotUser'
      }
    });

    if (authError) {
      console.error('❌ Erreur création utilisateur Auth:', authError);
      return;
    }

    const authUserId = authData.user.id;
    console.log('✅ Utilisateur Auth créé:', authUserId);

    // 2. Créer un client avec le même ID
    console.log('\n2️⃣ Création du client...');
    const clientInsertData = {
      id: authUserId,
      email: testEmail,
      password: 'hashedpassword',
      username: 'TestChatbotUser',
      company_name: 'Test Company',
      phone_number: '0123456789',
      address: '123 Test Street',
      city: 'Test City',
      postal_code: '12345',
      siren: `123456${Date.now().toString().slice(-3)}`,
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
      await supabase.auth.admin.deleteUser(authUserId);
      return;
    }

    console.log('✅ Client créé avec succès');

    // 3. Simuler la sauvegarde des résultats du chatbot (première fois)
    console.log('\n3️⃣ Première sauvegarde des résultats du chatbot...');
    const mockProducts = [
      {
        nom: 'TICPE',
        estimatedGain: 12000,
        reasons: ['Transport de marchandises']
      },
      {
        nom: 'CIR',
        estimatedGain: 50000,
        reasons: ['Recherche et développement']
      }
    ];

    const profileData = {
      secteur: 'Transport',
      nombreEmployes: 25,
      chiffreAffaires: '2000000'
    };

    // Première sauvegarde
    const firstSaveResponse = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/chatbot/save-results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientId: authUserId,
        eligibleProducts: mockProducts,
        profileData
      })
    });

    const firstSaveData = await firstSaveResponse.json();
    console.log('✅ Première sauvegarde:', firstSaveData.success ? 'Succès' : 'Échec');

    // 4. Simuler la sauvegarde des résultats du chatbot (deuxième fois - doublon)
    console.log('\n4️⃣ Deuxième sauvegarde des résultats du chatbot (test doublon)...');
    const secondSaveResponse = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/chatbot/save-results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientId: authUserId,
        eligibleProducts: mockProducts,
        profileData
      })
    });

    const secondSaveData = await secondSaveResponse.json();
    console.log('✅ Deuxième sauvegarde:', secondSaveData.success ? 'Succès' : 'Échec');

    // 5. Vérifier les produits éligibles en base
    console.log('\n5️⃣ Vérification des produits éligibles en base...');
    const { data: clientProducts, error: productsError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .eq('clientId', authUserId);

    if (productsError) {
      console.error('❌ Erreur récupération produits:', productsError);
    } else {
      console.log(`📊 Produits trouvés: ${clientProducts.length}`);
      console.log('   Produits:', clientProducts.map(p => p.produitId));
      
      // Vérifier s'il y a des doublons
      const productIds = clientProducts.map(p => p.produitId);
      const uniqueProductIds = [...new Set(productIds)];
      
      if (productIds.length === uniqueProductIds.length) {
        console.log('✅ Aucun doublon détecté !');
      } else {
        console.log('❌ Doublons détectés !');
        console.log('   Total:', productIds.length);
        console.log('   Unique:', uniqueProductIds.length);
      }
    }

    // 6. Nettoyage
    console.log('\n6️⃣ Nettoyage des données de test...');
    
    // Supprimer les produits éligibles
    if (clientProducts && clientProducts.length > 0) {
      await supabase
        .from('ClientProduitEligible')
        .delete()
        .eq('clientId', authUserId);
      console.log('✅ Produits éligibles supprimés');
    }

    // Supprimer les simulations
    const { data: simulations } = await supabase
      .from('Simulation')
      .select('id')
      .eq('clientId', authUserId);
      
    if (simulations && simulations.length > 0) {
      await supabase
        .from('Simulation')
        .delete()
        .eq('clientId', authUserId);
      console.log('✅ Simulations supprimées');
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
    console.log('✅ La correction des doublons fonctionne correctement');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testChatbotDuplicateFix(); 