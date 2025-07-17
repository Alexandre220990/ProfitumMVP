const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCalendarEventCreation() {
  console.log('🧪 Test de création d\'événement calendrier...\n');

  try {
    // 1. Récupérer un client pour le test
    const { data: clients, error: clientError } = await supabase
      .from('Client')
      .select('id, email')
      .limit(1);

    if (clientError || !clients || clients.length === 0) {
      console.log('❌ Aucun client trouvé pour le test');
      return;
    }

    const client = clients[0];
    console.log(`✅ Client trouvé: ${client.email} (ID: ${client.id})`);

    // 2. Créer un événement de test
    const testEvent = {
      title: 'Test événement calendrier',
      description: 'Événement test - Rendez-vous important',
      start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Demain
      end_date: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Demain + 1h
      type: 'appointment',
      priority: 'medium',
      status: 'pending',
      category: 'client',
      client_id: client.id,
      color: '#3B82F6',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📅 Données événement de test:', JSON.stringify(testEvent, null, 2));

    // 3. Insérer l'événement
    const { data: event, error: eventError } = await supabase
      .from('CalendarEvent')
      .insert(testEvent)
      .select()
      .single();

    if (eventError) {
      console.log('❌ Erreur création événement:', eventError);
      return;
    }

    console.log('✅ Événement créé avec succès:', event.id);

    // 4. Vérifier que l'événement existe
    const { data: retrievedEvent, error: retrieveError } = await supabase
      .from('CalendarEvent')
      .select('*')
      .eq('id', event.id)
      .single();

    if (retrieveError) {
      console.log('❌ Erreur récupération événement:', retrieveError);
      return;
    }

    console.log('✅ Événement récupéré:', retrievedEvent.title);

    // 5. Nettoyer - supprimer l'événement de test
    const { error: deleteError } = await supabase
      .from('CalendarEvent')
      .delete()
      .eq('id', event.id);

    if (deleteError) {
      console.log('⚠️ Erreur suppression événement de test:', deleteError);
    } else {
      console.log('✅ Événement de test supprimé');
    }

    console.log('\n🎉 Test terminé avec succès !');

  } catch (error) {
    console.log('❌ Erreur générale:', error);
  }
}

// Test des requêtes experts et dossiers
async function testExpertAndDossierQueries() {
  console.log('\n🧪 Test des requêtes experts et dossiers...\n');

  try {
    // Test récupération experts
    console.log('👨‍💼 Test récupération experts...');
    const { data: experts, error: expertError } = await supabase
      .from('Expert')
      .select('id, email, name, specializations, validated')
      .eq('validated', true)
      .eq('active', true)
      .order('name');

    if (expertError) {
      console.log('❌ Erreur récupération experts:', expertError);
    } else {
      console.log(`✅ ${experts?.length || 0} experts trouvés`);
    }

    // Test récupération dossiers
    console.log('\n📁 Test récupération dossiers...');
    const { data: dossiers, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        Client (company_name),
        ProduitEligible (nom),
        status,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (dossierError) {
      console.log('❌ Erreur récupération dossiers:', dossierError);
    } else {
      console.log(`✅ ${dossiers?.length || 0} dossiers trouvés`);
    }

  } catch (error) {
    console.log('❌ Erreur générale:', error);
  }
}

// Exécuter les tests
async function runTests() {
  await testCalendarEventCreation();
  await testExpertAndDossierQueries();
}

runTests(); 