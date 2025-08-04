-- Script de test du système de conversations admin
-- Vérification complète de la cohérence

-- 1. Vérifier la structure de la table conversations
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

-- 2. Vérifier les conversations admin existantes
SELECT 
    'Conversations admin total' as metric,
    COUNT(*) as count
FROM conversations 
WHERE type = 'admin_support'

UNION ALL

SELECT 
    'Conversations admin avec client_id' as metric,
    COUNT(*) as count
FROM conversations 
WHERE type = 'admin_support' AND client_id IS NOT NULL

UNION ALL

SELECT 
    'Conversations admin avec expert_id' as metric,
    COUNT(*) as count
FROM conversations 
WHERE type = 'admin_support' AND expert_id IS NOT NULL

UNION ALL

SELECT 
    'Conversations admin orphelines' as metric,
    COUNT(*) as count
FROM conversations 
WHERE type = 'admin_support' 
AND client_id IS NULL 
AND expert_id IS NULL;

-- 3. Vérifier la cohérence avec les tables métier
SELECT 
    'Clients sans conversation admin' as metric,
    COUNT(*) as count
FROM "Client" c
WHERE NOT EXISTS (
    SELECT 1 FROM conversations conv 
    WHERE conv.client_id = c.id 
    AND conv.type = 'admin_support'
)

UNION ALL

SELECT 
    'Experts sans conversation admin' as metric,
    COUNT(*) as count
FROM "Expert" e
WHERE NOT EXISTS (
    SELECT 1 FROM conversations conv 
    WHERE conv.expert_id = e.id 
    AND conv.type = 'admin_support'
);

-- 4. Vérifier les triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%admin_conversation%'
ORDER BY trigger_name;

-- 5. Afficher un échantillon des conversations admin
SELECT 
    id,
    type,
    title,
    client_id,
    expert_id,
    created_by,
    access_level,
    priority,
    category,
    created_at
FROM conversations 
WHERE type = 'admin_support'
ORDER BY created_at DESC
LIMIT 5; 