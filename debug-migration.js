// Script de debug pour vérifier les données de migration
require('dotenv').config({ path: '../.env' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMigration() {
  console.log('🔍 DEBUG MIGRATION');
  console.log('='.repeat(40));

  try {
    // 1. Vérifier les sessions récentes
    console.log('\n1️⃣ Sessions récentes...');
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('TemporarySession')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (sessionsError) {
      console.error('❌ Erreur sessions:', sessionsError);
      return;
    }

    console.log(`✅ ${sessions?.length || 0} sessions trouvées`);
    
    if (sessions && sessions.length > 0) {
      sessions.forEach((session, index) => {
        console.log(`   ${index + 1}. ID: ${session.id}, Token: ${session.session_token}, Migré: ${session.migrated_to_account}`);
      });
    }

    // 2. Vérifier les éligibilités pour la dernière session
    if (sessions && sessions.length > 0) {
      const lastSession = sessions[0];
      console.log(`\n2️⃣ Éligibilités pour la session ${lastSession.session_token}...`);
      
      const { data: eligibilities, error: eligibilitiesError } = await supabase
        .from('TemporaryEligibility')
        .select('*')
        .eq('session_id', lastSession.id);

      if (eligibilitiesError) {
        console.error('❌ Erreur éligibilités:', eligibilitiesError);
        return;
      }

      console.log(`✅ ${eligibilities?.length || 0} éligibilités trouvées`);
      
      if (eligibilities && eligibilities.length > 0) {
        eligibilities.forEach((elig, index) => {
          console.log(`   ${index + 1}. Produit: ${elig.produit_id}, Score: ${elig.eligibility_score}%, Économies: ${elig.estimated_savings}€`);
        });
      } else {
        console.log('   ⚠️ Aucune éligibilité trouvée');
      }
    }

    // 3. Vérifier les clients récents
    console.log('\n3️⃣ Clients récents...');
    
    const { data: clients, error: clientsError } = await supabase
      .from('Client')
      .select('id, email, name, company_name, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    if (clientsError) {
      console.error('❌ Erreur clients:', clientsError);
      return;
    }

    console.log(`✅ ${clients?.length || 0} clients trouvés`);
    
    if (clients && clients.length > 0) {
      clients.forEach((client, index) => {
        console.log(`   ${index + 1}. Email: ${client.email}, Nom: ${client.name}`);
      });
    }

    // 4. Vérifier les ClientProduitEligible pour le dernier client
    if (clients && clients.length > 0) {
      const lastClient = clients[0];
      console.log(`\n4️⃣ ClientProduitEligible pour ${lastClient.email}...`);
      
      const { data: clientProducts, error: productsError } = await supabase
        .from('ClientProduitEligible')
        .select(`
          *,
          ProduitEligible(id, nom, description, category)
        `)
        .eq('clientId', lastClient.id);

      if (productsError) {
        console.error('❌ Erreur produits:', productsError);
        return;
      }

      console.log(`✅ ${clientProducts?.length || 0} produits éligibles trouvés`);
      
      if (clientProducts && clientProducts.length > 0) {
        clientProducts.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.ProduitEligible?.nom || product.produitId}, Statut: ${product.statut}, Montant: ${product.montantFinal}€`);
        });
      } else {
        console.log('   ⚠️ Aucun produit éligible trouvé');
      }
    }

    console.log('\n✅ Debug terminé');

  } catch (error) {
    console.error('❌ Erreur debug:', error);
  }
}

debugMigration(); 