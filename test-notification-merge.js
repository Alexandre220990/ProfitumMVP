// Script de test pour vérifier la fusion des tables Notification
// Date: 2025-01-03

const SUPABASE_URL = 'https://gvvlsgtubqfxdztldunj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxnc3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU0OTMzNywiZXhwIjoyMDU1MTI1MzM3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

async function testNotificationMerge() {
  console.log('🧪 Test de la fusion des tables Notification...\n');

  const CLIENT_ID = '25274ba6-67e6-4151-901c-74851fe2d82a';

  try {
    // 1. Test d'accès à la table Notification (majuscule)
    console.log('1️⃣ Test d\'accès à la table Notification (majuscule)...');
    
    const notificationResponse = await fetch(`${SUPABASE_URL}/rest/v1/Notification?select=*&user_id=eq.${CLIENT_ID}&user_type=eq.client&is_dismissed=eq.false&order=created_at.desc&limit=5`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status Notification (majuscule):', notificationResponse.status);
    
    if (notificationResponse.ok) {
      const data = await notificationResponse.json();
      console.log('✅ Table Notification accessible');
      console.log('📊 Nombre de notifications:', data.length);
      if (data.length > 0) {
        console.log('📊 Structure de la première notification:', Object.keys(data[0]));
      }
    } else {
      const error = await notificationResponse.text();
      console.log('❌ Erreur Notification (majuscule):', error);
    }

    // 2. Test d'accès à la table notification (minuscule)
    console.log('\n2️⃣ Test d\'accès à la table notification (minuscule)...');
    
    const notificationLowerResponse = await fetch(`${SUPABASE_URL}/rest/v1/notification?select=*&user_id=eq.${CLIENT_ID}&user_type=eq.client&is_dismissed=eq.false&order=created_at.desc&limit=5`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status notification (minuscule):', notificationLowerResponse.status);
    
    if (notificationLowerResponse.ok) {
      const data = await notificationLowerResponse.json();
      console.log('✅ Table notification accessible');
      console.log('📊 Nombre de notifications:', data.length);
      if (data.length > 0) {
        console.log('📊 Structure de la première notification:', Object.keys(data[0]));
      }
    } else {
      const error = await notificationLowerResponse.text();
      console.log('❌ Erreur notification (minuscule):', error);
    }

    // 3. Test de création d'une notification dans la table Notification
    console.log('\n3️⃣ Test de création d\'une notification...');
    
    const testNotification = {
      user_id: CLIENT_ID,
      user_type: 'client',
      title: 'Test de fusion des tables',
      message: 'Cette notification teste la fusion des tables Notification',
      notification_type: 'system',
      priority: 'normal'
    };

    const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/Notification`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testNotification)
    });

    console.log('📊 Status création:', createResponse.status);
    
    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ Notification créée:', createData[0].id);
      
      // Supprimer la notification de test
      await fetch(`${SUPABASE_URL}/rest/v1/Notification?id=eq.${createData[0].id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      });
      
      console.log('✅ Notification de test supprimée');
    } else {
      const error = await createResponse.text();
      console.log('❌ Erreur création:', error);
    }

    // 4. Test du service client
    console.log('\n4️⃣ Test du service client...');
    
    const clientServiceResponse = await fetch(`${SUPABASE_URL}/rest/v1/Notification?select=*&user_id=eq.${CLIENT_ID}&user_type=eq.client&is_dismissed=eq.false&order=created_at.desc&limit=50`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status service client:', clientServiceResponse.status);
    
    if (clientServiceResponse.ok) {
      const data = await clientServiceResponse.json();
      console.log('✅ Service client fonctionne');
      console.log('📊 Notifications récupérées:', data.length);
    } else {
      const error = await clientServiceResponse.text();
      console.log('❌ Erreur service client:', error);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }

  console.log('\n✅ Tests terminés !');
}

// Exécuter les tests
testNotificationMerge(); 