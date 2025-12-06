#!/usr/bin/env ts-node
/**
 * ============================================================================
 * SCRIPT DE MIGRATION VERS TABLE UNIFIÉE notification
 * ============================================================================
 * 
 * Objectif: Migrer les données de AdminNotification et ExpertNotification
 * vers la table principale notification en s'assurant que le système supporte
 * bien tous les types d'utilisateurs (client, expert, admin, apporteur)
 * 
 * Date: 05 Décembre 2025
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Configuration Supabase manquante: SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

interface MigrationStats {
  adminNotifications: {
    total: number;
    migrated: number;
    failed: number;
    skipped: number;
  };
  expertNotifications: {
    total: number;
    migrated: number;
    failed: number;
    skipped: number;
  };
  errors: string[];
}

/**
 * Vérifier que la table notification supporte tous les user_type
 */
async function verifyNotificationSupport(): Promise<boolean> {
  console.log('🔍 Vérification du support des user_type...\n');

  // Vérifier les valeurs actuelles de user_type
  const { data: userTypes, error } = await supabase
    .from('notification')
    .select('user_type')
    .limit(1000);

  if (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    return false;
  }

  const uniqueTypes = new Set(userTypes?.map(n => n.user_type) || []);
  console.log('📊 Types d\'utilisateurs trouvés dans notification:');
  uniqueTypes.forEach(type => {
    console.log(`  ✅ ${type}`);
  });

  const requiredTypes = ['client', 'expert', 'admin', 'apporteur'];
  const missingTypes = requiredTypes.filter(type => !uniqueTypes.has(type));

  if (missingTypes.length > 0) {
    console.log(`\n⚠️  Types manquants: ${missingTypes.join(', ')}`);
    console.log('   (Cela peut être normal si aucun utilisateur de ce type n\'a encore reçu de notification)');
  } else {
    console.log('\n✅ Tous les types requis sont présents dans la base de données');
  }

  return true;
}

/**
 * Récupérer tous les admins actifs avec leur auth_user_id
 */
async function getAllActiveAdmins(): Promise<Map<string, string>> {
  const { data: admins, error } = await supabase
    .from('Admin')
    .select('id, auth_user_id, is_active')
    .eq('is_active', true);

  if (error) {
    console.error('❌ Erreur récupération admins:', error);
    return new Map();
  }

  const adminMap = new Map<string, string>();
  admins?.forEach(admin => {
    if (admin.auth_user_id) {
      adminMap.set(admin.id, admin.auth_user_id);
    }
  });

  console.log(`📊 ${adminMap.size} admin(s) actif(s) avec auth_user_id trouvé(s)`);
  return adminMap;
}

/**
 * Migrer les notifications AdminNotification vers notification
 */
async function migrateAdminNotifications(
  stats: MigrationStats,
  adminMap: Map<string, string>
): Promise<void> {
  console.log('\n📦 Migration des notifications AdminNotification...\n');

  // Récupérer toutes les notifications AdminNotification
  const { data: adminNotifications, error: fetchError } = await supabase
    .from('AdminNotification')
    .select('*')
    .order('created_at', { ascending: true });

  if (fetchError) {
    console.error('❌ Erreur récupération AdminNotification:', fetchError);
    stats.errors.push(`Erreur récupération AdminNotification: ${fetchError.message}`);
    return;
  }

  if (!adminNotifications || adminNotifications.length === 0) {
    console.log('ℹ️  Aucune notification AdminNotification à migrer');
    stats.adminNotifications.total = 0;
    return;
  }

  stats.adminNotifications.total = adminNotifications.length;
  console.log(`📊 ${adminNotifications.length} notification(s) AdminNotification trouvée(s)\n`);

  // Pour chaque notification AdminNotification, créer une notification pour chaque admin
  for (const adminNotif of adminNotifications) {
    try {
      // Vérifier si cette notification existe déjà dans notification
      // (pour éviter les doublons)
      const { data: existing } = await supabase
        .from('notification')
        .select('id')
        .eq('notification_type', adminNotif.type)
        .eq('title', adminNotif.title)
        .eq('message', adminNotif.message)
        .gte('created_at', new Date(adminNotif.created_at).toISOString())
        .lte('created_at', new Date(new Date(adminNotif.created_at).getTime() + 60000).toISOString())
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`⏭️  Notification déjà migrée: ${adminNotif.id} (${adminNotif.type})`);
        stats.adminNotifications.skipped++;
        continue;
      }

      // Créer une notification pour chaque admin actif
      let migratedCount = 0;
      for (const [adminId, authUserId] of adminMap.entries()) {
        try {
          const { error: insertError } = await supabase
            .from('notification')
            .insert({
              user_id: authUserId,
              user_type: 'admin',
              title: adminNotif.title,
              message: adminNotif.message,
              notification_type: adminNotif.type,
              priority: adminNotif.priority || 'medium',
              status: adminNotif.status || 'unread',
              is_read: adminNotif.is_read || false,
              read_at: adminNotif.read_at || null,
              action_url: adminNotif.action_url || null,
              action_data: adminNotif.metadata || {},
              metadata: {
                ...(adminNotif.metadata || {}),
                migrated_from: 'AdminNotification',
                original_id: adminNotif.id
              },
              archived_at: adminNotif.archived_at || null,
              created_at: adminNotif.created_at,
              updated_at: adminNotif.updated_at || adminNotif.created_at
            });

          if (insertError) {
            console.error(`❌ Erreur migration notification ${adminNotif.id} pour admin ${authUserId}:`, insertError);
            stats.errors.push(`Erreur migration AdminNotification ${adminNotif.id}: ${insertError.message}`);
            stats.adminNotifications.failed++;
          } else {
            migratedCount++;
          }
        } catch (error: any) {
          console.error(`❌ Erreur migration notification ${adminNotif.id} pour admin ${authUserId}:`, error);
          stats.errors.push(`Erreur migration AdminNotification ${adminNotif.id}: ${error.message}`);
          stats.adminNotifications.failed++;
        }
      }

      if (migratedCount > 0) {
        stats.adminNotifications.migrated += migratedCount;
        console.log(`✅ Notification ${adminNotif.id} migrée pour ${migratedCount} admin(s)`);
      }
    } catch (error: any) {
      console.error(`❌ Erreur traitement notification ${adminNotif.id}:`, error);
      stats.errors.push(`Erreur traitement AdminNotification ${adminNotif.id}: ${error.message}`);
      stats.adminNotifications.failed++;
    }
  }
}

