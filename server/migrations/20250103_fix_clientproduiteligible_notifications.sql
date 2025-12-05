-- ============================================================================
-- Script de mise à jour des notifications ClientProduitEligible
-- Date: 2025-01-03
-- ============================================================================
-- 
-- Ce script met à jour les statuts des notifications pour les ClientProduitEligible
-- pour qu'elles apparaissent correctement dans le notification center.
--
-- Problème identifié :
-- - Les notifications pour ClientProduitEligible sont créées dans la table 'notification'
-- - Mais la route /api/admin/notifications ne les récupérait que depuis AdminNotification
-- - Solution : La route a été modifiée pour récupérer aussi depuis 'notification'
--
-- Ce script met à jour les statuts existants pour cohérence.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Mettre à jour les notifications avec status NULL ou invalide
-- ============================================================================
UPDATE "notification"
SET 
  status = CASE
    WHEN is_read = true THEN 'read'
    WHEN status = 'archived' THEN 'archived'
    WHEN status = 'replaced' THEN 'replaced'
    ELSE 'unread'
  END,
  updated_at = NOW()
WHERE 
  user_type = 'admin'
  AND notification_type IN (
    'admin_action_required',
    'documents_pending_validation_reminder',
    'documents_to_validate',
    'waiting_documents',
    'dossier_complete'
  )
  AND (status IS NULL OR status NOT IN ('unread', 'read', 'archived', 'replaced'));

-- ============================================================================
-- 2. S'assurer que hidden_in_list est false pour les notifications actives
-- ============================================================================
UPDATE "notification"
SET 
  hidden_in_list = false,
  updated_at = NOW()
WHERE 
  user_type = 'admin'
  AND notification_type IN (
    'admin_action_required',
    'documents_pending_validation_reminder',
    'documents_to_validate',
    'waiting_documents',
    'dossier_complete'
  )
  AND status NOT IN ('replaced', 'archived')
  AND (hidden_in_list IS NULL OR hidden_in_list = true);

-- ============================================================================
-- 3. Mettre à jour les notifications remplacées pour qu'elles soient bien marquées
-- ============================================================================
-- 3A. Marquer comme replaced celles qui ont été remplacées par un rappel SLA
UPDATE "notification"
SET 
  status = 'replaced',
  hidden_in_list = true,
  updated_at = NOW()
WHERE 
  user_type = 'admin'
  AND notification_type IN (
    'admin_action_required',
    'documents_pending_validation_reminder'
  )
  AND metadata->>'replaced_by_sla_reminder' = 'true'
  AND status != 'replaced';

-- 3B. FORCER hidden_in_list = true pour TOUTES les notifications avec status = 'replaced'
-- (Corrige le cas où status = 'replaced' mais hidden_in_list = false)
UPDATE "notification"
SET 
  hidden_in_list = true,
  updated_at = NOW()
WHERE 
  user_type = 'admin'
  AND notification_type IN (
    'admin_action_required',
    'documents_pending_validation_reminder',
    'documents_to_validate',
    'waiting_documents',
    'dossier_complete'
  )
  AND status = 'replaced'
  AND (hidden_in_list IS NULL OR hidden_in_list = false);

-- ============================================================================
-- 4. S'assurer que is_read correspond au status
-- ============================================================================
UPDATE "notification"
SET 
  is_read = (status = 'read'),
  updated_at = NOW()
WHERE 
  user_type = 'admin'
  AND notification_type IN (
    'admin_action_required',
    'documents_pending_validation_reminder',
    'documents_to_validate',
    'waiting_documents',
    'dossier_complete'
  )
  AND (
    (status = 'read' AND is_read = false) OR
    (status = 'unread' AND is_read = true)
  );

-- ============================================================================
-- 5. Statistiques avant/après
-- ============================================================================
DO $$
DECLARE
  total_notifications INTEGER;
  unread_count INTEGER;
  read_count INTEGER;
  archived_count INTEGER;
  replaced_count INTEGER;
