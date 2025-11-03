-- ============================================================================
-- RECHERCHE : Trouver le nom exact de la table timeline
-- Date : 2025-11-03
-- ============================================================================

-- 1. Lister toutes les tables qui contiennent "timeline" ou "event"
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name ILIKE '%timeline%' 
    OR table_name ILIKE '%event%'
    OR table_name ILIKE '%history%'
    OR table_name ILIKE '%log%'
)
ORDER BY table_name;

-- 2. Chercher une table qui a les colonnes dossier_id, type, title, description
SELECT DISTINCT table_name
FROM information_schema.columns 
WHERE table_schema = 'public'
AND column_name IN ('dossier_id', 'type', 'title', 'description', 'actor_name')
GROUP BY table_name
HAVING COUNT(DISTINCT column_name) >= 4
ORDER BY table_name;