/**
 * Migrer les notifications ExpertNotification vers notification
 */
async function migrateExpertNotifications(stats: MigrationStats): Promise<void> {
  console.log('\n📦 Migration des notifications ExpertNotification...\n');

  // Récupérer toutes les notifications ExpertNotification
  const { data: expertNotifications, error: fetchError } = await supabase
    .from('ExpertNotification')
    .select('*')
    .order('created_at', { ascending: true });

  if (fetchError) {
    console.error('❌ Erreur récupération ExpertNotification:', fetchError);
    stats.errors.push(`Erreur récupération ExpertNotification: ${fetchError.message}`);
    return;
  }

  if (!expertNotifications || expertNotifications.length === 0) {
    console.log('ℹ️  Aucune notification ExpertNotification à migrer');
    stats.expertNotifications.total = 0;
    return;
  }

  stats.expertNotifications.total = expertNotifications.length;
  console.log(`📊 ${expertNotifications.length} notification(s) ExpertNotification trouvée(s)\n`);

  for (const expertNotif of expertNotifications) {
    try {
      // Vérifier que l'expert a un auth_user_id
      if (!expertNotif.expert_id) {
        console.log(`⏭️  Notification ${expertNotif.id} sans expert_id, ignorée`);
        stats.expertNotifications.skipped++;
        continue;
      }

      const { data: expert, error: expertError } = await supabase
        .from('Expert')
        .select('id, auth_user_id')
        .eq('id', expertNotif.expert_id)
        .single();

      if (expertError || !expert?.auth_user_id) {
        console.log(`⏭️  Expert ${expertNotif.expert_id} sans auth_user_id, ignoré`);
        stats.expertNotifications.skipped++;
        continue;
      }

      // Vérifier si cette notification existe déjà
      const { data: existing } = await supabase
        .from('notification')
        .select('id')
        .eq('user_id', expert.auth_user_id)
        .eq('user_type', 'expert')
        .eq('notification_type', expertNotif.notification_type)
        .eq('title', expertNotif.title)
        .gte('created_at', new Date(expertNotif.created_at).toISOString())
        .lte('created_at', new Date(new Date(expertNotif.created_at).getTime() + 60000).toISOString())
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`⏭️  Notification déjà migrée: ${expertNotif.id}`);
        stats.expertNotifications.skipped++;
        continue;
      }

      // Migrer la notification
      const { error: insertError } = await supabase
        .from('notification')
        .insert({
          user_id: expert.auth_user_id,
          user_type: 'expert',
          title: expertNotif.title,
          message: expertNotif.message,
          notification_type: expertNotif.notification_type || 'expert_info',
          priority: expertNotif.priority || 'medium',
          status: expertNotif.status || 'unread',
          is_read: expertNotif.read_at ? true : false,
          read_at: expertNotif.read_at || null,
          action_url: null, // ExpertNotification n'a pas d'action_url
          action_data: {
            expert_id: expertNotif.expert_id,
            prospect_id: expertNotif.prospect_id,
            apporteur_id: expertNotif.apporteur_id
          },
          metadata: {
            migrated_from: 'ExpertNotification',
            original_id: expertNotif.id,
            acted_at: expertNotif.acted_at
          },
          expires_at: expertNotif.expires_at || null,
          created_at: expertNotif.created_at,
          updated_at: expertNotif.created_at
        });

      if (insertError) {
        console.error(`❌ Erreur migration notification ${expertNotif.id}:`, insertError);
        stats.errors.push(`Erreur migration ExpertNotification ${expertNotif.id}: ${insertError.message}`);
        stats.expertNotifications.failed++;
      } else {
        stats.expertNotifications.migrated++;
        console.log(`✅ Notification ${expertNotif.id} migrée pour expert ${expert.auth_user_id}`);
      }
    } catch (error: any) {
      console.error(`❌ Erreur traitement notification ${expertNotif.id}:`, error);
      stats.errors.push(`Erreur traitement ExpertNotification ${expertNotif.id}: ${error.message}`);
      stats.expertNotifications.failed++;
    }
  }
}

