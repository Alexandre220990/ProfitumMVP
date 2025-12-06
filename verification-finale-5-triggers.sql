-- ============================================================================
-- VÉRIFICATION FINALE : 5 TRIGGERS SUR notification
-- ============================================================================

-- 1. Liste complète des triggers
SELECT 
    'Triggers finaux' as type,
    t.tgname as nom_trigger,
    pg_get_triggerdef(t.oid) as definition,
    CASE 
        WHEN t.tgenabled = 'O' THEN '✅ Activé'
        ELSE '⚠️ Désactivé'
    END as statut
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'notification' 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 2. Résumé final
SELECT 
    'Résumé final' as type,
    COUNT(*) as total_triggers,
    CASE 
        WHEN COUNT(*) = 5 THEN '✅ Conforme (5 triggers)'
        WHEN COUNT(*) >= 5 THEN CONCAT('✅ ', COUNT(*), ' triggers (5+ attendus)')
        ELSE CONCAT('⚠️ Manque ', 5 - COUNT(*), ' trigger(s)')
    END as statut
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'notification' 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT t.tgisinternal;

-- 3. Vérification par type de trigger
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
