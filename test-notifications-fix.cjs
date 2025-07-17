const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxza3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ5MzMsImV4cCI6MjA1MDU1MDkzM30.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNotifications() {
  console.log('🧪 Test des corrections de notifications...\n');

  try {
    // 1. Test de récupération des notifications
    console.log('1️⃣ Test récupération notifications...');
    const { data: notifications, error: notificationsError } = await supabase
      .from('notification')
      .select('*')
      .limit(5);

    if (notificationsError) {
      console.error('❌ Erreur récupération notifications:', notificationsError);
    } else {
      console.log('✅ Notifications récupérées:', notifications?.length || 0);
    }

    // 2. Test de récupération des experts validés
    console.log('\n2️⃣ Test récupération experts...');
    const { data: experts, error: expertsError } = await supabase
      .from('Expert')
      .select('id, nom, prenom, email, specialite, statut')
      .eq('statut', 'valide')
      .limit(5);

    if (expertsError) {
      console.error('❌ Erreur récupération experts:', expertsError);
    } else {
      console.log('✅ Experts récupérés:', experts?.length || 0);
    }

    // 3. Test de récupération des dossiers
    console.log('\n3️⃣ Test récupération dossiers...');
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
      .limit(5);

    if (dossiersError) {
      console.error('❌ Erreur récupération dossiers:', dossiersError);
    } else {
      console.log('✅ Dossiers récupérés:', dossiers?.length || 0);
    }

    // 4. Test de création d'une notification de test
    console.log('\n4️⃣ Test création notification...');
    const testNotification = {
      user_id: '25274ba6-67e6-4151-901c-74851fe2d82a', // ID client de test
      user_type: 'client',
      title: 'Test de correction',
      message: 'Cette notification teste la correction des erreurs',
      notification_type: 'system',
      priority: 'normal',
      is_read: false,
      is_dismissed: false
    };

    const { data: newNotification, error: createError } = await supabase
      .from('notification')
      .insert(testNotification)
      .select('id')
      .single();

    if (createError) {
      console.error('❌ Erreur création notification:', createError);
    } else {
      console.log('✅ Notification créée avec succès, ID:', newNotification?.id);
      
      // Supprimer la notification de test
      await supabase
        .from('notification')
        .delete()
        .eq('id', newNotification.id);
      console.log('🗑️ Notification de test supprimée');
    }

    console.log('\n🎉 Tests terminés avec succès !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testNotifications(); 