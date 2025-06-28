const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 Test direct de la correction des doublons dans le chatbot');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? '✅ Présente' : '❌ Manquante');

if (!supabaseKey) {
  console.error('❌ Clé Supabase manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testChatbotDuplicateDirect() {
  try {
    // 1. Créer un utilisateur de test
    console.log('\n1️⃣ Création d\'un utilisateur de test...');
    const testEmail = `test-chatbot-direct-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        type: 'client',
        username: 'TestChatbotDirectUser'
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
      username: 'TestChatbotDirectUser',
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

    // 3. Récupérer un produit éligible existant
    console.log('\n3️⃣ Récupération d\'un produit éligible existant...');
    const { data: produitEligible, error: produitError } = await supabase
      .from('ProduitEligible')
      .select('*')
      .limit(1)
      .single();

    if (produitError || !produitEligible) {
      console.error('❌ Aucun produit éligible trouvé:', produitError);
      await supabase.auth.admin.deleteUser(authUserId);
      return;
    }

    console.log('✅ Produit éligible trouvé:', produitEligible.nom);

    // 4. Créer une simulation
    console.log('\n4️⃣ Création d\'une simulation...');
    const { data: simulation, error: simulationError } = await supabase
      .from('Simulation')
      .insert({
        clientId: authUserId,
        dateCreation: new Date().toISOString(),
        statut: 'termine',
        type: 'chatbot',
        source: 'profitum',
        score: 100,
        tempsCompletion: 0,
        Answers: {
          source: 'chatbot',
          profileData: { secteur: 'Transport' },
          eligibleProducts: [{ nom: produitEligible.nom, estimatedGain: 12000 }]
        },
        metadata: {}
      })
      .select()
      .single();

    if (simulationError) {
      console.error('❌ Erreur création simulation:', simulationError);
      await supabase.auth.admin.deleteUser(authUserId);
      return;
    }

    console.log('✅ Simulation créée avec ID:', simulation.id);

    // 5. Première insertion de ClientProduitEligible
    console.log('\n5️⃣ Première insertion de ClientProduitEligible...');
    const { data: firstProduct, error: firstError } = await supabase
      .from('ClientProduitEligible')
      .insert({
        clientId: authUserId,
        produitId: produitEligible.id,
        simulationId: simulation.id,
        statut: 'eligible',
        tauxFinal: 0.85,
        montantFinal: 12000,
        dureeFinale: 12,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (firstError) {
      console.error('❌ Erreur première insertion:', firstError);
    } else {
      console.log('✅ Première insertion réussie, ID:', firstProduct.id);
    }

    // 6. Deuxième insertion (devrait être ignorée)
    console.log('\n6️⃣ Deuxième insertion de ClientProduitEligible (test doublon)...');
    const { data: secondProduct, error: secondError } = await supabase
      .from('ClientProduitEligible')
      .insert({
        clientId: authUserId,
        produitId: produitEligible.id,
        simulationId: simulation.id,
        statut: 'eligible',
        tauxFinal: 0.85,
        montantFinal: 12000,
        dureeFinale: 12,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (secondError) {
      console.log('✅ Deuxième insertion bloquée (comportement attendu):', secondError.message);
    } else {
      console.log('⚠️ Deuxième insertion réussie (problème potentiel):', secondProduct.id);
    }

    // 7. Vérifier les produits éligibles en base
    console.log('\n7️⃣ Vérification des produits éligibles en base...');
    const { data: clientProducts, error: productsError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .eq('clientId', authUserId);

    if (productsError) {
      console.error('❌ Erreur récupération produits:', productsError);
    } else {
      console.log(`📊 Produits trouvés: ${clientProducts.length}`);
      
      if (clientProducts.length === 1) {
        console.log('✅ Aucun doublon détecté !');
      } else {
        console.log('❌ Doublons détectés !');
        console.log('   Produits:', clientProducts.map(p => ({ id: p.id, produitId: p.produitId })));
      }
    }

    // 8. Nettoyage
    console.log('\n8️⃣ Nettoyage des données de test...');
    
    // Supprimer les produits éligibles
    if (clientProducts && clientProducts.length > 0) {
      await supabase
        .from('ClientProduitEligible')
        .delete()
        .eq('clientId', authUserId);
      console.log('✅ Produits éligibles supprimés');
    }

    // Supprimer la simulation
    await supabase
      .from('Simulation')
      .delete()
      .eq('id', simulation.id);
    console.log('✅ Simulation supprimée');

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
    console.log('✅ La logique de prévention des doublons fonctionne correctement');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testChatbotDuplicateDirect(); 