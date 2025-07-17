const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testNotifications() {
  console.log('🔔 Test du système de notifications...\n');

  try {
    // 1. Vérifier que la table ExpertNotifications existe
    console.log('1. Vérification de la table ExpertNotifications...');
    const { data: tableExists, error: tableError } = await supabase
      .from('ExpertNotifications')
      .select('count')
      .limit(1);

    if (tableError) {
      console.error('❌ Table ExpertNotifications non trouvée:', tableError.message);
      console.log('💡 Exécutez d\'abord la migration: server/migrations/20250103_create_expert_notifications.sql');
      return;
    }
    console.log('✅ Table ExpertNotifications trouvée\n');

    // 2. Récupérer un expert pour les tests
    console.log('2. Récupération d\'un expert pour les tests...');
    const { data: experts, error: expertsError } = await supabase
      .from('Expert')
      .select('id, name')
      .limit(1);

    if (expertsError || !experts || experts.length === 0) {
      console.error('❌ Aucun expert trouvé pour les tests');
      return;
    }

    const testExpert = experts[0];
    console.log(`✅ Expert trouvé: ${testExpert.name} (${testExpert.id})\n`);

    // 3. Créer une notification de test
    console.log('3. Création d\'une notification de test...');
    const testNotification = {
      expert_id: testExpert.id,
      type: 'preselection',
      title: 'Test de notification',
      message: 'Ceci est un test du système de notifications',
      data: {
        test: true,
        timestamp: new Date().toISOString(),
        client_name: 'Client Test',
        produit_nom: 'Produit Test'
      }
    };

    const { data: createdNotification, error: createError } = await supabase
      .from('ExpertNotifications')
      .insert(testNotification)
      .select()
      .single();

    if (createError) {
      console.error('❌ Erreur lors de la création de la notification:', createError);
      return;
    }
    console.log('✅ Notification créée:', createdNotification.id);

    // 4. Récupérer les notifications de l'expert
    console.log('\n4. Récupération des notifications de l\'expert...');
    const { data: notifications, error: fetchError } = await supabase
      .from('ExpertNotifications')
      .select('*')
      .eq('expert_id', testExpert.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Erreur lors de la récupération des notifications:', fetchError);
      return;
    }
    console.log(`✅ ${notifications.length} notification(s) trouvée(s)`);

    // 5. Marquer la notification comme lue
    console.log('\n5. Marquage de la notification comme lue...');
    const { error: updateError } = await supabase
      .from('ExpertNotifications')
      .update({ 
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', createdNotification.id);

    if (updateError) {
      console.error('❌ Erreur lors du marquage comme lu:', updateError);
      return;
    }
    console.log('✅ Notification marquée comme lue');

    // 6. Compter les notifications non lues
    console.log('\n6. Comptage des notifications non lues...');
    const { count: unreadCount, error: countError } = await supabase
      .from('ExpertNotifications')
      .select('*', { count: 'exact', head: true })
      .eq('expert_id', testExpert.id)
      .eq('read', false);

    if (countError) {
      console.error('❌ Erreur lors du comptage:', countError);
      return;
    }
    console.log(`✅ ${unreadCount} notification(s) non lue(s)`);

    // 7. Nettoyer les notifications de test
    console.log('\n7. Nettoyage des notifications de test...');
    const { error: deleteError } = await supabase
      .from('ExpertNotifications')
      .delete()
      .eq('id', createdNotification.id);

    if (deleteError) {
      console.error('❌ Erreur lors de la suppression:', deleteError);
      return;
    }
    console.log('✅ Notification de test supprimée');

    // 8. Test des différents types de notifications
    console.log('\n8. Test des différents types de notifications...');
    const notificationTypes = [
      {
        type: 'preselection',
        title: 'Nouvelle pré-sélection',
        message: 'Vous avez été pré-sélectionné pour un dossier'
      },
      {
        type: 'message',
        title: 'Nouveau message',
        message: 'Vous avez reçu un nouveau message d\'un client'
      },
      {
        type: 'assignment',
        title: 'Dossier assigné',
        message: 'Un nouveau dossier vous a été assigné'
      },
      {
        type: 'system',
        title: 'Maintenance système',
        message: 'Une maintenance est prévue ce soir'
      }
    ];

    for (const notificationType of notificationTypes) {
      const { error: typeError } = await supabase
        .from('ExpertNotifications')
        .insert({
          expert_id: testExpert.id,
          ...notificationType,
          data: { test_type: true }
        });

      if (typeError) {
        console.error(`❌ Erreur pour le type ${notificationType.type}:`, typeError);
      } else {
        console.log(`✅ Notification de type '${notificationType.type}' créée`);
      }
    }

    console.log('\n🎉 Tests terminés avec succès !');
    console.log('\n📋 Résumé:');
    console.log('- Table ExpertNotifications: ✅');
    console.log('- Création de notifications: ✅');
    console.log('- Récupération de notifications: ✅');
    console.log('- Marquage comme lu: ✅');
    console.log('- Comptage des non lues: ✅');
    console.log('- Suppression: ✅');
    console.log('- Types de notifications: ✅');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter les tests
testNotifications(); 