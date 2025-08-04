-- Script d'analyse des conversations existantes
-- Version sécurisée pour comprendre les données actuelles

-- 1. Analyser les types de conversations existants
SELECT 
    type,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM conversations
GROUP BY type
ORDER BY count DESC;

-- 2. Analyser les participants existants
SELECT 
    participant_ids,
    COUNT(*) as count
FROM conversations
GROUP BY participant_ids
ORDER BY count DESC
LIMIT 10;

-- 3. Vérifier les conversations avec des UUIDs valides
SELECT 
    id,
    type,
    participant_ids,
    title,
    created_at,
    CASE 
        WHEN participant_ids @> ARRAY['00000000-0000-0000-0000-000000000000'::uuid] 
        THEN 'CONTAINS_NULL_UUID'
        ELSE 'VALID_PARTICIPANTS'
    END as status
FROM conversations
WHERE participant_ids @> ARRAY['00000000-0000-0000-0000-000000000000'::uuid]
LIMIT 5;

-- 4. Compter les conversations par statut
SELECT 
    COALESCE(status, 'NULL') as status,
    COUNT(*) as count
FROM conversations
GROUP BY status
ORDER BY count DESC;

-- 5. Vérifier les relations possibles avec d'autres tables
-- Conversations qui pourraient être liées à des clients
SELECT 
    c.id,
    c.type,
    c.participant_ids,
    c.title,
    c.created_at
FROM conversations c
WHERE c.type = 'expert_client'
LIMIT 5;

-- 6. Analyser les titres pour identifier le contexte
SELECT 
    title,
    COUNT(*) as count
FROM conversations
WHERE title IS NOT NULL
GROUP BY title
ORDER BY count DESC
LIMIT 10; 