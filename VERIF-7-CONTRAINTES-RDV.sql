-- ============================================================================
-- VÉRIFICATION 7 : Contraintes sur la table RDV
-- ============================================================================

-- 1. VÉRIFIER LES CONTRAINTES DE CHECK SUR RDV
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public."RDV"'::regclass
  AND contype = 'c' -- 'c' = check constraint
ORDER BY conname;

-- 2. VÉRIFIER LES VALEURS ACTUELLES DE meeting_type UTILISÉES
SELECT DISTINCT meeting_type, COUNT(*) as count
FROM "RDV"
GROUP BY meeting_type
ORDER BY count DESC;

-- 3. VÉRIFIER LES VALEURS ACTUELLES DE status UTILISÉES
SELECT DISTINCT status, COUNT(*) as count
FROM "RDV"
GROUP BY status
ORDER BY count DESC;

-- 4. LISTER QUELQUES RDV EXEMPLES
SELECT 
    id,
    meeting_type,
    status,
    scheduled_date,
    scheduled_time,
    duration_minutes,
    created_at
FROM "RDV"
ORDER BY created_at DESC
LIMIT 10;

