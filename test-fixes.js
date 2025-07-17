// Script de test pour vérifier les corrections
// Date: 2025-01-03

const API_URL = 'http://localhost:5001';
const CLIENT_ID = '25274ba6-67e6-4151-901c-74851fe2d82a';

async function testFixes() {
  console.log('🧪 Test des corrections appliquées...\n');

  try {
    // 1. Test de l'API des produits éligibles (correction use-audit.ts)
    console.log('1️⃣ Test de l\'API des produits éligibles...');
    const produitsResponse = await fetch(`${API_URL}/api/produits-eligibles/client/${CLIENT_ID}`, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });

    if (produitsResponse.ok) {
      const produitsData = await produitsResponse.json();
      console.log('✅ API produits éligibles - Status:', produitsResponse.status);
      console.log('✅ API produits éligibles - Structure:', JSON.stringify(produitsData, null, 2));
      
      // Vérifier la structure des données
      if (produitsData.success && Array.isArray(produitsData.data)) {
        console.log('✅ Structure des données correcte');
        if (produitsData.data.length > 0) {
          const firstItem = produitsData.data[0];
          if (firstItem.ProduitEligible && firstItem.ProduitEligible.nom) {
            console.log('✅ ProduitEligible.nom présent:', firstItem.ProduitEligible.nom);
          } else {
            console.log('⚠️ ProduitEligible.nom manquant');
          }
        }
      }
    } else {
      console.log('❌ Erreur API produits éligibles:', produitsResponse.status, produitsResponse.statusText);
    }

    // 2. Test de l'API des notifications (correction table Notification)
    console.log('\n2️⃣ Test de l\'API des notifications...');
    const notificationsResponse = await fetch(`${API_URL}/rest/v1/Notification?select=*&user_id=eq.${CLIENT_ID}&user_type=eq.client&is_dismissed=eq.false&order=created_at.desc&limit=5`, {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxnc3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU0OTMzNywiZXhwIjoyMDU1MTI1MzM3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxnc3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU0OTMzNywiZXhwIjoyMDU1MTI1MzM3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8',
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 API notifications - Status:', notificationsResponse.status);
    if (notificationsResponse.ok) {
      const notificationsData = await notificationsResponse.json();
      console.log('✅ API notifications - Data:', JSON.stringify(notificationsData, null, 2));
    } else {
      const errorText = await notificationsResponse.text();
      console.log('❌ Erreur API notifications:', errorText);
    }

    // 3. Test de création d'une notification
    console.log('\n3️⃣ Test de création d\'une notification...');
    const createNotificationResponse = await fetch(`${API_URL}/rest/v1/Notification`, {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxnc3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU0OTMzNywiZXhwIjoyMDU1MTI1MzM3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxnc3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU0OTMzNywiZXhwIjoyMDU1MTI1MzM3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: CLIENT_ID,
        user_type: 'client',
        title: 'Test de notification',
        message: 'Ceci est un test de notification',
        notification_type: 'system',
        priority: 'normal'
      })
    });

    console.log('📊 Création notification - Status:', createNotificationResponse.status);
    if (createNotificationResponse.ok) {
      const createData = await createNotificationResponse.json();
      console.log('✅ Notification créée:', JSON.stringify(createData, null, 2));
    } else {
      const errorText = await createNotificationResponse.text();
      console.log('❌ Erreur création notification:', errorText);
    }

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }

  console.log('\n✅ Tests terminés !');
}

// Exécuter les tests
testFixes(); 