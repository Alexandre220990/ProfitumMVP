-- Script de nettoyage des conversations admin orphelines
-- Supprime les conversations admin sans liens métier

-- Étape 1: Vérifier les conversations à supprimer
SELECT 
    'Conversations admin orphelines' as type,
    COUNT(*) as count
FROM conversations 
WHERE type = 'admin_support' 
AND client_id IS NULL 
AND expert_id IS NULL

UNION ALL

SELECT 
    'Conversations admin avec client_id' as type,
    COUNT(*) as count
FROM conversations 
WHERE type = 'admin_support' 
AND client_id IS NOT NULL

UNION ALL

SELECT 
    'Conversations admin avec expert_id' as type,
    COUNT(*) as count
FROM conversations 
WHERE type = 'admin_support' 
AND expert_id IS NOT NULL;

-- Étape 2: Afficher un échantillon des conversations orphelines
SELECT 
    id,
    type,
    participant_ids,
    title,
    created_at
FROM conversations 
WHERE type = 'admin_support' 
AND client_id IS NULL 
AND expert_id IS NULL
LIMIT 5;

-- Étape 3: Supprimer les conversations admin orphelines
DELETE FROM conversations 
WHERE type = 'admin_support' 
AND client_id IS NULL 
AND expert_id IS NULL;

-- Étape 4: Vérifier les résultats après nettoyage
SELECT 
    'Conversations admin restantes' as type,
    COUNT(*) as count
FROM conversations 
WHERE type = 'admin_support'

UNION ALL

SELECT 
    'Conversations admin avec client_id' as type,
    COUNT(*) as count
FROM conversations 
WHERE type = 'admin_support' 
AND client_id IS NOT NULL

UNION ALL

SELECT 
    'Conversations admin avec expert_id' as type,
    COUNT(*) as count
FROM conversations 
WHERE type = 'admin_support' 
AND expert_id IS NOT NULL; 