-- Script de migration des conversations existantes
-- Version sécurisée avec vérifications

-- 1. Vérifier les tables de référence
SELECT 
    'Client' as table_name,
    COUNT(*) as count
FROM "Client"
UNION ALL
SELECT 
    'Expert' as table_name,
    COUNT(*) as count
FROM "Expert"
UNION ALL
SELECT 
    'ClientProduitEligible' as table_name,
    COUNT(*) as count
FROM "ClientProduitEligible";

-- 2. Identifier les conversations à nettoyer (avec UUIDs null)
SELECT 
    COUNT(*) as conversations_with_null_uuid
FROM conversations
WHERE participant_ids @> ARRAY['00000000-0000-0000-0000-000000000000'::uuid];

-- 3. Migration sécurisée (décommenter pour exécuter)
/*
-- A. Nettoyer les conversations avec UUIDs null
UPDATE conversations
SET participant_ids = array_remove(participant_ids, '00000000-0000-0000-0000-000000000000'::uuid)
WHERE participant_ids @> ARRAY['00000000-0000-0000-0000-000000000000'::uuid];

-- B. Supprimer les conversations vides après nettoyage
DELETE FROM conversations
WHERE array_length(participant_ids, 1) = 0;

-- C. Mettre à jour les statuts par défaut
UPDATE conversations
SET status = 'active'
WHERE status IS NULL;

-- D. Mettre à jour les niveaux d'accès par défaut
UPDATE conversations
SET access_level = 'private'
WHERE access_level IS NULL;

-- E. Mettre à jour les priorités par défaut
UPDATE conversations
SET priority = 'medium'
WHERE priority IS NULL;

-- F. Mettre à jour les catégories basées sur le type
UPDATE conversations
SET category = 
    CASE 
        WHEN type = 'expert_client' THEN 'support'
        WHEN type = 'admin_support' THEN 'administrative'
        WHEN type = 'internal' THEN 'internal'
        ELSE 'general'
    END
WHERE category IS NULL;
*/

-- 4. Vérification après migration (décommenter après exécution)
/*
SELECT 
    COUNT(*) as total_conversations,
    COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as with_status,
    COUNT(CASE WHEN access_level IS NOT NULL THEN 1 END) as with_access_level,
    COUNT(CASE WHEN priority IS NOT NULL THEN 1 END) as with_priority,
    COUNT(CASE WHEN category IS NOT NULL THEN 1 END) as with_category
FROM conversations;
*/ 