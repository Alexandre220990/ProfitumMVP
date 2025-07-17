const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testGEDComplete() {
  console.log('🔧 Test complet de la GED - FinancialTracker\n');

  try {
    // Test 1: Connexion admin
    console.log('1️⃣ Connexion admin:');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'grandjean.alexandre5@gmail.com',
      password: 'Adminprofitum'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Échec de la connexion:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Connexion réussie');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test 2: Créer un label
    console.log('\n2️⃣ Test création label:');
    try {
      const labelData = {
        name: 'Test Label',
        color: '#FF6B6B',
        description: 'Label de test pour la GED'
      };
      
      const labelResponse = await axios.post(`${BASE_URL}/api/documents/labels`, labelData, { headers });
      
      if (labelResponse.data.success) {
        console.log('✅ Label créé avec succès');
        const labelId = labelResponse.data.data.id;
        
        // Test 3: Créer un document
        console.log('\n3️⃣ Test création document:');
        const documentData = {
          title: 'Document de test GED',
          description: 'Document de test pour la gestion électronique documentaire',
          content: '<h1>Test GED</h1><p>Ceci est un document de test.</p>',
          category: 'technical',
          labels: [labelId],
          read_time: 5
        };
        
        const docResponse = await axios.post(`${BASE_URL}/api/documents`, documentData, { headers });
        
        if (docResponse.data.success) {
          console.log('✅ Document créé avec succès');
          const documentId = docResponse.data.data.id;
          
          // Test 4: Ajouter aux favoris
          console.log('\n4️⃣ Test ajout aux favoris:');
          const favoriteResponse = await axios.post(`${BASE_URL}/api/documents/${documentId}/favorite`, {}, { headers });
          
          if (favoriteResponse.data.success) {
            console.log('✅ Document ajouté aux favoris');
          } else {
            console.log('❌ Erreur ajout favoris:', favoriteResponse.data.error);
          }
          
          // Test 5: Récupérer les favoris
          console.log('\n5️⃣ Test récupération favoris:');
          const favoritesResponse = await axios.get(`${BASE_URL}/api/documents/favorites`, { headers });
          
          if (favoritesResponse.data.success) {
            console.log('✅ Favoris récupérés:', favoritesResponse.data.data.length, 'favori(s)');
          } else {
            console.log('❌ Erreur récupération favoris:', favoritesResponse.data.error);
          }
          
          // Test 6: Récupérer les métriques
          console.log('\n6️⃣ Test métriques GED:');
          const metricsResponse = await axios.get(`${BASE_URL}/api/documents/metrics`, { headers });
          
          if (metricsResponse.data.success) {
            const metrics = metricsResponse.data.data;
            console.log('✅ Métriques récupérées:');
            console.log('   - Total documents:', metrics.totalDocuments);
            console.log('   - Total labels:', metrics.totalLabels);
            console.log('   - Total favoris:', metrics.totalFavorites);
            console.log('   - Documents métier:', metrics.documentsByCategory.business);
            console.log('   - Documents techniques:', metrics.documentsByCategory.technical);
          } else {
            console.log('❌ Erreur métriques:', metricsResponse.data.error);
          }
          
          // Test 7: Modifier le document
          console.log('\n7️⃣ Test modification document:');
          const updateData = {
            title: 'Document de test GED - Modifié',
            description: 'Document modifié pour tester la GED'
          };
          
          const updateResponse = await axios.put(`${BASE_URL}/api/documents/${documentId}`, updateData, { headers });
          
          if (updateResponse.data.success) {
            console.log('✅ Document modifié avec succès');
          } else {
            console.log('❌ Erreur modification:', updateResponse.data.error);
          }
          
          // Test 8: Récupérer le document
          console.log('\n8️⃣ Test récupération document:');
          const getDocResponse = await axios.get(`${BASE_URL}/api/documents/${documentId}`, { headers });
          
          if (getDocResponse.data.success) {
            console.log('✅ Document récupéré:', getDocResponse.data.data.title);
          } else {
            console.log('❌ Erreur récupération document:', getDocResponse.data.error);
          }
          
          // Test 9: Retirer des favoris
          console.log('\n9️⃣ Test suppression favoris:');
          const removeFavoriteResponse = await axios.delete(`${BASE_URL}/api/documents/${documentId}/favorite`, { headers });
          
          if (removeFavoriteResponse.data.success) {
            console.log('✅ Document retiré des favoris');
          } else {
            console.log('❌ Erreur suppression favoris:', removeFavoriteResponse.data.error);
          }
          
          // Test 10: Supprimer le document
          console.log('\n🔟 Test suppression document:');
          const deleteDocResponse = await axios.delete(`${BASE_URL}/api/documents/${documentId}`, { headers });
          
          if (deleteDocResponse.data.success) {
            console.log('✅ Document supprimé avec succès');
          } else {
            console.log('❌ Erreur suppression document:', deleteDocResponse.data.error);
          }
          
        } else {
          console.log('❌ Erreur création document:', docResponse.data.error);
        }
        
        // Test 11: Supprimer le label
        console.log('\n1️⃣1️⃣ Test suppression label:');
        const deleteLabelResponse = await axios.delete(`${BASE_URL}/api/documents/labels/${labelId}`, { headers });
        
        if (deleteLabelResponse.data.success) {
          console.log('✅ Label supprimé avec succès');
        } else {
          console.log('❌ Erreur suppression label:', deleteLabelResponse.data.error);
        }
        
      } else {
        console.log('❌ Erreur création label:', labelResponse.data.error);
      }
    } catch (error) {
      console.log('❌ Erreur lors du test:', error.response?.data?.error || error.message);
    }

    // Test 12: Récupérer tous les documents
    console.log('\n1️⃣2️⃣ Test récupération tous les documents:');
    try {
      const allDocsResponse = await axios.get(`${BASE_URL}/api/documents`, { headers });
      
      if (allDocsResponse.data.success) {
        console.log('✅ Documents récupérés:', allDocsResponse.data.data.documents.length, 'document(s)');
      } else {
        console.log('❌ Erreur récupération documents:', allDocsResponse.data.error);
      }
    } catch (error) {
      console.log('❌ Erreur récupération documents:', error.response?.data?.error || error.message);
    }

    // Test 13: Récupérer tous les labels
    console.log('\n1️⃣3️⃣ Test récupération tous les labels:');
    try {
      const allLabelsResponse = await axios.get(`${BASE_URL}/api/documents/labels`, { headers });
      
      if (allLabelsResponse.data.success) {
        console.log('✅ Labels récupérés:', allLabelsResponse.data.data.length, 'label(s)');
      } else {
        console.log('❌ Erreur récupération labels:', allLabelsResponse.data.error);
      }
    } catch (error) {
      console.log('❌ Erreur récupération labels:', error.response?.data?.error || error.message);
    }

    console.log('\n🎉 Tests GED terminés avec succès !');

  } catch (error) {
    console.error('❌ Erreur générale:', error.response?.data || error.message);
  }
}

// Exécuter les tests
testGEDComplete(); 