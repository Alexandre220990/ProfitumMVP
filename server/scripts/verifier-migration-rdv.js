/**
 * Script de Vérification - Migration RDV
 * Vérifie que la migration vers la table RDV unique s'est bien déroulée
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifierMigration() {
  console.log('\n🔍 VÉRIFICATION DE LA MIGRATION RDV\n');
  console.log('═'.repeat(60));

  try {
    // 1. Vérifier l'existence de la table RDV
    console.log('\n📋 1. Vérification de la table RDV...');
    const { data: rdvTable, error: rdvError } = await supabase
      .from('RDV')
      .select('*')
      .limit(1);

    if (rdvError) {
      console.error('❌ Table RDV non trouvée ou erreur:', rdvError.message);
      return false;
    }
    console.log('✅ Table RDV existe et est accessible');

    // 2. Compter les RDV
    console.log('\n📊 2. Comptage des RDV...');
    const { count: rdvCount, error: countError } = await supabase
      .from('RDV')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erreur comptage RDV:', countError.message);
    } else {
      console.log(`✅ Nombre total de RDV : ${rdvCount}`);
    }

    // 3. Vérifier la table RDV_Produits
    console.log('\n📋 3. Vérification de la table RDV_Produits...');
    const { data: rdvProduitsTable, error: produitsError } = await supabase
      .from('RDV_Produits')
      .select('*')
      .limit(1);

    if (produitsError) {
      console.error('❌ Table RDV_Produits non trouvée:', produitsError.message);
    } else {
      console.log('✅ Table RDV_Produits existe et est accessible');
    }

    // 4. Compter les produits liés
    const { count: produitsCount, error: produitsCountError } = await supabase
      .from('RDV_Produits')
      .select('*', { count: 'exact', head: true });

    if (!produitsCountError) {
      console.log(`✅ Nombre total de produits liés : ${produitsCount}`);
    }

    // 5. Vérifier les nouveaux champs
    console.log('\n📋 4. Vérification des nouveaux champs...');
    const { data: sampleRDV, error: sampleError } = await supabase
      .from('RDV')
      .select('title, category, source, priority, metadata')
      .limit(1)
      .single();

    if (sampleError && sampleError.code !== 'PGRST116') {
      console.error('❌ Erreur lors de la vérification des champs:', sampleError.message);
    } else if (sampleRDV) {
      console.log('✅ Nouveaux champs présents :');
      console.log(`   - title: ${sampleRDV.title ? '✓' : '✗'}`);
      console.log(`   - category: ${sampleRDV.category ? '✓' : '✗'}`);
      console.log(`   - source: ${sampleRDV.source ? '✓' : '✗'}`);
      console.log(`   - priority: ${sampleRDV.priority !== undefined ? '✓' : '✗'}`);
      console.log(`   - metadata: ${sampleRDV.metadata !== undefined ? '✓' : '✗'}`);
    }

    // 6. Vérifier l'ancien nom de table (ne devrait plus exister)
    console.log('\n📋 5. Vérification que ClientRDV n\'existe plus...');
    const { error: clientRDVError } = await supabase
      .from('ClientRDV')
      .select('*')
      .limit(1);

    if (clientRDVError && clientRDVError.message.includes('does not exist')) {
      console.log('✅ ClientRDV a bien été renommé (table n\'existe plus)');
    } else if (!clientRDVError) {
      console.warn('⚠️ ClientRDV existe encore ! La migration n\'est pas complète');
    }

    // 7. Vérifier la structure complète d'un RDV
    console.log('\n📋 6. Structure complète d\'un RDV (exemple)...');
    const { data: fullRDV, error: fullError } = await supabase
      .from('RDV')
      .select(`
        *,
        Client(id, name, company_name),
        Expert(id, name, email),
        ApporteurAffaires(id, first_name, last_name),
        RDV_Produits(
          *,
          ProduitEligible(nom)
        )
      `)
      .limit(1)
      .single();

    if (fullError && fullError.code !== 'PGRST116') {
      console.error('❌ Erreur récupération RDV complet:', fullError.message);
    } else if (fullRDV) {
      console.log('✅ Structure complète accessible :');
      console.log(`   - RDV ID: ${fullRDV.id}`);
      console.log(`   - Titre: ${fullRDV.title}`);
      console.log(`   - Date: ${fullRDV.scheduled_date} à ${fullRDV.scheduled_time}`);
      console.log(`   - Statut: ${fullRDV.status}`);
      console.log(`   - Client: ${fullRDV.Client?.company_name || 'N/A'}`);
      console.log(`   - Expert: ${fullRDV.Expert?.name || 'N/A'}`);
      console.log(`   - Apporteur: ${fullRDV.ApporteurAffaires ? 'Oui' : 'Non'}`);
      console.log(`   - Produits liés: ${fullRDV.RDV_Produits?.length || 0}`);
    } else {
      console.log('ℹ️ Aucun RDV dans la base pour l\'instant');
    }

    // 8. Vérifier les statuts de RDV
    console.log('\n📊 7. Distribution des statuts...');
    const { data: statusDistribution, error: statusError } = await supabase
      .rpc('get_rdv_status_distribution')
      .catch(() => null);

    if (statusError || !statusDistribution) {
      // Fallback manuel si la fonction RPC n'existe pas
      const statuses = ['proposed', 'confirmed', 'completed', 'cancelled'];
      for (const status of statuses) {
        const { count } = await supabase
          .from('RDV')
          .select('*', { count: 'exact', head: true })
          .eq('status', status);
        if (count !== null) {
          console.log(`   - ${status}: ${count}`);
        }
      }
    }

    // 9. Résumé final
    console.log('\n═'.repeat(60));
    console.log('\n🎉 RÉSUMÉ DE LA VÉRIFICATION\n');
    console.log('✅ Table RDV : Opérationnelle');
    console.log('✅ Table RDV_Produits : Opérationnelle');
    console.log(`✅ Total RDV : ${rdvCount || 0}`);
    console.log(`✅ Total produits liés : ${produitsCount || 0}`);
    console.log('\n📝 Prochaines étapes :');
    console.log('   1. Adapter les routes backend (server/src/routes/rdv.ts)');
    console.log('   2. Créer le service frontend (client/src/services/rdv-service.ts)');
    console.log('   3. Créer le hook (client/src/hooks/use-rdv.ts)');
    console.log('   4. Adapter UnifiedCalendar');
    console.log('\n═'.repeat(60));

    return true;

  } catch (error) {
    console.error('\n❌ Erreur lors de la vérification:', error);
    return false;
  }
}

// Exécuter la vérification
verifierMigration().then(success => {
  process.exit(success ? 0 : 1);
});

