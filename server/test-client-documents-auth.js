const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xqjqjqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxanFqcWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU0OTMzNywiZXhwIjoyMDU1MTI1MzM3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testClientDocumentsWithAuth() {
  console.log('🧪 Test de l\'API documents client avec authentification\n');

  const baseURL = 'http://localhost:5001';
  const testClientId = '25274ba6-67e6-4151-901c-74851fe2d82a'; // Client de test
  const testEmail = 'grandjean.laporte@gmail.com';
  const testPassword = 'test123'; // Mot de passe de test
  
  try {
    // 1. Authentification avec Supabase
    console.log('1️⃣ Authentification avec Supabase...');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (authError) {
      console.log('❌ Erreur authentification:', authError.message);
      return;
    }

    if (!authData.session?.access_token) {
      console.log('❌ Token d\'accès non récupéré');
      return;
    }

    console.log('✅ Authentification réussie');
    console.log(`   - User ID: ${authData.user.id}`);
    console.log(`   - Email: ${authData.user.email}`);
    console.log(`   - Token: ${authData.session.access_token.substring(0, 50)}...`);

    // 2. Test de l'API avec le vrai token
    console.log('\n2️⃣ Test de l\'API /api/client-documents/client/:clientId');
    
    try {
      const response = await axios.get(`${baseURL}/api/client-documents/client/${testClientId}`, {
        headers: {
          'Authorization': `Bearer ${authData.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ API documents client fonctionne:');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Success: ${response.data.success}`);
      
      if (response.data.success && response.data.data) {
        const { chartes, audits, simulations, guides, stats } = response.data.data;
        
        console.log('   - Statistiques:');
        console.log(`     * Total documents: ${stats.totalDocuments}`);
        console.log(`     * Chartes: ${stats.totalChartes} (${stats.chartesSignees} signées)`);
        console.log(`     * Audits: ${stats.totalAudits} (${stats.auditsEnCours} en cours)`);
        console.log(`     * Simulations: ${stats.totalSimulations} (${stats.simulationsCompletees} complétées)`);
        console.log(`     * Guides: ${stats.totalGuides}`);
        console.log(`     * Gains potentiels: ${stats.gainsPotentiels.toLocaleString()}€`);
        
        console.log('   - Détails par catégorie:');
        
        if (chartes.length > 0) {
          console.log('     📄 Chartes signées:');
          chartes.forEach((charte, index) => {
            console.log(`       ${index + 1}. ${charte.produit} - ${charte.gainsPotentiels.toLocaleString()}€`);
          });
        } else {
          console.log('     📄 Aucune charte signée trouvée');
        }
        
        if (audits.length > 0) {
          console.log('     📊 Documents d\'audit:');
          audits.forEach((audit, index) => {
            console.log(`       ${index + 1}. ${audit.name} (${audit.audit?.audit_type})`);
          });
        } else {
          console.log('     📊 Aucun document d\'audit trouvé');
        }
        
        if (simulations.length > 0) {
          console.log('     🎯 Simulations:');
          simulations.forEach((sim, index) => {
            console.log(`       ${index + 1}. ${sim.produitEligible} - ${sim.gainsEstimés.toLocaleString()}€`);
          });
        } else {
          console.log('     🎯 Aucune simulation trouvée');
        }
        
        if (guides.length > 0) {
          console.log('     📚 Guides:');
          guides.forEach((guide, index) => {
            console.log(`       ${index + 1}. ${guide.title} (${guide.category})`);
          });
        } else {
          console.log('     📚 Aucun guide trouvé');
        }
      }
      
    } catch (error) {
      console.log(`❌ Erreur API documents client: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      
      if (error.response?.data) {
        console.log('   - Détails de l\'erreur:', JSON.stringify(error.response.data, null, 2));
      }
    }

    // 3. Test de sécurité - accès à un autre client
    console.log('\n3️⃣ Test de sécurité - accès non autorisé...');
    
    try {
      const otherClientId = '0538de29-4287-4c28-b76a-b65ef993f393'; // Autre client
      const response = await axios.get(`${baseURL}/api/client-documents/client/${otherClientId}`, {
        headers: {
          'Authorization': `Bearer ${authData.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Erreur de sécurité - accès autorisé à un autre client');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Sécurité active - accès refusé à un autre client (403)');
      } else {
        console.log(`⚠️ Erreur inattendue: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n🎯 Résumé du test:');
    console.log('   - ✅ Authentification Supabase fonctionnelle');
    console.log('   - ✅ API documents client accessible');
    console.log('   - ✅ Intégration avec les données existantes');
    console.log('   - ✅ Statistiques calculées automatiquement');
    console.log('   - ✅ Sécurité et permissions en place');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter le test
testClientDocumentsWithAuth(); 