BEGIN
  -- Compter les notifications ClientProduitEligible
  SELECT COUNT(*) INTO total_notifications
  FROM "notification"
  WHERE user_type = 'admin'
    AND notification_type IN (
      'admin_action_required',
      'documents_pending_validation_reminder',
      'documents_to_validate',
      'waiting_documents',
      'dossier_complete'
    );
  
  SELECT COUNT(*) INTO unread_count
  FROM "notification"
  WHERE user_type = 'admin'
    AND notification_type IN (
      'admin_action_required',
      'documents_pending_validation_reminder',
      'documents_to_validate',
      'waiting_documents',
      'dossier_complete'
    )
    AND status = 'unread';
  
  SELECT COUNT(*) INTO read_count
  FROM "notification"
  WHERE user_type = 'admin'
    AND notification_type IN (
      'admin_action_required',
      'documents_pending_validation_reminder',
      'documents_to_validate',
      'waiting_documents',
      'dossier_complete'
    )
    AND status = 'read';
  
  SELECT COUNT(*) INTO archived_count
  FROM "notification"
  WHERE user_type = 'admin'
    AND notification_type IN (
      'admin_action_required',
      'documents_pending_validation_reminder',
      'documents_to_validate',
      'waiting_documents',
      'dossier_complete'
    )
    AND status = 'archived';
  
  SELECT COUNT(*) INTO replaced_count
  FROM "notification"
  WHERE user_type = 'admin'
    AND notification_type IN (
      'admin_action_required',
      'documents_pending_validation_reminder',
      'documents_to_validate',
      'waiting_documents',
      'dossier_complete'
    )
    AND status = 'replaced';
  
  RAISE NOTICE '📊 Statistiques notifications ClientProduitEligible:';
  RAISE NOTICE '   Total: %', total_notifications;
  RAISE NOTICE '   Non lues: %', unread_count;
  RAISE NOTICE '   Lues: %', read_count;
  RAISE NOTICE '   Archivées: %', archived_count;
  RAISE NOTICE '   Remplacées: %', replaced_count;
END $$;

-- ============================================================================
-- 6. Vérifier que toutes les notifications ont un client_produit_id dans metadata
-- ============================================================================
DO $$
DECLARE
  missing_metadata_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_metadata_count
  FROM "notification"
  WHERE user_type = 'admin'
    AND notification_type IN (
      'admin_action_required',
      'documents_pending_validation_reminder',
      'documents_to_validate',
      'waiting_documents',
      'dossier_complete'
    )
    AND (
      metadata IS NULL OR
      metadata->>'client_produit_id' IS NULL
    )
    AND status != 'replaced';
  
  IF missing_metadata_count > 0 THEN
    RAISE WARNING '⚠️  % notifications sans client_produit_id dans metadata', missing_metadata_count;
  ELSE
    RAISE NOTICE '✅ Toutes les notifications ont un client_produit_id dans metadata';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- Vérification finale
-- ============================================================================
-- Vérifier que les notifications sont bien récupérables
SELECT 
  notification_type,
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE hidden_in_list = false) as visible_count,
  COUNT(*) FILTER (WHERE hidden_in_list = true) as hidden_count
FROM "notification"
WHERE user_type = 'admin'
  AND notification_type IN (
    'admin_action_required',
    'documents_pending_validation_reminder',
    'documents_to_validate',
    'waiting_documents',
    'dossier_complete'
  )
GROUP BY notification_type, status
ORDER BY notification_type, status;

-- ============================================================================
-- Vérification spécifique : S'assurer qu'aucune notification 'replaced' n'est visible
-- ============================================================================
DO $$
DECLARE
  replaced_visible_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO replaced_visible_count
  FROM "notification"
  WHERE user_type = 'admin'
    AND notification_type IN (
      'admin_action_required',
      'documents_pending_validation_reminder',
      'documents_to_validate',
      'waiting_documents',
      'dossier_complete'
    )
    AND status = 'replaced'
    AND hidden_in_list = false;
  
  IF replaced_visible_count > 0 THEN
    RAISE WARNING '⚠️  % notification(s) avec status=replaced sont encore visibles !', replaced_visible_count;
    RAISE NOTICE '🔧 Correction automatique en cours...';
    
    -- Corriger automatiquement
    UPDATE "notification"
    SET 
      hidden_in_list = true,
      updated_at = NOW()
    WHERE user_type = 'admin'
      AND notification_type IN (
        'admin_action_required',
        'documents_pending_validation_reminder',
        'documents_to_validate',
        'waiting_documents',
        'dossier_complete'
      )
      AND status = 'replaced'
      AND hidden_in_list = false;
    
    RAISE NOTICE '✅ Correction terminée';
  ELSE
    RAISE NOTICE '✅ Toutes les notifications replaced sont correctement masquées';
  END IF;
END $$;
