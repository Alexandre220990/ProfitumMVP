-- ============================================================================
-- IDENTIFICATION DU DERNIER TRIGGER MANQUANT SUR notification
-- 4 triggers présents, 5 attendus - Identifier lequel manque
-- Date: 05 Décembre 2025
-- ============================================================================

-- ============================================================================
-- 1. LISTE DES TRIGGERS ACTUELS (4 triggers)
-- ============================================================================

SELECT 
    'Triggers actuels' as type,
    t.tgname as nom_trigger,
    pg_get_triggerdef(t.oid) as definition_complete,
    CASE 
        WHEN t.tgenabled = 'O' THEN '✅ Activé'
        ELSE '⚠️ Désactivé'
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
        WHEN t.tgtype::integer & 28 = 28 THEN 'INSERT OR UPDATE OR DELETE'
        ELSE 'Autre'
    END as evenement
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'notification' 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- ============================================================================
-- 2. VÉRIFICATION PAR TYPE DE TRIGGER ATTENDU
-- ============================================================================

SELECT 
    'Vérification par type' as type,
    'updated_at' as trigger_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'notification' 
            AND (t.tgname LIKE '%updated%' OR t.tgname LIKE '%update_timestamp%')
            AND NOT t.tgisinternal
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT'
    END as statut
UNION ALL
SELECT 
    'Vérification par type',
    'children_count',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'notification' 
            AND (t.tgname LIKE '%children%' OR t.tgname LIKE '%parent%child%' OR t.tgname = 'trigger_update_parent_children_count')
            AND NOT t.tgisinternal
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT'
    END
UNION ALL
SELECT 
    'Vérification par type',
    'validation',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'notification' 
            AND (t.tgname LIKE '%valid%' OR t.tgname LIKE '%check%')
            AND NOT t.tgisinternal
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT'
    END
UNION ALL
SELECT 
    'Vérification par type',
    'archive',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'notification' 
            AND (t.tgname LIKE '%archive%' OR t.tgname LIKE '%expire%' OR t.tgname LIKE '%auto_archive%')
            AND NOT t.tgisinternal
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT'
    END
UNION ALL
SELECT 
    'Vérification par type',
    'parent_child',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'notification' 
            AND (t.tgname LIKE '%parent%child%' OR t.tgname LIKE '%manage%parent%')
            AND NOT t.tgisinternal
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT'
    END;

-- ============================================================================
-- 3. IDENTIFICATION DU TRIGGER MANQUANT
-- ============================================================================

WITH triggers_attendus AS (
    SELECT 'updated_at' as type, 'trigger_notification_updated_at' as nom_attendu
    UNION ALL SELECT 'children_count', 'trigger_update_parent_children_count'
    UNION ALL SELECT 'validation', 'trigger_notification_validation'
    UNION ALL SELECT 'archive', 'trigger_notification_auto_archive'
    UNION ALL SELECT 'parent_child', 'trigger_notification_manage_parent_child'
)
SELECT 
    'Trigger manquant' as type,
    ta.type as type_trigger,
    ta.nom_attendu,
    CASE 
        WHEN ta.type = 'updated_at' THEN 'Mise à jour automatique de updated_at'
        WHEN ta.type = 'children_count' THEN 'Mise à jour automatique de children_count'
        WHEN ta.type = 'validation' THEN 'Validation des données avant insertion/mise à jour'
        WHEN ta.type = 'archive' THEN 'Archivage automatique des notifications expirées'
        WHEN ta.type = 'parent_child' THEN 'Gestion automatique des relations parent/enfant'
    END as description,
    '❌ À créer' as statut
FROM triggers_attendus ta
WHERE NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'notification' 
    AND (
        (ta.type = 'updated_at' AND (t.tgname LIKE '%updated%' OR t.tgname LIKE '%update_timestamp%'))
        OR (ta.type = 'children_count' AND (t.tgname LIKE '%children%' OR t.tgname LIKE '%parent%child%' OR t.tgname = 'trigger_update_parent_children_count'))
        OR (ta.type = 'validation' AND (t.tgname LIKE '%valid%' OR t.tgname LIKE '%check%'))
        OR (ta.type = 'archive' AND (t.tgname LIKE '%archive%' OR t.tgname LIKE '%expire%' OR t.tgname LIKE '%auto_archive%'))
        OR (ta.type = 'parent_child' AND (t.tgname LIKE '%parent%child%' OR t.tgname LIKE '%manage%parent%'))
    )
    AND NOT t.tgisinternal
)
ORDER BY ta.type;

-- ============================================================================
-- 4. FONCTIONS DISPONIBLES POUR LES TRIGGERS
-- ============================================================================

SELECT 
    'Fonctions disponibles' as type,
    p.proname as nom_fonction,
    pg_get_function_arguments(p.oid) as arguments,
    CASE 
        WHEN p.proname LIKE '%update%parent%children%' OR p.proname LIKE '%children%count%' THEN '✅ Pour trigger children_count'
        WHEN p.proname LIKE '%updated_at%' OR p.proname LIKE '%update_timestamp%' THEN '✅ Pour trigger updated_at'
        WHEN p.proname LIKE '%valid%' OR p.proname LIKE '%check%' THEN '✅ Pour trigger validation'
        WHEN p.proname LIKE '%archive%' OR p.proname LIKE '%expire%' THEN '✅ Pour trigger archive'
        WHEN p.proname LIKE '%parent%child%' OR p.proname LIKE '%manage%parent%' THEN '✅ Pour trigger parent_child'
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
    OR p.proname LIKE '%valid%'
    OR p.proname LIKE '%archive%'
    OR p.proname LIKE '%parent%child%'
  )
ORDER BY p.proname;

-- ============================================================================
-- 5. RÉSUMÉ : QUEL TRIGGER CRÉER
-- ============================================================================

SELECT 
    'Résumé' as type,
    'Triggers présents' as element,
    COUNT(*)::text as valeur,
    'Triggers actuellement sur notification' as description
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
        WHEN COUNT(*) < 5 THEN CONCAT('Il manque ', 5 - COUNT(*), ' trigger(s) - Voir ci-dessus pour identifier lequel')
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
