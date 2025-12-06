-- Vérification des triggers sur AdminNotification
SELECT 
    'Triggers AdminNotification' as type,
    t.tgname as nom_trigger,
    pg_get_triggerdef(t.oid) as definition,
    CASE 
        WHEN t.tgenabled = 'O' THEN '✅ Activé'
        ELSE '⚠️ Désactivé'
    END as statut
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'AdminNotification' 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- Résumé
SELECT 
    'Résumé AdminNotification' as type,
    COUNT(*) as total_triggers,
    CASE 
        WHEN COUNT(*) = 3 THEN '✅ Conforme (3 triggers)'
        WHEN COUNT(*) >= 3 THEN CONCAT('✅ ', COUNT(*), ' triggers (3+ attendus)')
        ELSE CONCAT('⚠️ Manque ', 3 - COUNT(*), ' trigger(s)')
    END as statut
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'AdminNotification' 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT t.tgisinternal;
