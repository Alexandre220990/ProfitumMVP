-- ============================================================================
-- CONFIRMATION : 5 TRIGGERS SUR notification
-- ============================================================================

-- Résumé final avec détail
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

-- Liste complète des 5 triggers
SELECT 
    ROW_NUMBER() OVER (ORDER BY t.tgname) as numero,
    t.tgname as nom_trigger,
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
