// Script de diagnostic pour le problème de migration
require('dotenv').config({ path: '../.env' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseMigrationIssue() {
  console.log('🔍 DIAGNOSTIC DU PROBLÈME DE MIGRATION');
  console.log('='.repeat(50));

  try {
    // 1. Vérifier la structure de la table ClientProduitEligible
    console.log('\n1️⃣ Structure de la table ClientProduitEligible...');
    
    const { data: structureData, error: structureError } = await supabase
      .rpc('get_table_structure', { table_name: 'ClientProduitEligible' });
    
    if (structureError) {
      console.log('⚠️ Impossible de récupérer la structure via RPC, tentative directe...');
      
      // Tentative directe
      const { data: sampleData, error: sampleError } = await supabase
        .from('ClientProduitEligible')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('❌ Erreur accès table:', sampleError);
      } else {
        console.log('✅ Structure détectée:', Object.keys(sampleData?.[0] || {}));
      }
    } else {
      console.log('✅ Structure récupérée:', structureData);
    }

    // 2. Créer un client de test
    console.log('\n2️⃣ Création d\'un client de test...');
    
    const timestamp = Date.now();
    const testClientData = {
      email: `diagnostic-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Client Diagnostic',
      company_name: 'Entreprise Diagnostic',
      phone_number: '0123456789',
      address: '123 Rue Diagnostic',
      city: 'Paris',
      postal_code: '75001',
      siren: String(Math.floor(100000000 + Math.random() * 900000000)),
      type: 'client',
      statut: 'actif',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: client, error: clientError } = await supabase
      .from('Client')
      .insert(testClientData)
      .select()
      .single();

    if (clientError) {
      throw new Error(`Erreur création client: ${clientError.message}`);
    }

    console.log('✅ Client créé:', client.email);
    console.log('   ID:', client.id);
    console.log('   Type ID:', typeof client.id);

    // 3. Vérifier que le client existe bien
    console.log('\n3️⃣ Vérification de l\'existence du client...');
    
    const { data: clientCheck, error: clientCheckError } = await supabase
      .from('Client')
      .select('id, email')
      .eq('id', client.id)
      .eq('email', client.email)
      .single();

    if (clientCheckError || !clientCheck) {
      console.error('❌ Client non trouvé lors de la vérification:', clientCheckError);
    } else {
      console.log('✅ Client vérifié avec succès:', clientCheck);
    }

    // 4. Test d'insertion directe dans ClientProduitEligible
    console.log('\n4️⃣ Test d\'insertion directe...');
    
    // Récupérer un produit éligible existant
    const { data: produits, error: produitsError } = await supabase
      .from('ProduitEligible')
      .select('id, nom')
      .limit(1);

    if (produitsError || !produits || produits.length === 0) {
      console.error('❌ Aucun produit éligible trouvé:', produitsError);
      return;
    }

    const produitId = produits[0].id;
    console.log('✅ Produit sélectionné:', produits[0].nom, '(', produitId, ')');

    // Test d'insertion directe
    const testInsertData = {
      clientId: client.id,
      produitId: produitId,
      statut: 'eligible',
      tauxFinal: 0.85,
      montantFinal: 5000,
      dureeFinale: 12,
      simulationId: null,
      metadata: {
        test: true,
        diagnostic: true
      },
      notes: 'Test diagnostic',
      priorite: 1,
      dateEligibilite: new Date().toISOString(),
      current_step: 0,
      progress: 0,
      expert_id: null,
      charte_signed: false,
      charte_signed_at: null
    };

    console.log('📤 Données à insérer:', JSON.stringify(testInsertData, null, 2));

    const { data: insertedData, error: insertError } = await supabase
      .from('ClientProduitEligible')
      .insert(testInsertData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erreur insertion directe:', insertError);
      console.error('❌ Détails de l\'erreur:', JSON.stringify(insertError, null, 2));
    } else {
      console.log('✅ Insertion directe réussie:', insertedData);
    }

    // 5. Nettoyage
    console.log('\n5️⃣ Nettoyage...');
    
    if (insertedData) {
      const { error: deleteError } = await supabase
        .from('ClientProduitEligible')
        .delete()
        .eq('id', insertedData.id);
      
      if (deleteError) {
        console.error('⚠️ Erreur suppression test:', deleteError);
      } else {
        console.log('✅ Données de test supprimées');
      }
    }

    const { error: deleteClientError } = await supabase
      .from('Client')
      .delete()
      .eq('id', client.id);
    
    if (deleteClientError) {
      console.error('⚠️ Erreur suppression client:', deleteClientError);
    } else {
      console.log('✅ Client de test supprimé');
    }

  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
  }
}

diagnoseMigrationIssue(); 