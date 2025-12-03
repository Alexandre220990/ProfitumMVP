/**
 * Script de rattrapage : Créer les notifications initiales manquantes
 * pour les dossiers en attente de validation admin
 * 
 * À EXÉCUTER UNE SEULE FOIS pour rattraper les dossiers existants
 */

import { createClient } from '@supabase/supabase-js';
import { NotificationAggregationService } from '../services/notification-aggregation-service';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function createMissingNotifications() {
  try {
    console.log('🔄 [Script Rattrapage] Début de la création des notifications manquantes...');

    // 1. Récupérer tous les dossiers en attente de validation
    const { data: pendingDossiers, error: dossiersError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        created_at,
        updated_at,
        admin_eligibility_status,
        Client:clientId(id, name, company_name),
        ProduitEligible:produitId(id, nom, type_produit)
      `)
      .or('admin_eligibility_status.eq.pending,admin_eligibility_status.is.null');

    if (dossiersError) {
      console.error('❌ Erreur récupération dossiers:', dossiersError);
      return;
    }

    if (!pendingDossiers || pendingDossiers.length === 0) {
      console.log('ℹ️  Aucun dossier en attente trouvé.');
      return;
    }

    console.log(`📊 ${pendingDossiers.length} dossier(s) en attente trouvé(s)`);

    // 2. Récupérer tous les admins actifs
    const { data: admins, error: adminsError } = await supabase
      .from('Admin')
      .select('auth_user_id, email, name')
      .eq('is_active', true)
      .not('auth_user_id', 'is', null);

    if (adminsError) {
      console.error('❌ Erreur récupération admins:', adminsError);
      return;
    }

    if (!admins || admins.length === 0) {
      console.log('⚠️ Aucun admin actif trouvé.');
      return;
    }

    console.log(`📊 ${admins.length} admin(s) actif(s) trouvé(s)`);

    let notificationsCreated = 0;
    let notificationsSkipped = 0;
    const adminsAffected = new Set<string>();

    // 3. Pour chaque dossier, vérifier et créer les notifications manquantes
    for (const dossier of pendingDossiers) {
      const client = Array.isArray(dossier.Client) && dossier.Client.length > 0 
        ? dossier.Client[0] 
        : undefined;
      const produit = Array.isArray(dossier.ProduitEligible) && dossier.ProduitEligible.length > 0 
        ? dossier.ProduitEligible[0] 
        : undefined;

      const clientName = client?.company_name || client?.name || 'Client';
      const produitNom = produit?.nom || 'Dossier';

      for (const admin of admins) {
        if (!admin.auth_user_id) continue;

        // Vérifier si une notification existe déjà pour ce dossier et cet admin
        const { data: existing } = await supabase
          .from('notification')
          .select('id')
          .eq('user_id', admin.auth_user_id)
          .in('notification_type', ['admin_action_required', 'documents_pending_validation_reminder'])
          .eq('is_read', false)
          .neq('status', 'replaced')
          .or(`action_data->>client_produit_id.eq.${dossier.id},metadata->>client_produit_id.eq.${dossier.id}`)
          .maybeSingle();

        if (existing) {
          console.log(`⏭️  Notification existe déjà pour dossier ${dossier.id} (admin ${admin.email})`);
          notificationsSkipped++;
          continue;
        }

        // Créer la notification initiale (ENFANT - sera agrégée après)
        const { error: insertError } = await supabase
          .from('notification')
          .insert({
            user_id: admin.auth_user_id,
            user_type: 'admin',
            title: `📄 Documents à valider - ${produitNom}`,
            message: `Dossier ${produitNom} - Client ${clientName} - En attente de validation`,
            notification_type: 'admin_action_required',
            priority: 'high',
            is_read: false,
            status: 'unread',
            is_child: false, // Sera mis à true lors de l'agrégation
            hidden_in_list: false, // Sera mis à true lors de l'agrégation
            action_url: `/admin/dossiers/${dossier.id}`,
            action_data: {
              client_produit_id: dossier.id,
              action_required: 'validate_eligibility',
              client_id: client?.id,
              client_name: clientName,
              client_company: clientName,
              product_name: produitNom,
              product_type: produit?.type_produit
            },
            metadata: {
              client_produit_id: dossier.id,
              client_id: client?.id,
              client_name: clientName,
              produit_nom: produitNom,
              created_by_script: true,
              script_date: new Date().toISOString()
            },
            created_at: dossier.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error(`❌ Erreur création notification pour dossier ${dossier.id} (admin ${admin.email}):`, insertError);
          continue;
        }

        console.log(`✅ Notification créée pour dossier ${dossier.id} (admin ${admin.email})`);
        notificationsCreated++;
        adminsAffected.add(admin.auth_user_id);
      }
    }

    console.log('\n📊 RÉSUMÉ (Notifications enfants créées) :');
    console.log(`  ✅ ${notificationsCreated} notification(s) créée(s)`);
    console.log(`  ⏭️  ${notificationsSkipped} notification(s) déjà existante(s)`);
    console.log(`  📁 ${pendingDossiers.length} dossier(s) traité(s)`);
    console.log(`  👥 ${admins.length} admin(s) notifié(s)`);

    // 4. Agréger les notifications par client pour chaque admin
    if (adminsAffected.size > 0) {
      console.log('\n📊 [Agrégation] Création des notifications parent groupées par client...');
      let parentsCreated = 0;
      
      for (const adminId of adminsAffected) {
        const adminEmail = admins.find(a => a.auth_user_id === adminId)?.email || adminId;
        console.log(`  🔄 Agrégation pour admin ${adminEmail}...`);
        
        await NotificationAggregationService.aggregateNotificationsByClient(adminId);
        parentsCreated++;
      }
      
      console.log(`\n✅ ${parentsCreated} admin(s) avec notifications agrégées`);
    }

    console.log('\n✅ Script de rattrapage terminé avec succès !');
    console.log('\n💡 Les notifications sont maintenant groupées par client dans le centre de notifications.');

  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du script:', error);
    throw error;
  }
}

// Exécuter le script
if (require.main === module) {
  console.log('🚀 Démarrage du script de rattrapage des notifications...\n');
  createMissingNotifications()
    .then(() => {
      console.log('\n👋 Script terminé. Vous pouvez maintenant vérifier le centre de notifications admin.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erreur fatale:', error);
      process.exit(1);
    });
}

export { createMissingNotifications };