/**
 * Vérifier que tous les types d'utilisateurs sont bien supportés après migration
 */
async function verifyPostMigrationSupport(): Promise<void> {
  console.log('\n🔍 Vérification post-migration...\n');

  const { data: userTypes, error } = await supabase
    .from('notification')
    .select('user_type')
    .limit(10000);

  if (error) {
    console.error('❌ Erreur vérification:', error);
    return;
  }

  const typeCounts = new Map<string, number>();
  userTypes?.forEach(n => {
    const count = typeCounts.get(n.user_type) || 0;
    typeCounts.set(n.user_type, count + 1);
  });

  console.log('📊 Répartition par user_type après migration:');
  const requiredTypes = ['client', 'expert', 'admin', 'apporteur'];
  requiredTypes.forEach(type => {
    const count = typeCounts.get(type) || 0;
    const status = count > 0 ? '✅' : '⚠️';
    console.log(`  ${status} ${type}: ${count} notification(s)`);
  });
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage de la migration vers table unifiée notification\n');
  console.log('='.repeat(70));

  const stats: MigrationStats = {
    adminNotifications: {
      total: 0,
      migrated: 0,
      failed: 0,
      skipped: 0
    },
    expertNotifications: {
      total: 0,
      migrated: 0,
      failed: 0,
      skipped: 0
    },
    errors: []
  };

  try {
    // 1. Vérifier le support initial
    await verifyNotificationSupport();

    // 2. Récupérer les admins actifs
    const adminMap = await getAllActiveAdmins();

    // 3. Migrer AdminNotification
    await migrateAdminNotifications(stats, adminMap);

    // 4. Migrer ExpertNotification
    await migrateExpertNotifications(stats);

    // 5. Vérification post-migration
    await verifyPostMigrationSupport();

    // 6. Afficher les statistiques
    console.log('\n' + '='.repeat(70));
    console.log('📊 STATISTIQUES DE MIGRATION\n');
    console.log('AdminNotification:');
    console.log(`  - Total: ${stats.adminNotifications.total}`);
    console.log(`  - Migrées: ${stats.adminNotifications.migrated}`);
    console.log(`  - Échouées: ${stats.adminNotifications.failed}`);
    console.log(`  - Ignorées: ${stats.adminNotifications.skipped}`);
    console.log('\nExpertNotification:');
    console.log(`  - Total: ${stats.expertNotifications.total}`);
    console.log(`  - Migrées: ${stats.expertNotifications.migrated}`);
    console.log(`  - Échouées: ${stats.expertNotifications.failed}`);
    console.log(`  - Ignorées: ${stats.expertNotifications.skipped}`);

    if (stats.errors.length > 0) {
      console.log(`\n⚠️  ${stats.errors.length} erreur(s) rencontrée(s):`);
      stats.errors.slice(0, 10).forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
      if (stats.errors.length > 10) {
        console.log(`  ... et ${stats.errors.length - 10} autre(s) erreur(s)`);
      }
    } else {
      console.log('\n✅ Aucune erreur rencontrée');
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Migration terminée');
    console.log('\n💡 Prochaines étapes:');
    console.log('  1. Vérifier les données migrées dans la table notification');
    console.log('  2. Tester le système avec tous les types d\'utilisateurs');
    console.log('  3. Créer des vues de compatibilité si nécessaire');
    console.log('  4. Supprimer les tables redondantes après validation');

  } catch (error) {
    console.error('\n❌ Erreur fatale lors de la migration:', error);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  main().catch(console.error);
}

export { migrateAdminNotifications, migrateExpertNotifications, verifyNotificationSupport };
