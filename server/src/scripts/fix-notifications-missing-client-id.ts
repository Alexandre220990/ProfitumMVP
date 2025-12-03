/**
 * Script de correction : Enrichir les notifications qui ont un client_produit_id mais pas de client_id
 * 
 * Problème : 50 notifications ignorées lors de la migration car client_id manquant
 * Solution : Récupérer le client_id depuis ClientProduitEligible et mettre à jour
 */

import { createClient } from '@supabase/supabase-js';
import { NotificationAggregationService } from '../services/notification-aggregation-service';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function fixNotificationsMissingClientId() {
  try {
    console.log('🔧 [Fix Client ID] Début de la correction des notifications sans client_id...\n');

    // 1. Récupérer les notifications sans client_id mais avec client_produit_id
    const { data: notificationsToFix, error: fetchError } = await supabase
      .from('notification')
      .select('id, user_id, action_data, metadata')
      .eq('user_type', 'admin')
      .in('notification_type', [
        'admin_action_required',
        'documents_pending_validation',
        'documents_pending_validation_reminder'
      ])
      .eq('is_read', false)
      .neq('status', 'replaced')
      .is('parent_id', null);

    if (fetchError) {
      console.error('❌ Erreur récupération notifications:', fetchError);
      return;
    }

    if (!notificationsToFix || notificationsToFix.length === 0) {
      console.log('ℹ️  Aucune notification à corriger.');
      return;
    }

    // Filtrer celles sans client_id
    const missingClientId = notificationsToFix.filter(n => {
      const hasClientId = n.action_data?.client_id || n.metadata?.client_id;
      const hasDossierId = n.action_data?.client_produit_id || n.metadata?.client_produit_id;
      return !hasClientId && hasDossierId;
    });

    console.log(`📊 ${notificationsToFix.length} notification(s) totale(s)`);
    console.log(`📊 ${missingClientId.length} notification(s) sans client_id mais avec dossier_id\n`);

    if (missingClientId.length === 0) {
      console.log('✅ Toutes les notifications ont déjà un client_id.');
      return;
    }

    let fixed = 0;
    let failed = 0;
    const adminsToAggregate = new Set<string>();

    // 2. Pour chaque notification, récupérer le client_id depuis le dossier
    for (const notif of missingClientId) {
      const dossierId = notif.action_data?.client_produit_id || notif.metadata?.client_produit_id;
      
      if (!dossierId) {
        console.warn(`⚠️  Notification ${notif.id} sans dossier_id, impossible de corriger`);
        failed++;
        continue;
      }

      try {
        // Récupérer le dossier et le client
        const { data: dossier, error: dossierError } = await supabase
          .from('ClientProduitEligible')
          .select(`
            clientId,
            Client:clientId(id, name, company_name)
          `)
          .eq('id', dossierId)
          .single();

        if (dossierError || !dossier) {
          console.warn(`⚠️  Dossier ${dossierId} non trouvé pour notification ${notif.id}`);
          failed++;
          continue;
        }

        const client = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
        const clientId = dossier.clientId;
        const clientName = client?.name || 'Client';
        const clientCompany = client?.company_name || clientName;

        if (!clientId) {
          console.warn(`⚠️  Client non trouvé dans dossier ${dossierId}`);
          failed++;
          continue;
        }

        // Mettre à jour la notification avec le client_id
        const updatedActionData = {
          ...(notif.action_data || {}),
          client_id: clientId,
          client_name: clientName,
          client_company: clientCompany
        };

        const updatedMetadata = {
          ...(notif.metadata || {}),
          client_id: clientId,
          client_name: clientName,
          client_company: clientCompany
        };

        const { error: updateError } = await supabase
          .from('notification')
          .update({
            action_data: updatedActionData,
            metadata: updatedMetadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', notif.id);

        if (updateError) {
          console.error(`❌ Erreur mise à jour notification ${notif.id}:`, updateError);
          failed++;
        } else {
          console.log(`✅ Notification ${notif.id} enrichie avec client ${clientCompany} (${clientId})`);
          fixed++;
          adminsToAggregate.add(notif.user_id);
        }

      } catch (error) {
        console.error(`❌ Erreur traitement notification ${notif.id}:`, error);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DE LA CORRECTION');
    console.log('='.repeat(60));
    console.log(`✅ ${fixed} notification(s) enrichie(s) avec client_id`);
    console.log(`❌ ${failed} notification(s) non corrigées`);
    console.log(`👥 ${adminsToAggregate.size} admin(s) à ré-agréger`);
    console.log('='.repeat(60));

    // 3. Ré-agréger les notifications pour les admins affectés
    if (adminsToAggregate.size > 0) {
      console.log('\n📊 Ré-agrégation des notifications pour les admins affectés...');
      
      for (const adminId of adminsToAggregate) {
        console.log(`  🔄 Agrégation pour admin ${adminId}...`);
        await NotificationAggregationService.aggregateNotificationsByClient(adminId);
      }

      console.log(`✅ ${adminsToAggregate.size} admin(s) ré-agrégé(s)`);
    }

    // 4. Vérification finale
    console.log('\n🔍 Vérification finale...');
    const { data: remaining } = await supabase
      .from('notification')
      .select('id', { count: 'exact', head: true })
      .eq('user_type', 'admin')
      .in('notification_type', [
        'admin_action_required',
        'documents_pending_validation',
        'documents_pending_validation_reminder'
      ])
      .eq('is_read', false)
      .neq('status', 'replaced')
      .is('parent_id', null);

    const { count: withClientId } = await supabase
      .from('notification')
      .select('id', { count: 'exact', head: true })
      .eq('user_type', 'admin')
      .in('notification_type', [
        'admin_action_required',
        'documents_pending_validation',
        'documents_pending_validation_reminder'
      ])
      .eq('is_read', false)
      .neq('status', 'replaced')
      .is('parent_id', null)
      .or('action_data->>client_id.not.is.null,metadata->>client_id.not.is.null');

    console.log(`\n📊 État final :`);
    console.log(`  - Notifications sans parent : ${remaining || 0}`);
    console.log(`  - Notifications avec client_id : ${withClientId || 0}`);
    
    const remainingCount = remaining || 0;
    const withClientIdCount = withClientId || 0;
    const missingClientIdCount = typeof remainingCount === 'number' && typeof withClientIdCount === 'number'
      ? remainingCount - withClientIdCount
      : 0;
    
    console.log(`  - Notifications sans client_id : ${missingClientIdCount}`);

    console.log('\n✅ Correction terminée avec succès !');
    console.log('\n💡 Prochaine étape : Vérifier le centre de notifications admin');
    console.log('   Les notifications devraient maintenant être toutes groupées.\n');

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    throw error;
  }
}

// Exécuter le script
if (require.main === module) {
  console.log('🚀 Démarrage de la correction des notifications sans client_id...\n');
  fixNotificationsMissingClientId()
    .then(() => {
      console.log('👋 Correction terminée.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erreur fatale:', error);
      process.exit(1);
    });
}

export { fixNotificationsMissingClientId };

