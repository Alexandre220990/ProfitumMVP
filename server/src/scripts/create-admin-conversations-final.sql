-- Script final pour créer les conversations admin
-- Version robuste sans CTE

-- Étape 1: Vérifier qu'il y a des admins
SELECT COUNT(*) as admin_count FROM authenticated_users WHERE role = 'admin';

-- Étape 2: Créer les conversations admin pour les clients
INSERT INTO conversations (
    id, type, participant_ids, title, description, status, 
    client_id, created_by, access_level, priority, category, 
    created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    'admin_support',
    ARRAY[c.id, (SELECT id FROM authenticated_users WHERE role = 'admin' ORDER BY created_at LIMIT 1)],
    'Support Administratif - ' || COALESCE(c.name, c.email),
    'Conversation automatique pour le support administratif du client',
    'active',
    c.id,
    (SELECT id FROM authenticated_users WHERE role = 'admin' ORDER BY created_at LIMIT 1),
    'private',
    'medium',
    'support',
    NOW(),
    NOW()
FROM "Client" c
WHERE NOT EXISTS (
    SELECT 1 FROM conversations conv 
    WHERE conv.client_id = c.id AND conv.type = 'admin_support'
);

-- Étape 3: Créer les conversations admin pour les experts
INSERT INTO conversations (
    id, type, participant_ids, title, description, status, 
    expert_id, created_by, access_level, priority, category, 
    created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    'admin_support',
    ARRAY[e.id, (SELECT id FROM authenticated_users WHERE role = 'admin' ORDER BY created_at LIMIT 1)],
    'Support Administratif - ' || COALESCE(e.name, e.email),
    'Conversation automatique pour le support administratif de l''expert',
    'active',
    e.id,
    (SELECT id FROM authenticated_users WHERE role = 'admin' ORDER BY created_at LIMIT 1),
    'private',
    'medium',
    'support',
    NOW(),
    NOW()
FROM "Expert" e
WHERE NOT EXISTS (
    SELECT 1 FROM conversations conv 
    WHERE conv.expert_id = e.id AND conv.type = 'admin_support'
);

-- Étape 4: Vérifier les résultats
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