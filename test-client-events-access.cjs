const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxza3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk3NDkzMywiZXhwIjoyMDUwNTUwOTMzfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testClientEventsAccess() {
  console.log('🧪 Test accès événements clients...\n');

  try {
    // 1. Récupérer un client avec des dossiers
    console.log('1️⃣ Récupération d\'un client avec dossiers...');
    const { data: clientDossiers, error: dossiersError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        clientId,
        expert_id,
        Client!inner(name, email),
        Expert!inner(name, email)
      `)
      .limit(1);

    if (dossiersError) {
      console.error('❌ Erreur récupération dossiers:', dossiersError);
      return;
    }

    if (!clientDossiers || clientDossiers.length === 0) {
      console.log('⚠️ Aucun dossier client trouvé');
      return;
    }

    const dossier = clientDossiers[0];
    const clientId = dossier.clientId;
    const expertId = dossier.expert_id;

    console.log('✅ Client trouvé:', dossier.Client.name);
    console.log('   Email client:', dossier.Client.email);
    console.log('   Expert assigné:', dossier.Expert.name);
    console.log('   Dossier ID:', dossier.id);

    // 2. Créer des événements de test
    console.log('\n2️⃣ Création d\'événements de test...');

    // Événement du client
    const clientEventData = {
      title: 'Événement client',
      description: 'Événement créé par le client',
      start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      type: 'appointment',
      priority: 'medium',
      status: 'pending',
      category: 'client',
      client_id: clientId,
      color: '#3B82F6',
      metadata: {}
    };

    // Événement de l'expert
    const expertEventData = {
      title: 'Événement expert',
      description: 'Événement créé par l\'expert',
      start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      type: 'meeting',
      priority: 'high',
      status: 'pending',
      category: 'expert',
      expert_id: expertId,
      color: '#10B981',
      metadata: {}
    };

    // Événement assigné au dossier
    const dossierEventData = {
      title: 'Événement dossier',
      description: 'Événement assigné au dossier',
      start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      type: 'deadline',
      priority: 'critical',
      status: 'pending',
      category: 'collaborative',
      dossier_id: dossier.id,
      color: '#EF4444',
      metadata: {}
    };

    // Créer les événements
    const { data: clientEvent, error: clientEventError } = await supabase
      .from('CalendarEvent')
      .insert(clientEventData)
      .select()
      .single();

    const { data: expertEvent, error: expertEventError } = await supabase
      .from('CalendarEvent')
      .insert(expertEventData)
      .select()
      .single();

    const { data: dossierEvent, error: dossierEventError } = await supabase
      .from('CalendarEvent')
      .insert(dossierEventData)
      .select()
      .single();

    if (clientEventError) {
      console.error('❌ Erreur création événement client:', clientEventError);
    } else {
      console.log('✅ Événement client créé:', clientEvent.id);
    }

    if (expertEventError) {
      console.error('❌ Erreur création événement expert:', expertEventError);
    } else {
      console.log('✅ Événement expert créé:', expertEvent.id);
    }

    if (dossierEventError) {
      console.error('❌ Erreur création événement dossier:', dossierEventError);
    } else {
      console.log('✅ Événement dossier créé:', dossierEvent.id);
    }

    // 3. Tester la récupération des événements pour le client
    console.log('\n3️⃣ Test récupération événements pour le client...');

    // Simuler la logique de l'API
    const { data: clientDossiersForQuery, error: dossiersQueryError } = await supabase
      .from('ClientProduitEligible')
      .select('id, expert_id')
      .eq('clientId', clientId);

    if (dossiersQueryError) {
      console.error('❌ Erreur récupération dossiers pour query:', dossiersQueryError);
    } else {
      const expertIds = clientDossiersForQuery?.map(d => d.expert_id).filter(Boolean) || [];
      const dossierIds = clientDossiersForQuery?.map(d => d.id) || [];

      console.log('   Expert IDs trouvés:', expertIds);
      console.log('   Dossier IDs trouvés:', dossierIds);

      // Construire la condition OR
      const orConditions = [`client_id.eq.${clientId}`];
      
      if (expertIds.length > 0) {
        orConditions.push(...expertIds.map(expertId => `expert_id.eq.${expertId}`));
      }
      
      if (dossierIds.length > 0) {
        orConditions.push(...dossierIds.map(dossierId => `dossier_id.eq.${dossierId}`));
      }

      console.log('   Conditions OR:', orConditions);

      // Récupérer les événements
      const { data: clientEvents, error: eventsError } = await supabase
        .from('CalendarEvent')
        .select('*')
        .or(orConditions.join(','))
        .order('start_date', { ascending: true });

      if (eventsError) {
        console.error('❌ Erreur récupération événements:', eventsError);
      } else {
        console.log('✅ Événements trouvés pour le client:', clientEvents.length);
        
        clientEvents.forEach(event => {
          console.log(`   - ${event.title} (${event.category})`);
          console.log(`     Client ID: ${event.client_id}, Expert ID: ${event.expert_id}, Dossier ID: ${event.dossier_id}`);
        });

        // Vérifier que tous les types d'événements sont présents
        const hasClientEvent = clientEvents.some(e => e.client_id === clientId);
        const hasExpertEvent = clientEvents.some(e => e.expert_id === expertId);
        const hasDossierEvent = clientEvents.some(e => e.dossier_id === dossier.id);

        console.log('\n4️⃣ Vérification des accès...');
        console.log(`   ✅ Événement client accessible: ${hasClientEvent}`);
        console.log(`   ✅ Événement expert accessible: ${hasExpertEvent}`);
        console.log(`   ✅ Événement dossier accessible: ${hasDossierEvent}`);

        if (hasClientEvent && hasExpertEvent && hasDossierEvent) {
          console.log('🎉 SUCCÈS: Le client peut voir tous ses événements, ceux de son expert et ceux de ses dossiers !');
        } else {
          console.log('⚠️ ATTENTION: Certains événements ne sont pas accessibles');
        }
      }
    }

    // 4. Nettoyer les événements de test
    console.log('\n5️⃣ Nettoyage des événements de test...');
    
    const eventIds = [clientEvent?.id, expertEvent?.id, dossierEvent?.id].filter(Boolean);
    
    if (eventIds.length > 0) {
      const { error: cleanupError } = await supabase
        .from('CalendarEvent')
        .delete()
        .in('id', eventIds);

      if (cleanupError) {
        console.error('❌ Erreur nettoyage:', cleanupError);
      } else {
        console.log('✅ Événements de test supprimés');
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testClientEventsAccess().then(() => {
  console.log('\n✅ Test terminé');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
}); 