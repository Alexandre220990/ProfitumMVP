-- Script de nettoyage des conversations orphelines
-- Version sécurisée avec vérifications préalables

-- 1. Identifier les conversations orphelines (sans liens métier)
WITH orphaned_conversations AS (
    SELECT 
        id,
        type,
        participant_ids,
        title,
        created_at
    FROM conversations
    WHERE 
        client_id IS NULL 
        AND expert_id IS NULL 
        AND dossier_id IS NULL
        AND (participant_ids @> ARRAY['00000000-0000-0000-0000-000000000000'::uuid] 
             OR participant_ids = '{}' 
             OR participant_ids IS NULL)
)

-- 2. Afficher les conversations orphelines avant suppression
SELECT 
    'Conversations orphelines à supprimer' as action,
    COUNT(*) as count
FROM orphaned_conversations;

-- 3. Afficher un échantillon des conversations orphelines
SELECT 
    id,
    type,
    participant_ids,
    title,
    created_at
FROM orphaned_conversations
LIMIT 5;

-- 4. Supprimer les conversations orphelines (décommenter pour exécuter)
/*
DELETE FROM conversations
WHERE 
    client_id IS NULL 
    AND expert_id IS NULL 
    AND dossier_id IS NULL
    AND (participant_ids @> ARRAY['00000000-0000-0000-0000-000000000000'::uuid] 
         OR participant_ids = '{}' 
         OR participant_ids IS NULL);
*/

-- 5. Vérification après nettoyage
SELECT 
    'Total conversations après nettoyage' as metric,
    COUNT(*) as count
FROM conversations; 