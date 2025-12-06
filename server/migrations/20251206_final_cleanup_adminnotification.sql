-- ============================================================================
-- NETTOYAGE FINAL - Migration AdminNotificationStatus et suppression des vues
-- ============================================================================
-- 
-- Ce script effectue le nettoyage final de la migration AdminNotification :
-- 1. Migre AdminNotificationStatus pour référencer notification.id directement
-- 2. Met à jour les triggers/fonctions qui dépendent d'AdminNotification
-- 3. Supprime les vues de compatibilité AdminNotification et AdminNotificationWithStatus
-- 
-- ⚠️ ATTENTION: Exécuter APRÈS avoir vérifié que tout le code utilise notification directement
-- 
-- Date: 06 Décembre 2025
-- 

BEGIN;

-- ============================================================================
-- ÉTAPE 1: SUPPRIMER LE TRIGGER ET LA FONCTION QUI DÉPENDENT D'AdminNotification
-- ============================================================================

-- Supprimer le trigger qui dépend de la vue AdminNotification
DROP TRIGGER IF EXISTS trg_initialize_admin_notification_status ON "AdminNotification";
DROP TRIGGER IF EXISTS trg_initialize_admin_notification_status ON "notification";

-- Supprimer la fonction (elle sera recréée si nécessaire)
DROP FUNCTION IF EXISTS initialize_admin_notification_status();

-- ============================================================================
-- ÉTAPE 2: VÉRIFIER QUE LA CONTRAINTE FK A ÉTÉ SUPPRIMÉE
-- ============================================================================
-- La contrainte FK vers AdminNotification devrait déjà avoir été supprimée
-- lors de la création de la vue de compatibilité, mais on la supprime au cas où

DO $$
BEGIN
  -- Vérifier et supprimer toutes les contraintes FK de AdminNotificationStatus
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%AdminNotificationStatus%notification_id%'
    AND constraint_type = 'FOREIGN KEY'
  ) THEN
    -- Supprimer toutes les contraintes FK liées à notification_id
    ALTER TABLE "AdminNotificationStatus" 
    DROP CONSTRAINT IF EXISTS "AdminNotificationStatus_notification_id_fkey";
    
    RAISE NOTICE '✅ Contrainte FK supprimée';
  ELSE
    RAISE NOTICE 'ℹ️ Pas de contrainte FK à supprimer (déjà supprimée)';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 3: CRÉER UNE FONCTION POUR INITIALISER LES STATUTS (OPTIONNEL)
-- ============================================================================
-- Cette fonction peut être appelée depuis l'application lors de la création
-- d'une notification admin, au lieu d'utiliser un trigger

CREATE OR REPLACE FUNCTION initialize_admin_notification_status_for_notification(notif_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Créer une entrée de statut pour chaque admin existant
  INSERT INTO "AdminNotificationStatus" (notification_id, admin_id, is_read, is_archived)
  SELECT notif_id, a.id, FALSE, FALSE
  FROM "Admin" a
  WHERE a.is_active = TRUE
  ON CONFLICT (notification_id, admin_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION initialize_admin_notification_status_for_notification(UUID) IS 
  'Initialise les statuts individuels pour chaque admin actif lors de la création d''une notification admin. À appeler depuis l''application.';

-- ============================================================================
-- ÉTAPE 4: SUPPRIMER LES VUES DE COMPATIBILITÉ
-- ============================================================================

-- Supprimer AdminNotificationWithStatus en premier (peut dépendre de AdminNotification)
DROP VIEW IF EXISTS "AdminNotificationWithStatus" CASCADE;

-- Supprimer AdminNotification
DROP VIEW IF EXISTS "AdminNotification" CASCADE;

-- ============================================================================
-- ÉTAPE 5: VÉRIFICATION POST-SUPPRESSION
-- ============================================================================

DO $$
DECLARE
  view_exists boolean;
BEGIN
  -- Vérifier AdminNotification
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'AdminNotification'
  ) INTO view_exists;
  
  IF view_exists THEN
    RAISE WARNING '❌ ERREUR: Vue AdminNotification existe encore !';
  ELSE
    RAISE NOTICE '✅ Vue AdminNotification supprimée avec succès';
  END IF;
  
  -- Vérifier AdminNotificationWithStatus
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'AdminNotificationWithStatus'
  ) INTO view_exists;
  
  IF view_exists THEN
    RAISE WARNING '❌ ERREUR: Vue AdminNotificationWithStatus existe encore !';
  ELSE
    RAISE NOTICE '✅ Vue AdminNotificationWithStatus supprimée avec succès';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- NOTES IMPORTANTES POST-MIGRATION
-- ============================================================================
-- 
-- ✅ Les vues de compatibilité ont été supprimées
-- ✅ Le code doit maintenant utiliser directement :
--    - La table `notification` pour les notifications admin
--    - La table `AdminNotificationStatus` pour les statuts individuels
--    - La fonction `initialize_admin_notification_status_for_notification(UUID)` 
--      peut être appelée depuis l'application lors de la création d'une notification
-- 
-- 📝 Vérifications à faire après :
-- 1. Tester tous les endpoints admin
-- 2. Vérifier qu'aucune erreur SQL ne se produit
-- 3. S'assurer que les notifications s'affichent correctement
-- 4. Vérifier que les statuts individuels fonctionnent
-- 
-- 🔍 Pour vérifier qu'aucune référence n'existe plus :
-- ```bash
-- grep -r "AdminNotificationWithStatus" server/src/
-- grep -r "AdminNotification" server/src/ | grep -v "AdminNotificationStatus"
-- ```
--
