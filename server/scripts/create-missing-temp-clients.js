#!/usr/bin/env node

/**
 * 👤 CRÉATION DES CLIENTS TEMPORAIRES MANQUANTS
 * Créer les clients temporaires pour les sessions existantes
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createMissingTempClients() {
  console.log('👤 CRÉATION DES CLIENTS TEMPORAIRES MANQUANTS');
  console.log('=' .repeat(60));

  try {
    // Récupérer toutes les sessions complétées
    const { data: sessions, error: sessionsError } = await supabase
      .from('TemporarySession')
      .select('*')
      .eq('completed', true)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('❌ Erreur récupération sessions:', sessionsError);
      return;
    }

    console.log(`✅ ${sessions.length} sessions complétées trouvées`);

    let createdCount = 0;

    for (const session of sessions) {
      console.log(`\n📊 Traitement session: ${session.session_token}`);

      // Vérifier si un client temporaire existe déjà
      const { data: existingClient, error: existingError } = await supabase
        .from('temporaryclient')
        .select('*')
        .eq('session_id', session.id)
        .single();

      if (existingClient) {
        console.log(`   ✅ Client temporaire existe déjà`);
        continue;
      }

      // Créer un client temporaire avec des données par défaut
      const tempClientData = {
        session_id: session.id,
        email: `simulateur_${session.session_token.substring(0, 8)}@example.com`,
        username: `Client_${session.session_token.substring(0, 8)}`,
        password: 'temp_password',
        company_name: `Entreprise_${session.session_token.substring(0, 8)}`,
        phone_number: '01 23 45 67 89',
        address: '123 Rue du Commerce',
        city: 'Paris',
        postal_code: '75001',
        siren: '123456789',
        statut: 'Actif',
        revenuannuel: 1000000,
        secteuractivite: 'Transport',
        nombreemployes: 25,
        ancienneteentreprise: 5
      };

      const { data: newClient, error: createError } = await supabase
        .from('temporaryclient')
        .insert(tempClientData)
        .select('*')
        .single();

      if (createError) {
        console.log(`❌ Erreur création client: ${createError.message}`);
      } else {
        createdCount++;
        console.log(`   ✅ Client temporaire créé: ${newClient.email}`);
      }
    }

    console.log('\n🎯 RÉSUMÉ:');
    console.log('─'.repeat(40));
    console.log(`📊 Sessions traitées: ${sessions.length}`);
    console.log(`🆕 Clients temporaires créés: ${createdCount}`);
    console.log(`✅ Opération terminée !`);

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécution
if (require.main === module) {
  createMissingTempClients().catch(console.error);
}

module.exports = { createMissingTempClients }; 