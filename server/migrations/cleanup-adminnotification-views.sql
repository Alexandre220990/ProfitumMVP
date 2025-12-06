-- ============================================================================
-- NETTOYAGE FINAL - Suppression des vues de compatibilité AdminNotification
-- ============================================================================
-- 
-- ⚠️ ATTENTION: Ce script supprime les vues de compatibilité
-- Ne l'exécuter QUE lorsque :
-- 1. Toutes les références à AdminNotification et AdminNotificationWithStatus
--    ont été supprimées du code
-- 2. Tous les tests passent
-- 3. La migration est complètement validée
-- 
-- Date: 05 Décembre 2025
-- 

BEGIN;

-- ============================================================================
-- VÉRIFICATION PRÉALABLE
-- ============================================================================
-- Vérifier que les vues existent encore (si elles n'existent pas, c'est OK)

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
    RAISE NOTICE '✅ Vue AdminNotification existe - sera supprimée';
  ELSE
    RAISE NOTICE 'ℹ️ Vue AdminNotification n''existe pas - déjà supprimée';
  END IF;
  
  -- Vérifier AdminNotificationWithStatus
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'AdminNotificationWithStatus'
  ) INTO view_exists;
  
  IF view_exists THEN
    RAISE NOTICE '✅ Vue AdminNotificationWithStatus existe - sera supprimée';
  ELSE
    RAISE NOTICE 'ℹ️ Vue AdminNotificationWithStatus n''existe pas - déjà supprimée';
  END IF;
END $$;

-- ============================================================================
-- SUPPRESSION DES VUES
-- ============================================================================

-- Supprimer AdminNotificationWithStatus en premier (peut dépendre de AdminNotification)
DROP VIEW IF EXISTS "AdminNotificationWithStatus" CASCADE;

-- Supprimer AdminNotification
DROP VIEW IF EXISTS "AdminNotification" CASCADE;

-- ============================================================================
-- VÉRIFICATION POST-SUPPRESSION
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
-- NOTES POST-NETTOYAGE
-- ============================================================================
-- 
-- ✅ Les vues de compatibilité ont été supprimées
-- ✅ Le code doit maintenant utiliser directement :
--    - La table `notification` pour les notifications
--    - La table `AdminNotificationStatus` pour les statuts individuels
-- 
-- 📝 Vérifications à faire après :
-- 1. Tester tous les endpoints admin
-- 2. Vérifier qu'aucune erreur SQL ne se produit
-- 3. S'assurer que les notifications s'affichent correctement
-- 
-- 🔍 Pour vérifier qu'aucune référence n'existe plus :
-- ```bash
-- grep -r "AdminNotificationWithStatus" server/src/
-- grep -r "AdminNotification" server/src/ | grep -v "AdminNotificationStatus"
-- ```
