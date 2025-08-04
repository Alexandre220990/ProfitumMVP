-- Script de création des conversations admin automatiques
-- Version sécurisée avec vérifications

-- 1. Identifier l'admin principal (premier admin trouvé)
WITH admin_user AS (
    SELECT id FROM authenticated_users 
    WHERE role = 'admin' 
    ORDER BY created_at 
    LIMIT 1
)

-- 2. Créer les conversations admin pour les clients
INSERT INTO conversations (
    id,
    type,
    participant_ids,
    title,
    description,
    status,
    client_id,
    created_by,
    access_level,
    priority,
    category,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid() as id,
    'admin_support' as type,
    ARRAY[c.id, admin.id] as participant_ids,
    'Support Administratif - ' || COALESCE(c.name, c.email) as title,
    'Conversation automatique pour le support administratif du client' as description,
    'active' as status,
    c.id as client_id,
    admin.id as created_by,
    'private' as access_level,
    'medium' as priority,
    'support' as category,
    NOW() as created_at,
    NOW() as updated_at
FROM "Client" c
CROSS JOIN admin_user admin
WHERE NOT EXISTS (
    SELECT 1 FROM conversations conv 
    WHERE conv.client_id = c.id 
    AND conv.type = 'admin_support'
);

-- 3. Créer les conversations admin pour les experts
INSERT INTO conversations (
    id,
    type,
    participant_ids,
    title,
    description,
    status,
    expert_id,
    created_by,
    access_level,
    priority,
    category,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid() as id,
    'admin_support' as type,
    ARRAY[e.id, admin.id] as participant_ids,
    'Support Administratif - ' || COALESCE(e.name, e.email) as title,
    'Conversation automatique pour le support administratif de l''expert' as description,
    'active' as status,
    e.id as expert_id,
    admin.id as created_by,
    'private' as access_level,
    'medium' as priority,
    'support' as category,
    NOW() as created_at,
    NOW() as updated_at
FROM "Expert" e
CROSS JOIN admin_user admin
WHERE NOT EXISTS (
    SELECT 1 FROM conversations conv 
    WHERE conv.expert_id = e.id 
    AND conv.type = 'admin_support'
);

-- 4. Vérification des résultats
SELECT 
    'Clients avec conversations admin' as metric,
    COUNT(*) as count
FROM conversations 
WHERE type = 'admin_support' AND client_id IS NOT NULL

UNION ALL

SELECT 
    'Experts avec conversations admin' as metric,
    COUNT(*) as count
FROM conversations 
WHERE type = 'admin_support' AND expert_id IS NOT NULL

UNION ALL

SELECT 
    'Total conversations admin' as metric,
    COUNT(*) as count
FROM conversations 
WHERE type = 'admin_support'; 