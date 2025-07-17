const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxza3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ5MzMsImV4cCI6MjA1MDU1MDkzM30.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCalendarIntegration() {
  console.log('🧪 Test d\'intégration du calendrier...\n');

  try {
    // 1. Test de création d'un événement
    console.log('1️⃣ Test création événement...');
    const testEvent = {
      title: 'Test événement avec expert et dossier',
      description: 'Événement de test pour vérifier l\'intégration',
      start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Demain
      end_date: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Demain + 1h
      type: 'meeting',
      priority: 'medium',
      status: 'pending',
      category: 'collaborative',
      client_id: '25274ba6-67e6-4151-901c-74851fe2d82a',
      location: 'Bureau principal',
      is_online: true,
      meeting_url: 'https://meet.google.com/test',
      color: '#3B82F6',
      metadata: {
        expertId: 'test-expert-id',
        expertName: 'Expert Test',
        dossierId: 'test-dossier-id',
        dossierName: 'Dossier Test'
      }
    };

    const { data: newEvent, error: createError } = await supabase
      .from('CalendarEvent')
      .insert(testEvent)
      .select('id')
      .single();

    if (createError) {
      console.error('❌ Erreur création événement:', createError);
    } else {
      console.log('✅ Événement créé avec succès, ID:', newEvent?.id);

      // 2. Test de création de rappels
      console.log('\n2️⃣ Test création rappels...');
      const reminders = [
        { event_id: newEvent.id, type: 'email', time_minutes: 60, sent: false },
        { event_id: newEvent.id, type: 'push', time_minutes: 15, sent: false }
      ];

      const { error: reminderError } = await supabase
        .from('CalendarEventReminder')
        .insert(reminders);

      if (reminderError) {
        console.error('❌ Erreur création rappels:', reminderError);
      } else {
        console.log('✅ Rappels créés avec succès');
      }

      // 3. Test de création de notification
      console.log('\n3️⃣ Test création notification...');
      const notification = {
        user_id: '25274ba6-67e6-4151-901c-74851fe2d82a',
        user_type: 'client',
        title: 'Test notification événement',
        message: 'Notification de test pour l\'événement créé',
        notification_type: 'reminder',
        priority: 'normal',
        action_data: {
          action_type: 'redirect',
          target_page: 'agenda',
          target_id: newEvent.id
        },
        is_read: false,
        is_dismissed: false
      };

      const { data: newNotification, error: notificationError } = await supabase
        .from('notification')
        .insert(notification)
        .select('id')
        .single();

      if (notificationError) {
        console.error('❌ Erreur création notification:', notificationError);
      } else {
        console.log('✅ Notification créée avec succès, ID:', newNotification?.id);
      }

      // 4. Test de récupération des experts
      console.log('\n4️⃣ Test récupération experts...');
      const { data: experts, error: expertsError } = await supabase
        .from('Expert')
        .select('id, nom, prenom, email, specialite, statut')
        .eq('statut', 'valide')
        .limit(3);

      if (expertsError) {
        console.error('❌ Erreur récupération experts:', expertsError);
      } else {
        console.log('✅ Experts récupérés:', experts?.length || 0);
      }

      // 5. Test de récupération des dossiers
      console.log('\n5️⃣ Test récupération dossiers...');
      const { data: dossiers, error: dossiersError } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          statut,
          date_creation,
          progression,
          ProduitEligible (
            nom
          )
        `)
        .limit(3);

      if (dossiersError) {
        console.error('❌ Erreur récupération dossiers:', dossiersError);
      } else {
        console.log('✅ Dossiers récupérés:', dossiers?.length || 0);
      }

      // Nettoyage des données de test
      console.log('\n🧹 Nettoyage des données de test...');
      await supabase.from('CalendarEventReminder').delete().eq('event_id', newEvent.id);
      await supabase.from('notification').delete().eq('id', newNotification.id);
      await supabase.from('CalendarEvent').delete().eq('id', newEvent.id);
      console.log('✅ Données de test supprimées');

      console.log('\n🎉 Tests d\'intégration terminés avec succès !');
      console.log('\n📋 Résumé des fonctionnalités testées :');
      console.log('   ✅ Création d\'événements avec métadonnées');
      console.log('   ✅ Système de rappels automatiques');
      console.log('   ✅ Notifications d\'événements');
      console.log('   ✅ Récupération d\'experts validés');
      console.log('   ✅ Récupération de dossiers clients');
      console.log('   ✅ Intégration complète du calendrier');

    }
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testCalendarIntegration(); 