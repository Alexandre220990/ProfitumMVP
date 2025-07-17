const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxza3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk3NDkzMywiZXhwIjoyMDUwNTUwOTMzfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCalendarValidation() {
  console.log('🔍 Diagnostic de validation du calendrier...\n');

  try {
    // 1. Vérifier la structure de la table CalendarEvent
    console.log('1️⃣ Vérification de la structure de la table CalendarEvent...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'CalendarEvent')
      .eq('table_schema', 'public');

    if (tableError) {
      console.error('❌ Erreur récupération structure table:', tableError);
    } else {
      console.log('✅ Structure de la table CalendarEvent:');
      tableInfo.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
      });
    }

    // 2. Vérifier les contraintes de la table
    console.log('\n2️⃣ Vérification des contraintes...');
    const { data: constraints, error: constraintError } = await supabase
      .rpc('get_table_constraints', { table_name: 'CalendarEvent' })
      .catch(() => ({ data: null, error: 'Fonction non disponible' }));

    if (constraintError) {
      console.log('⚠️ Impossible de récupérer les contraintes:', constraintError);
    } else if (constraints) {
      console.log('✅ Contraintes trouvées:', constraints);
    }

    // 3. Test avec des données valides
    console.log('\n3️⃣ Test avec des données valides...');
    const validEvent = {
      title: 'Test événement valide',
      description: 'Description de test',
      start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Demain
      end_date: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Demain + 1h
      type: 'appointment',
      priority: 'medium',
      status: 'pending',
      category: 'client',
      color: '#3B82F6',
      metadata: {}
    };

    const { data: validResult, error: validError } = await supabase
      .from('CalendarEvent')
      .insert(validEvent)
      .select()
      .single();

    if (validError) {
      console.error('❌ Erreur avec données valides:', validError);
    } else {
      console.log('✅ Événement valide créé avec succès:', validResult.id);
      
      // Nettoyer
      await supabase.from('CalendarEvent').delete().eq('id', validResult.id);
    }

    // 4. Test avec des données problématiques courantes
    console.log('\n4️⃣ Tests avec des données problématiques...');
    
    // Test 1: Dates invalides
    const invalidDatesEvent = {
      title: 'Test dates invalides',
      start_date: 'date-invalide',
      end_date: new Date().toISOString(),
      type: 'appointment',
      priority: 'medium',
      status: 'pending',
      category: 'client',
      color: '#3B82F6'
    };

    const { error: dateError } = await supabase
      .from('CalendarEvent')
      .insert(invalidDatesEvent);

    console.log('Test dates invalides:', dateError ? `❌ ${dateError.message}` : '✅ Accepté (inattendu)');

    // Test 2: Type invalide
    const invalidTypeEvent = {
      title: 'Test type invalide',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      type: 'type_invalide',
      priority: 'medium',
      status: 'pending',
      category: 'client',
      color: '#3B82F6'
    };

    const { error: typeError } = await supabase
      .from('CalendarEvent')
      .insert(invalidTypeEvent);

    console.log('Test type invalide:', typeError ? `❌ ${typeError.message}` : '✅ Accepté (inattendu)');

    // Test 3: Couleur invalide
    const invalidColorEvent = {
      title: 'Test couleur invalide',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      type: 'appointment',
      priority: 'medium',
      status: 'pending',
      category: 'client',
      color: 'couleur-invalide'
    };

    const { error: colorError } = await supabase
      .from('CalendarEvent')
      .insert(invalidColorEvent);

    console.log('Test couleur invalide:', colorError ? `❌ ${colorError.message}` : '✅ Accepté (inattendu)');

    // 5. Vérifier les données envoyées par le client
    console.log('\n5️⃣ Simulation des données client...');
    const clientEventData = {
      title: 'Test événement client',
      description: '',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      type: 'appointment',
      priority: 'medium',
      status: 'pending',
      category: 'client',
      dossier_id: undefined,
      dossier_name: undefined,
      client_id: 'test-client-id',
      expert_id: undefined,
      location: '',
      is_online: false,
      meeting_url: undefined,
      phone_number: undefined,
      color: '#3B82F6',
      is_recurring: undefined,
      recurrence_rule: undefined,
      metadata: {}
    };

    console.log('Données client simulées:', JSON.stringify(clientEventData, null, 2));

    const { data: clientResult, error: clientError } = await supabase
      .from('CalendarEvent')
      .insert(clientEventData)
      .select()
      .single();

    if (clientError) {
      console.error('❌ Erreur avec données client:', clientError);
    } else {
      console.log('✅ Événement client créé avec succès:', clientResult.id);
      
      // Nettoyer
      await supabase.from('CalendarEvent').delete().eq('id', clientResult.id);
    }

    // 6. Vérifier les logs d'erreur récents
    console.log('\n6️⃣ Vérification des logs d\'erreur récents...');
    const { data: recentEvents, error: logError } = await supabase
      .from('CalendarEvent')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (logError) {
      console.error('❌ Erreur récupération événements récents:', logError);
    } else {
      console.log('✅ Événements récents:', recentEvents.length);
      recentEvents.forEach(event => {
        console.log(`   - ${event.title} (${event.created_at})`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le diagnostic
debugCalendarValidation().then(() => {
  console.log('\n✅ Diagnostic terminé');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
}); 