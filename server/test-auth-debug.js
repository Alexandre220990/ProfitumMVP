const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Token client fourni
const CLIENT_TOKEN = '0538de29-4287-4c28-b76a-b65ef993f393';

async function testAuthAndRoutes() {
  console.log('🔍 Test d\'authentification et des routes API\n');

  // 1. Vérifier les variables d'environnement
  console.log('1️⃣ Vérification des variables d\'environnement...');
  console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ Défini' : '❌ Manquant'}`);
  console.log(`   SUPABASE_ANON_KEY: ${supabaseKey ? '✅ Défini' : '❌ Manquant'}`);
  console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Défini' : '❌ Manquant'}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Défini' : '❌ Manquant'}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Défini' : '❌ Manquant'}`);

  // 2. Tester l'authentification avec le token client
  console.log('\n2️⃣ Test d\'authentification avec le token client...');
  try {
    const { data: { user }, error } = await supabase.auth.getUser(CLIENT_TOKEN);
    
    if (error) {
      console.log(`   ❌ Erreur d'authentification: ${error.message}`);
      console.log(`   Code d'erreur: ${error.status}`);
    } else if (user) {
      console.log(`   ✅ Utilisateur authentifié: ${user.email}`);
      console.log(`   ID utilisateur: ${user.id}`);
      console.log(`   Créé le: ${user.created_at}`);
      console.log(`   Dernière connexion: ${user.last_sign_in_at}`);
    } else {
      console.log('   ⚠️ Aucun utilisateur trouvé');
    }
  } catch (error) {
    console.log(`   ❌ Erreur lors de la vérification du token: ${error.message}`);
  }

  // 3. Vérifier la structure de la base de données
  console.log('\n3️⃣ Vérification de la structure de la base de données...');
  
  try {
    // Vérifier la table Client
    const { data: clients, error: clientsError } = await supabase
      .from('Client')
      .select('*')
      .limit(5);

    if (clientsError) {
      console.log(`   ❌ Erreur table Client: ${clientsError.message}`);
    } else {
      console.log(`   ✅ Table Client accessible: ${clients.length} clients trouvés`);
      if (clients.length > 0) {
        console.log(`   Exemple de client: ${clients[0].id} - ${clients[0].email || 'Pas d\'email'}`);
      }
    }

    // Vérifier la table ProduitEligible
    const { data: produits, error: produitsError } = await supabase
      .from('ProduitEligible')
      .select('*')
      .limit(3);

    if (produitsError) {
      console.log(`   ❌ Erreur table ProduitEligible: ${produitsError.message}`);
    } else {
      console.log(`   ✅ Table ProduitEligible accessible: ${produits.length} produits trouvés`);
    }

    // Vérifier la table ClientProduitEligible
    const { data: clientProduits, error: clientProduitsError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .limit(3);

    if (clientProduitsError) {
      console.log(`   ❌ Erreur table ClientProduitEligible: ${clientProduitsError.message}`);
    } else {
      console.log(`   ✅ Table ClientProduitEligible accessible: ${clientProduits.length} entrées trouvées`);
      if (clientProduits.length > 0) {
        console.log(`   Structure d'une entrée:`, Object.keys(clientProduits[0]));
      }
    }

  } catch (error) {
    console.log(`   ❌ Erreur générale de base de données: ${error.message}`);
  }

  // 4. Tester les routes API avec le token
  console.log('\n4️⃣ Test des routes API avec authentification...');
  
  const API_BASE = 'http://localhost:3001/api'; // Ajuster selon ton port
  
  const routesToTest = [
    '/auth/check',
    '/produits-eligibles/client/0538de29-4287-4c28-b76a-b65ef993f393',
    '/simulations/check-recent/0538de29-4287-4c28-b76a-b65ef993f393'
  ];

  for (const route of routesToTest) {
    try {
      console.log(`   🔄 Test de ${route}...`);
      
      const response = await fetch(`${API_BASE}${route}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CLIENT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Succès: ${data.success ? 'Oui' : 'Non'}`);
        if (data.message) {
          console.log(`   Message: ${data.message}`);
        }
      } else {
        const errorData = await response.text();
        console.log(`   ❌ Erreur: ${errorData.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erreur réseau: ${error.message}`);
    }
    
    console.log(''); // Ligne vide pour la lisibilité
  }

  // 5. Vérifier les contraintes de clé étrangère
  console.log('5️⃣ Vérification des contraintes de clé étrangère...');
  
  try {
    // Vérifier si le client existe
    const { data: clientExists, error: clientCheckError } = await supabase
      .from('Client')
      .select('id')
      .eq('id', CLIENT_TOKEN)
      .single();

    if (clientCheckError) {
      console.log(`   ❌ Client ${CLIENT_TOKEN} non trouvé dans la table Client`);
      console.log(`   Erreur: ${clientCheckError.message}`);
    } else {
      console.log(`   ✅ Client ${CLIENT_TOKEN} existe dans la table Client`);
    }

  } catch (error) {
    console.log(`   ❌ Erreur lors de la vérification du client: ${error.message}`);
  }

  console.log('\n✅ Test terminé !');
}

// Exécuter le test
testAuthAndRoutes(); 