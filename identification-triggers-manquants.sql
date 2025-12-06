-- ============================================================================
-- IDENTIFICATION DES TRIGGERS MANQUANTS SUR notification
-- Comparaison avec les 5 triggers attendus selon l'analyse
-- Date: 2025-12-05
-- ============================================================================

-- ============================================================================
-- 1. TRIGGERS ACTUELS (3 triggers détectés)
-- ============================================================================

SELECT 
    'Triggers actuels' as type,
    t.tgname as nom_trigger,
    pg_get_triggerdef(t.oid) as definition_trigger,
    CASE 
        WHEN t.tgenabled = 'O' THEN '✅ Activé'
        WHEN t.tgenabled = 'D' THEN '⚠️ Désactivé'
        ELSE '❓ Statut inconnu'
    END as statut,
    CASE 
        WHEN t.tgtype::integer & 2 = 2 THEN 'BEFORE'
        WHEN t.tgtype::integer & 64 = 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END as timing,
    CASE 
        WHEN t.tgtype::integer & 4 = 4 THEN 'INSERT'
        WHEN t.tgtype::integer & 8 = 8 THEN 'DELETE'
        WHEN t.tgtype::integer & 16 = 16 THEN 'UPDATE'
        WHEN t.tgtype::integer & 20 = 20 THEN 'INSERT OR UPDATE'
        WHEN t.tgtype::integer & 24 = 24 THEN 'UPDATE OR DELETE'
        ELSE 'Autre'
    END as evenement,
    pg_get_functiondef(t.tgfoid) as fonction_appelee
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'notification' 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- ============================================================================
-- 2. TRIGGERS ATTENDUS SELON L'ANALYSE (5 triggers)
-- ============================================================================

-- Les triggers typiques sur une table notification incluent :
WITH triggers_attendus AS (
    SELECT 
        'trigger_notification_updated_at' as nom,
        'Mise à jour automatique de updated_at' as description,
        'BEFORE INSERT OR UPDATE' as timing_attendu,
        'updated_at = NOW()' as action_attendu
    UNION ALL
    SELECT 
        'trigger_notification_children_count',
        'Mise à jour automatique de children_count pour notifications groupées',
        'AFTER INSERT OR UPDATE OR DELETE',
        'update_parent_children_count()'
    UNION ALL
    SELECT 
        'trigger_notification_validation',
        'Validation des données avant insertion/mise à jour',
        'BEFORE INSERT OR UPDATE',
        'Validation des contraintes'
    UNION ALL
    SELECT 
        'trigger_notification_archive',
        'Archivage automatique des notifications expirées',
        'AFTER UPDATE',
        'Vérification de expires_at'
    UNION ALL
    SELECT 
        'trigger_notification_parent_child',
        'Gestion automatique des relations parent/enfant',
        'BEFORE INSERT OR UPDATE',
        'Vérification de la cohérence parent/enfant'
)
SELECT 
    'Triggers attendus' as type,
    ta.nom as nom_trigger,
    ta.description,
    ta.timing_attendu,
    ta.action_attendu,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'notification' 
            AND t.tgname = ta.nom
            AND NOT t.tgisinternal
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT'
    END as statut
FROM triggers_attendus ta
ORDER BY ta.nom;

-- ============================================================================
-- 3. VÉRIFICATION PAR TYPE DE TRIGGER
-- ============================================================================

-- Trigger pour updated_at
SELECT 
    'Vérification updated_at' as type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'notification' 
            AND (t.tgname LIKE '%updated%' OR t.tgname LIKE '%update%')
            AND NOT t.tgisinternal
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT - À créer'
    END as statut,
    'Trigger pour mettre à jour automatiquement updated_at' as description
UNION ALL
-- Trigger pour children_count
SELECT 
    'Vérification children_count',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'notification' 
            AND (t.tgname LIKE '%children%' OR t.tgname LIKE '%parent%' OR t.tgname LIKE '%child%')
            AND NOT t.tgisinternal
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT - À créer'
    END,
    'Trigger pour mettre à jour children_count des notifications parent'
UNION ALL
-- Trigger de validation
SELECT 
    'Vérification validation',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'notification' 
            AND (t.tgname LIKE '%valid%' OR t.tgname LIKE '%check%' OR t.tgname LIKE '%constraint%')
            AND NOT t.tgisinternal
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT - À créer (optionnel)'
    END,
    'Trigger pour validation des données'
UNION ALL
-- Trigger d'archivage
SELECT 
    'Vérification archive',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'notification' 
            AND (t.tgname LIKE '%archive%' OR t.tgname LIKE '%expire%')
            AND NOT t.tgisinternal
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT - À créer (optionnel)'
    END,
    'Trigger pour archivage automatique'
UNION ALL
-- Trigger parent/child
SELECT 
    'Vérification parent_child',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'notification' 
            AND (t.tgname LIKE '%parent%' OR t.tgname LIKE '%child%')
            AND NOT t.tgisinternal
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT - À créer'
    END,
    'Trigger pour gestion des relations parent/enfant';

-- ============================================================================
-- 4. FONCTIONS DISPONIBLES POUR LES TRIGGERS
-- ============================================================================

-- Vérifier si les fonctions nécessaires existent
SELECT 
    'Fonctions disponibles' as type,
    p.proname as nom_fonction,
    pg_get_functiondef(p.oid) as definition_fonction,
    CASE 
        WHEN p.proname LIKE '%update%parent%children%' OR p.proname LIKE '%children%count%' THEN '✅ Pour trigger children_count'
        WHEN p.proname LIKE '%updated_at%' OR p.proname LIKE '%update_timestamp%' THEN '✅ Pour trigger updated_at'
        WHEN p.proname LIKE '%valid%' OR p.proname LIKE '%check%' THEN '✅ Pour trigger validation'
        WHEN p.proname LIKE '%archive%' OR p.proname LIKE '%expire%' THEN '✅ Pour trigger archive'
        ELSE 'ℹ️ Autre fonction'
    END as utilisation
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname LIKE '%notification%'
    OR p.proname LIKE '%update%parent%children%'
    OR p.proname LIKE '%updated_at%'
    OR p.proname LIKE '%update_timestamp%'
  )
ORDER BY p.proname;

-- ============================================================================
-- 5. RÉSUMÉ : TRIGGERS MANQUANTS
-- ============================================================================

SELECT 
    'Résumé' as type,
    'Triggers actuels' as element,
    COUNT(*)::text as valeur,
    'Triggers présents sur notification' as description
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'notification' 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT t.tgisinternal
UNION ALL
SELECT 
    'Résumé',
    'Triggers attendus',
    '5'::text,
    'Selon l''analyse complète'
UNION ALL
SELECT 
    'Résumé',
    'Triggers manquants',
    (5 - COUNT(*))::text,
    CASE 
        WHEN COUNT(*) < 5 THEN CONCAT('Il manque ', 5 - COUNT(*), ' trigger(s)')
        ELSE 'Tous présents'
    END
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'notification' 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT t.tgisinternal;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
