#!/usr/bin/env ts-node
/**
 * ============================================================================
 * SCRIPT DE CORRECTION DES RÉFÉRENCES À AdminNotification
 * ============================================================================
 * 
 * Objectif: Identifier toutes les références à AdminNotification et proposer
 * des corrections pour utiliser uniquement la table notification
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
  throw new Error('Configuration Supabase manquante');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Vérifier si la table AdminNotification existe encore
 */
async function checkAdminNotificationTable(): Promise<boolean> {
  console.log('🔍 Vérification de l\'existence de la table AdminNotification...\n');

  try {
    // Essayer de lire depuis AdminNotification
    const { data, error } = await supabase
      .from('AdminNotification')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('❌ La table AdminNotification n\'existe plus');
        return false;
      }
      throw error;
    }

    console.log('✅ La table AdminNotification existe encore');
    return true;
  } catch (error: any) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.log('❌ La table AdminNotification n\'existe plus');
      return false;
    }
    throw error;
  }
}

/**
 * Créer une vue de compatibilité AdminNotification si nécessaire
 */
async function createCompatibilityView(): Promise<void> {
  console.log('\n📋 Création d\'une vue de compatibilité...\n');

  // Note: On ne peut pas créer de vue directement via Supabase JS
  // Il faut le faire via SQL
  const sql = `
    -- Vue de compatibilité pour AdminNotification
    -- Cette vue permet au code existant de continuer à fonctionner
    -- tout en utilisant la table notification en arrière-plan
    
    CREATE OR REPLACE VIEW "AdminNotification" AS
    SELECT 
      n.id,
      n.notification_type as type,
      n.title,
      n.message,
      n.status,
      n.priority,
      n.metadata,
      n.action_url,
      NULL as action_label, -- Pas de colonne équivalente
      n.created_at,
      n.updated_at,
      n.read_at,
      n.archived_at,
      NULL as handled_by, -- Pas de colonne équivalente
      NULL as handled_at, -- Pas de colonne équivalente
      n.is_read,
      NULL as admin_notes -- Pas de colonne équivalente
    FROM notification n
    WHERE n.user_type = 'admin'
      AND (n.metadata->>'migrated_from' IS NULL OR n.metadata->>'migrated_from' != 'AdminNotification')
      OR n.metadata->>'migrated_from' = 'AdminNotification';
    
    COMMENT ON VIEW "AdminNotification" IS 'Vue de compatibilité pour AdminNotification. Utilise la table notification en arrière-plan.';
  `;

  console.log('⚠️  ATTENTION: Cette vue doit être créée manuellement via SQL');
  console.log('\nSQL à exécuter:');
  console.log('='.repeat(70));
  console.log(sql);
  console.log('='.repeat(70));
  console.log('\n💡 Exécutez ce SQL dans Supabase SQL Editor ou psql');
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Vérification des références à AdminNotification\n');
  console.log('='.repeat(70));

  try {
    // 1. Vérifier si la table existe
    const tableExists = await checkAdminNotificationTable();

    if (!tableExists) {
      console.log('\n⚠️  La table AdminNotification n\'existe plus.');
      console.log('   Le code qui l\'utilise doit être migré vers la table notification.\n');
      
      console.log('📋 Fichiers à corriger:');
      console.log('   1. server/src/services/NotificationTriggers.ts');
      console.log('   2. server/src/routes/admin-notifications.ts');
      console.log('   3. server/src/routes/admin.ts');
      console.log('   4. server/src/services/admin-notification-service.ts');
      console.log('   5. server/src/services/GmailService.ts');
      console.log('   6. server/src/routes/notifications-sse.ts');
      
      console.log('\n💡 Solutions possibles:');
      console.log('   Option 1: Créer une vue de compatibilité (temporaire)');
      console.log('   Option 2: Migrer tout le code vers notification (recommandé)');
      
      // Proposer de créer la vue
      await createCompatibilityView();
    } else {
      console.log('\n✅ La table AdminNotification existe encore.');
      console.log('   Vous pouvez soit:');
      console.log('   1. La supprimer et migrer le code');
      console.log('   2. La garder temporairement et créer une vue de compatibilité');
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  main().catch(console.error);
}

export { checkAdminNotificationTable, createCompatibilityView };
