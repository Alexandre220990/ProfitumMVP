-- ============================================================================
-- Script de test des changements de statut des notifications
-- Date: 2025-11-24
-- ============================================================================

-- Test 1: Marquer une notification comme lue
-- (Remplacez l'ID par une notification réelle de votre table)
DO $$
DECLARE
  test_notification_id UUID;
BEGIN
  -- Récupérer une notification unread pour le test
  SELECT id INTO test_notification_id
  FROM "AdminNotification"
  WHERE status = 'unread'
  LIMIT 1;
  
  IF test_notification_id IS NULL THEN
    RAISE NOTICE '⚠️ Aucune notification unread trouvée pour le test';
  ELSE
    -- Marquer comme lue
    UPDATE "AdminNotification"
    SET 
      status = 'read',
      is_read = TRUE,
      read_at = NOW(),
      updated_at = NOW()
    WHERE id = test_notification_id;
    
    -- Vérifier le résultat
    IF EXISTS (
      SELECT 1 FROM "AdminNotification"
      WHERE id = test_notification_id
        AND status = 'read'
        AND is_read = TRUE
        AND read_at IS NOT NULL
    ) THEN
      RAISE NOTICE '✅ Test 1 RÉUSSI: Notification marquée comme lue correctement';
    ELSE
      RAISE NOTICE '❌ Test 1 ÉCHOUÉ: La notification n''a pas été mise à jour correctement';
    END IF;
    
    -- Remettre en unread pour les autres tests
    UPDATE "AdminNotification"
    SET 
      status = 'unread',
      is_read = FALSE,
      read_at = NULL,
      updated_at = NOW()
    WHERE id = test_notification_id;
  END IF;
END $$;

-- Test 2: Archiver une notification
DO $$
DECLARE
  test_notification_id UUID;
BEGIN
  -- Récupérer une notification read pour le test
  SELECT id INTO test_notification_id
  FROM "AdminNotification"
  WHERE status = 'read'
  LIMIT 1;
  
  -- Si pas de notification read, utiliser une unread
  IF test_notification_id IS NULL THEN
    SELECT id INTO test_notification_id
    FROM "AdminNotification"
    WHERE status = 'unread'
    LIMIT 1;
  END IF;
  
  IF test_notification_id IS NULL THEN
    RAISE NOTICE '⚠️ Aucune notification trouvée pour le test d''archivage';
  ELSE
    -- Archiver
    UPDATE "AdminNotification"
    SET 
      status = 'archived',
      archived_at = NOW(),
      updated_at = NOW()
    WHERE id = test_notification_id;
    
    -- Vérifier le résultat
    IF EXISTS (
      SELECT 1 FROM "AdminNotification"
      WHERE id = test_notification_id
        AND status = 'archived'
        AND archived_at IS NOT NULL
    ) THEN
      RAISE NOTICE '✅ Test 2 RÉUSSI: Notification archivée correctement';
    ELSE
      RAISE NOTICE '❌ Test 2 ÉCHOUÉ: La notification n''a pas été archivée correctement';
    END IF;
    
    -- Remettre en unread pour les autres tests
    UPDATE "AdminNotification"
    SET 
      status = 'unread',
      is_read = FALSE,
      archived_at = NULL,
      updated_at = NOW()
    WHERE id = test_notification_id;
  END IF;
END $$;

-- Test 3: Vérifier la contrainte CHECK (essayer d'insérer un statut invalide)
DO $$
BEGIN
  BEGIN
    -- Essayer d'insérer avec un statut invalide (devrait échouer)
    INSERT INTO "AdminNotification" (type, title, message, status)
    VALUES ('test', 'Test', 'Test', 'pending');
    
    RAISE NOTICE '❌ Test 3 ÉCHOUÉ: La contrainte CHECK n''a pas bloqué un statut invalide';
    ROLLBACK;
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✅ Test 3 RÉUSSI: La contrainte CHECK bloque correctement les statuts invalides';
  END;
END $$;

-- Test 4: Vérifier la synchronisation status/is_read
SELECT 
  'Test 4: Vérification synchronisation status/is_read' as test_name,
  COUNT(*) FILTER (WHERE status = 'read' AND is_read = TRUE) as read_ok,
  COUNT(*) FILTER (WHERE status = 'read' AND is_read = FALSE) as read_incoherent,
  COUNT(*) FILTER (WHERE status = 'unread' AND is_read = FALSE) as unread_ok,
  COUNT(*) FILTER (WHERE status = 'unread' AND is_read = TRUE) as unread_incoherent,
  COUNT(*) FILTER (WHERE status = 'archived') as archived_count
FROM "AdminNotification";

-- Test 5: Vérifier les compteurs
SELECT 
  'Test 5: Compteurs par statut' as test_name,
  COUNT(*) FILTER (WHERE status = 'unread') as unread_count,
  COUNT(*) FILTER (WHERE status = 'read') as read_count,
  COUNT(*) FILTER (WHERE status = 'archived') as archived_count,
  COUNT(*) FILTER (WHERE status = 'unread' AND is_read = FALSE) as unread_with_is_read_false,
  COUNT(*) FILTER (WHERE status = 'read' AND is_read = TRUE) as read_with_is_read_true
FROM "AdminNotification";

-- Résumé final
SELECT 
  '✅ RÉSUMÉ FINAL' as summary,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE status = 'unread') as unread,
  COUNT(*) FILTER (WHERE status = 'read') as read,
  COUNT(*) FILTER (WHERE status = 'archived') as archived,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_remaining,
  COUNT(*) FILTER (WHERE is_read IS NULL) as is_read_null
FROM "AdminNotification";

