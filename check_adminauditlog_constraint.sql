-- Vérifier les valeurs autorisées par la contrainte AdminAuditLog_action_check

-- 1. Voir la définition exacte de la contrainte
SELECT 
    '1. DÉFINITION CONTRAINTE' as test,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = '"AdminAuditLog"'::regclass 
AND conname = 'AdminAuditLog_action_check';

-- 2. Voir les valeurs existantes dans AdminAuditLog pour comprendre les valeurs autorisées
SELECT 
    '2. VALEURS EXISTANTES' as test,
    action,
    COUNT(*) as nombre_occurrences
FROM "AdminAuditLog"
GROUP BY action
ORDER BY action;

-- 3. Voir quelques exemples d'actions
SELECT 
    '3. EXEMPLES ACTIONS' as test,
    action,
    table_name,
    description,
    created_at
FROM "AdminAuditLog"
ORDER BY created_at DESC
LIMIT 5;
