import { supabaseClient } from '../config/supabase';

const supabase = supabaseClient;

async function debugMigrationIssue() {
  console.log('🔍 DEBUG: Analyse du problème de migration');
  console.log('=' .repeat(50));

  const testClientId = '550e8400-e29b-41d4-a716-446655440000';
  const testEmail = 'test-migration@example.com';

  try {
    // 1. Vérifier si le client existe
    console.log('1️⃣ Vérification du client...');
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('*')
      .eq('id', testClientId)
      .single();

    if (clientError) {
      console.error('❌ Client non trouvé:', clientError);
    } else {
      console.log('✅ Client trouvé:', {
        id: client.id,
        email: client.email,
        name: client.name
      });
    }

    // 2. Vérifier l'authentification
    console.log('\n2️⃣ Test d\'authentification...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'test-password-123'
    });

    if (authError) {
      console.error('❌ Erreur authentification:', authError);
    } else {
      console.log('✅ Authentification réussie:', {
        user_id: authData.user?.id,
        email: authData.user?.email
      });
    }

    // 3. Tester l'endpoint de migration avec debug
    console.log('\n3️⃣ Test de l\'endpoint de migration...');
    if (authData.session?.access_token) {
      const response = await fetch('https://profitummvp-production.up.railway.app/api/simple-migration/migrate-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.session.access_token}`
        },
        body: JSON.stringify({
          clientId: testClientId,
          email: testEmail,
          simulationResults: {
            timestamp: Date.now(),
            products: [
              {
                code: 'TICPE',
                score: 85,
                savings: 15000,
                confidence: 'high'
              }
            ]
          }
        })
      });

      const result = await response.json();
      console.log('📊 Réponse de l\'endpoint:', JSON.stringify(result, null, 2));
    }

    // 4. Vérifier le mapping des produits
    console.log('\n4️⃣ Vérification du mapping...');
    const { data: produits, error: produitsError } = await supabase
      .from('ProduitEligible')
      .select('id, nom, categorie')
      .order('nom');

    if (produitsError) {
      console.error('❌ Erreur récupération produits:', produitsError);
    } else {
      console.log('📋 Produits disponibles:');
      produits.forEach(p => {
        console.log(`   - ${p.nom} (${p.id})`);
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
debugMigrationIssue(); 