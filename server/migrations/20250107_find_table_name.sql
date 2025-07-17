-- =====================================================
-- TROUVER LE NOM EXACT DE LA TABLE
-- Date: 2025-01-07
-- =====================================================

-- 1. Lister toutes les tables qui contiennent "questionnaire"
SELECT table_name 
FROM information_schema.tables 
WHERE table_name ILIKE '%questionnaire%'
AND table_schema = 'public';

-- 2. Lister toutes les tables du schéma public
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 3. Chercher des tables avec "question" dans le nom
SELECT table_name 
FROM information_schema.tables 
WHERE table_name ILIKE '%question%'
AND table_schema = 'public'; 